# greedy_logic.py
import math
from datetime import datetime, timedelta
# Use typing for clarity if needed, e.g., from firebase_admin import firestore for Timestamp type hint
# But logic doesn't strictly require the import if only checking type via isinstance or duck-typing

# --- Thresholds and Parameters (as defined by user) ---
EXPIRY_SOON_DAYS = 7
LOW_STOCK_THRESHOLDS = {
    'kg': 1,
    'g': 100,
    'unit': 2,
    'pcs': 2, # Treat pcs as unit
    'l': 1,   # Treat l as kg equivalent
    'ml': 100,# Treat ml as g equivalent
    'default': 1 # Fallback threshold if unit is unknown/missing
}
DEFAULT_PURCHASE_QUANTITIES = {
    'kg': 1,
    'g': 100,
    'unit': 1,
    'pcs': 1,
    'l': 1,
    'ml': 100,
    'default': 1 # Fallback purchase quantity
}
# Priority Scoring (using case-sensitive keys matching potential Firestore values)
PRIORITY_SCORES = {'Essential': 100, 'Important': 50, 'Optional': 10}
LOW_STOCK_BONUS = 30
EXPIRY_SOON_BONUS = 50

# --- Helper Function to Determine Unit ---
def get_item_unit(item):
    """Determines the measurement unit, prioritizing the 'measurementUnit' field."""
    unit = item.get('measurementUnit', '').lower() # Get unit, default to empty string, lowercase
    if unit in ['kg', 'g', 'unit', 'pcs', 'l', 'ml']:
        # Normalize units if needed (e.g., pcs -> unit)
        unit_map = {'pcs': 'unit'}
        return unit_map.get(unit, unit)

    # Fallback: Infer from description (less reliable) - Keep simple for now
    desc_lower = item.get('description', '').lower()
    if 'kg' in desc_lower: return 'kg'
    if ' g' in desc_lower and 'kg' not in desc_lower: return 'g' # Space before 'g' to avoid 'kg'
    if ' l' in desc_lower and 'ml' not in desc_lower: return 'l' # Space before 'l'
    if 'ml' in desc_lower: return 'ml'

    # print(f"Warning: Could not determine unit for '{item.get('description')}', using 'unit'.")
    return 'unit' # Default to 'unit' if not found

# --- Helper Function: Get Threshold ---
def get_low_stock_threshold_for_item(item):
    """Gets the low stock threshold based on the item's unit."""
    unit = get_item_unit(item)
    return LOW_STOCK_THRESHOLDS.get(unit, LOW_STOCK_THRESHOLDS['default'])

# --- Helper Function: Get Purchase Quantity ---
def get_purchase_quantity_for_item(item):
    """Gets the default purchase quantity based on the item's unit."""
    unit = get_item_unit(item)
    # Future enhancement: Add logic for target stock levels here if needed
    return DEFAULT_PURCHASE_QUANTITIES.get(unit, DEFAULT_PURCHASE_QUANTITIES['default'])

# --- Helper Function: Parse Date ---
def parse_date(date_input):
    """
    Parses various date inputs (datetime, Firestore Timestamp dict, common strings)
    into a timezone-naive Python date object. Returns None if parsing fails.
    """
    if not date_input: return None
    # Handles datetime objects (e.g., from Admin SDK context if used elsewhere)
    if isinstance(date_input, datetime):
        return date_input.date()
    # Handles Firestore Timestamp passed as dict from client SDK
    if isinstance(date_input, dict) and 'seconds' in date_input and 'nanoseconds' in date_input:
        try:
            ts = date_input['seconds'] + date_input['nanoseconds'] / 1e9
            return datetime.fromtimestamp(ts).date()
        except Exception as e:
            print(f"Error converting dict timestamp: {e}")
            return None
    # Handles common string formats
    if isinstance(date_input, str):
        for fmt in ('%Y-%m-%dT%H:%M:%S.%fZ', # ISO format from JS toISOString()
                    '%Y-%m-%dT%H:%M:%SZ',
                    '%Y-%m-%d', # Date only YYYY-MM-DD
                    '%m/%d/%Y', # Common US format MM/DD/YYYY
                    '%Y/%m/%d'): # YYYY/MM/DD
            try: return datetime.strptime(date_input, fmt).date()
            except ValueError: continue
    # Optionally handle direct date objects if they can occur
    # if isinstance(date_input, date): return date_input # Python's date object

    print(f"Warning: Could not parse date input: {date_input} (Type: {type(date_input)})")
    return None


