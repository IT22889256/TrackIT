# greedy_logic.py
import math
from datetime import datetime, timedelta
# from firebase_admin import firestore # Only needed for Timestamp type hint if used

# --- Thresholds and Parameters (Same as before) ---
EXPIRY_SOON_DAYS = 7
LOW_STOCK_THRESHOLDS = { 'kg': 1, 'g': 100, 'unit': 2, 'pcs': 2, 'l': 1, 'ml': 100, 'default': 1 }
DEFAULT_PURCHASE_QUANTITIES = { 'kg': 1, 'g': 100, 'unit': 1, 'pcs': 1, 'l': 1, 'ml': 100, 'default': 1 }
PRIORITY_SCORES = {'Essential': 100, 'Important': 50, 'Optional': 10}
LOW_STOCK_BONUS = 30
EXPIRY_SOON_BONUS = 50

# --- Helper Functions (get_item_unit, get_low_stock_threshold_for_item, get_default_purchase_unit_quantity, parse_date) ---
# (Keep these exactly as in the previous version)
def get_item_unit(item):
    unit = item.get('measurementUnit', '').lower()
    if unit in ['kg', 'g', 'unit', 'pcs', 'l', 'ml']:
        unit_map = {'pcs': 'unit'}
        return unit_map.get(unit, unit)
    desc_lower = item.get('description', '').lower()
    if 'kg' in desc_lower: return 'kg'
    if ' g' in desc_lower and 'kg' not in desc_lower: return 'g'
    if ' l' in desc_lower and 'ml' not in desc_lower: return 'l'
    if 'ml' in desc_lower: return 'ml'
    return 'unit'

def get_low_stock_threshold_for_item(item):
    unit = get_item_unit(item)
    return LOW_STOCK_THRESHOLDS.get(unit, LOW_STOCK_THRESHOLDS['default'])

def get_default_purchase_unit_quantity(item):
    unit = get_item_unit(item)
    return DEFAULT_PURCHASE_QUANTITIES.get(unit, DEFAULT_PURCHASE_QUANTITIES['default'])

def parse_date(date_input):
    if not date_input: return None
    if isinstance(date_input, datetime): return date_input.date()
    if isinstance(date_input, dict) and 'seconds' in date_input and 'nanoseconds' in date_input:
        try:
            ts = date_input['seconds'] + date_input['nanoseconds'] / 1e9
            return datetime.fromtimestamp(ts).date()
        except Exception as e: print(f"Timestamp dict error: {e}"); return None
    if isinstance(date_input, str):
        for fmt in ('%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%d', '%m/%d/%Y', '%Y/%m/%d'):
            try: return datetime.strptime(date_input, fmt).date()
            except ValueError: continue
    print(f"Date parse warn: {date_input} (Type: {type(date_input)})")
    return None


# --- Main Greedy Algorithm Logic ---
def generate_budget_shopping_list_logic(inventory_items, user_budget):
    """
    Generates a budget shopping list using a two-pass greedy approach:
    1. Initial allocation based on default purchase units and value/cost.
    2. Second pass iterates through selected items to increase quantities using remaining budget.
    """
    candidate_items = []
    current_date_obj = datetime.now().date()
    print(f"Running 2-pass greedy logic. Budget: {user_budget}, Items: {len(inventory_items)}.")

    # --- Step 1 & 2: Filter and Score Candidate Items ---
    # (This part remains the same - determines which items are *eligible*)
    for item in inventory_items:
        # (Validation logic for priority, current_stock, unit_price etc.)
        priority = item.get('priority')
        current_stock = item.get('currentStock')
        unit_price = item.get('unitprice')
        description = item.get('description')
        item_id = item.get('id', description)
        try:
            current_stock = float(current_stock) if current_stock is not None else None
            unit_price = float(unit_price) if unit_price is not None else None
        except (ValueError, TypeError) as e: print(f"Warn: Invalid num: '{description}' ({item_id}): {e}. Skip."); continue
        if priority not in PRIORITY_SCORES or current_stock is None or unit_price is None or not description or unit_price <= 0:
            print(f"Warn: Missing/invalid field: '{description}' ({item_id}). Skip.")
            continue

        is_low_stock, is_expiring_soon = False, False
        threshold = get_low_stock_threshold_for_item(item)
        if current_stock < threshold: is_low_stock = True

        expiry_date_obj = parse_date(item.get('expiryDate'))
        if expiry_date_obj:
            days_until_expiry = (expiry_date_obj - current_date_obj).days
            if 0 <= days_until_expiry <= EXPIRY_SOON_DAYS: is_expiring_soon = True

        is_candidate = False
        if priority == 'Essential' and (is_low_stock or is_expiring_soon): is_candidate = True
        elif priority == 'Important' and (is_low_stock or is_expiring_soon): is_candidate = True

        if is_candidate:
            base_score = PRIORITY_SCORES.get(priority, 0)
            urgency_bonus = (LOW_STOCK_BONUS if is_low_stock else 0) + (EXPIRY_SOON_BONUS if is_expiring_soon else 0)
            final_score = base_score + urgency_bonus
            default_unit_quantity = get_default_purchase_unit_quantity(item)
            cost_per_default_unit = default_unit_quantity * unit_price
            item_unit = get_item_unit(item)
            value_per_cost = final_score / cost_per_default_unit if cost_per_default_unit > 0 else 0
            reason = (("Low Stock " + ("(Expiring)" if is_expiring_soon else "")) if is_low_stock else ("Near Expiry" if is_expiring_soon else "Priority Need"))

            if cost_per_default_unit > 0 and final_score > 0:
                 candidate_items.append({
                     'id': item_id, 'description': description, 'priorityScore': final_score,
                     'unitprice': unit_price, 'valuePerCost': value_per_cost,
                     'defaultPurchaseQuantity': default_unit_quantity,
                     'costPerDefaultUnit': cost_per_default_unit,
                     'reason': reason, 'unit': item_unit
                 })

    # --- Step 3: Sort Candidates ---
    sorted_candidates = sorted(candidate_items, key=lambda x: x['valuePerCost'], reverse=True)
    print(f"Found {len(sorted_candidates)} candidate items after filtering.")

    # --- Step 4: First Pass - Greedy Allocation with Default Quantities ---
    intermediate_shopping_list = {} # Use dict { item_id: item_details }
    remaining_budget = float(user_budget)

    print("--- Starting First Pass (Default Quantities) ---")
    for candidate in sorted_candidates:
        cost = candidate['costPerDefaultUnit']
        if cost <= remaining_budget:
            print(f"  Adding '{candidate['description']}' (Cost: {cost:.2f}, Value/Cost: {candidate['valuePerCost']:.2f})")
            intermediate_shopping_list[candidate['id']] = {
                "id": candidate['id'], "description": candidate['description'],
                "unit": candidate['unit'], "unitprice": candidate['unitprice'],
                "valuePerCost": candidate['valuePerCost'], # Store for sorting in second pass
                "quantity": candidate['defaultPurchaseQuantity'], # Start with default qty (numeric)
                "cost": cost, # Current total cost (numeric)
                "reason": candidate['reason'],
                "defaultPurchaseQuantity": candidate['defaultPurchaseQuantity'], # For increments
                "costPerDefaultUnit": cost # For increments
            }
            remaining_budget -= cost

    print(f"--- First Pass Complete. Items: {len(intermediate_shopping_list)}. Remaining Budget: {remaining_budget:.2f} ---")

    # --- Step 5: Second Pass - Increment Quantities (Revised Logic) ---
    if remaining_budget > 0 and intermediate_shopping_list:
        print("--- Starting Second Pass (Increment Quantities) ---")
        # Get items currently in the list and sort them by value/cost to prioritize increments
        items_in_list_for_increment = sorted(
            list(intermediate_shopping_list.values()),
            key=lambda x: x['valuePerCost'], # Prioritize incrementing high-value items first within each pass
            reverse=True
        )

        # Loop passes as long as we successfully increment *something*
        while True: # Keep looping through passes until no more increments are made
            increment_made_in_this_pass = False
            print(f"  Starting increment pass. Budget: {remaining_budget:.2f}")

            for item in items_in_list_for_increment: # Try to increment each item in the sorted list
                item_id = item['id']
                # Ensure we're working with the latest data from the dictionary
                current_item_data = intermediate_shopping_list[item_id]
                increment_cost = current_item_data['costPerDefaultUnit']

                # Check if adding one more default unit fits the budget
                if increment_cost > 0 and increment_cost <= remaining_budget:
                    print(f"    Incrementing '{current_item_data['description']}' (Cost: +{increment_cost:.2f}). Budget left: {remaining_budget - increment_cost:.2f}")

                    # Update the item in the main dictionary
                    current_item_data['quantity'] += current_item_data['defaultPurchaseQuantity']
                    current_item_data['cost'] += increment_cost
                    remaining_budget -= increment_cost
                    increment_made_in_this_pass = True
                    # Continue to the next item in the list for this pass

            # If we completed a full pass through all items without making any increments, stop
            if not increment_made_in_this_pass:
                print("  No more increments fit the remaining budget in this pass.")
                break # Exit the while loop

        print(f"--- Second Pass Complete. Remaining Budget: {remaining_budget:.2f} ---")
    else:
         print("--- Skipping Second Pass (No remaining budget or empty initial list) ---")


    # --- Step 6: Format Final List ---
    final_shopping_list = []
    final_items_sorted = sorted(list(intermediate_shopping_list.values()), key=lambda x: x['description']) # Sort alphabetically

    for item in final_items_sorted:
        quantity_str = f"{item['quantity']} {item['unit']}"
        if item['unit'] in ['g', 'kg', 'ml', 'l'] and isinstance(item['quantity'], float) and not item['quantity'].is_integer():
             quantity_str = f"{item['quantity']:.1f} {item['unit']}" # Format float quantities

        final_shopping_list.append({
            "description": item['description'],
            "quantity": quantity_str, # Final display string
            "cost": round(item['cost'], 2), # Final rounded cost
            "reason": item['reason']
        })

    print(f"Final list has {len(final_shopping_list)} items.")
    return final_shopping_list