# --- Main Greedy Algorithm Logic ---
def generate_budget_shopping_list_logic(inventory_items, user_budget):
    """
    Generates a budget-friendly shopping list using a greedy approach.

    Args:
        inventory_items: A list of dictionaries, where each dictionary
                         represents an inventory item with fields like
                         'id', 'description', 'priority', 'currentStock',
                         'unitprice', 'expiryDate', 'measurementUnit'. Assumes
                         these items represent the current aggregated state.
        user_budget: The maximum budget allowed for the shopping list.

    Returns:
        A list of dictionaries representing the items to include in the shopping list.
    """
    candidate_items = []
    current_date_obj = datetime.now().date()
    print(f"Running greedy logic for budget: {user_budget} with {len(inventory_items)} inventory items.")

    for item in inventory_items:
        is_low_stock, is_expiring_soon = False, False
        days_until_expiry = None

        # --- Extract and Validate essential fields ---
        priority = item.get('priority')
        current_stock = item.get('currentStock')
        unit_price = item.get('unitprice')
        description = item.get('description')
        item_id = item.get('id', description) # Use ID from Firestore or fallback

        try: # Safely convert numeric types
            current_stock = float(current_stock) if current_stock is not None else None
            unit_price = float(unit_price) if unit_price is not None else None
        except (ValueError, TypeError) as e:
            print(f"Warning: Invalid numeric stock/price in item '{description}' (ID: {item_id}): {e}. Skipping.")
            continue

        # Check essential fields before proceeding
        if priority not in PRIORITY_SCORES:
             print(f"Warning: Invalid or missing priority '{priority}' for item '{description}' (ID: {item_id}). Skipping.")
             continue
        if current_stock is None:
             print(f"Warning: Missing currentStock for item '{description}' (ID: {item_id}). Skipping.")
             continue
        if unit_price is None:
             print(f"Warning: Missing unitprice for item '{description}' (ID: {item_id}). Skipping.")
             continue
        if not description:
             print(f"Warning: Missing description for item (ID: {item_id}). Skipping.")
             continue
        if unit_price <= 0:
             print(f"Warning: Skipping item '{description}' (ID: {item_id}) due to zero or negative unit price.")
             continue

        # --- A. Check Low Stock ---
        threshold = get_low_stock_threshold_for_item(item)
        if current_stock < threshold:
            is_low_stock = True

        # --- B. Check Expiry ---
        expiry_date_obj = parse_date(item.get('expiryDate'))
        if expiry_date_obj:
            days_until_expiry = (expiry_date_obj - current_date_obj).days
            # Consider items expiring today or within the threshold as "soon"
            if 0 <= days_until_expiry <= EXPIRY_SOON_DAYS:
                is_expiring_soon = True
            # Optional: Log if item is already expired
            # elif days_until_expiry < 0:
            #     print(f"Info: Item '{description}' (ID: {item_id}) expired {abs(days_until_expiry)} days ago.")

        # --- C. Determine if Item is a Candidate ---
        is_candidate = False
        # Use case-sensitive priority check matching the PRIORITY_SCORES keys
        if priority == 'Essential' and (is_low_stock or is_expiring_soon):
            is_candidate = True
        elif priority == 'Important' and (is_low_stock or is_expiring_soon):
            is_candidate = True
        # Example: Include Optional only if low stock
        # elif priority == 'Optional' and is_low_stock:
        #    is_candidate = True

        # --- D. If Candidate, Calculate Score and Add ---
        if is_candidate:
            base_score = PRIORITY_SCORES.get(priority, 0) # Get score for the priority
            urgency_bonus = (LOW_STOCK_BONUS if is_low_stock else 0) + \
                            (EXPIRY_SOON_BONUS if is_expiring_soon else 0)
            final_score = base_score + urgency_bonus

            purchase_quantity_num = get_purchase_quantity_for_item(item)
            purchase_cost = purchase_quantity_num * unit_price
            item_unit = get_item_unit(item) # Get unit for display/storage

            # Value metric: Score per unit of currency (e.g., Score per Rupee)
            value_per_cost = final_score / purchase_cost if purchase_cost > 0 else 0

            reason_parts = []
            if is_low_stock: reason_parts.append("Low Stock")
            if is_expiring_soon: reason_parts.append("Near Expiry")
            reason = ", ".join(reason_parts) if reason_parts else "Priority Need"


            # Add to candidates list if valid
            if purchase_cost > 0 and final_score > 0:
                 candidate_items.append({
                     'id': item_id,
                     'description': description,
                     'priorityScore': final_score,
                     'unitprice': unit_price,
                     'valuePerCost': value_per_cost, # Key for sorting
                     'purchaseQuantity': purchase_quantity_num, # The numeric quantity to buy
                     'purchaseCost': purchase_cost,
                     'reason': reason,
                     'unit': item_unit # Store unit for display formatting later
                 })
            # else: # Optional logging for excluded items
                 # print(f"Info: Item '{description}' (ID: {item_id}) calculated zero cost or score, excluding.")

    # --- Step 3: Sort Candidates ---
    # Sort by valuePerCost (descending) - most value for money first
    sorted_candidates = sorted(candidate_items, key=lambda x: x['valuePerCost'], reverse=True)
    print(f"Found {len(sorted_candidates)} candidate items for the list after filtering and scoring.")

    # --- Step 4: Greedy Allocation ---
    shopping_list = []
    remaining_budget = float(user_budget) # Ensure budget is treated as float

    for candidate in sorted_candidates:
        cost = candidate['purchaseCost']
        # Ensure item has a cost and fits within the remaining budget
        if cost > 0 and cost <= remaining_budget:
            # Format quantity with unit for the final list display
            quantity_str = f"{candidate['purchaseQuantity']} {candidate['unit']}"

            shopping_list.append({
                "description": candidate['description'],
                "quantity": quantity_str, # Display string including unit
                "cost": round(cost, 2), # Round cost to 2 decimal places
                "reason": candidate['reason'] # Include reason for context
            })
            remaining_budget -= cost # Deduct cost from budget
        # else: # Optional: Log items that didn't fit budget
             # print(f"Item '{candidate['description']}' (Cost: {cost:.2f}) did not fit remaining budget ({remaining_budget:.2f})")

    print(f"Generated shopping list with {len(shopping_list)} items. Remaining budget: {remaining_budget:.2f}")
    return shopping_list