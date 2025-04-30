# server.py
from flask import Flask, jsonify, request, abort
import subprocess
import json
import os
import sys
# Note: No firebase_admin imports needed for the core logic here anymore
# Keep auth import ONLY if check_auth still uses it (requires key file if so)
# from firebase_admin import auth

# --- Local Imports ---
from greedy_logic import generate_budget_shopping_list_logic

app = Flask(__name__)

# --- Firebase Admin SDK Initialization & Auth Decorator REMOVED ---
# WARNING: Endpoint /generate-shopping-list is UNSECURED without authentication.
# Implement manual token verification or another auth method for production.


# --- Existing /upload endpoint (Assumed functional) ---
@app.route('/upload', methods=['POST'])
def upload():
    # (Keep your existing /upload code here)
    # Ensure it doesn't rely on firebase_admin if you removed initialization entirely.
    try:
        data = request.get_json()
        image_url = data.get('imageUrl')
        if not image_url:
            return jsonify({'status': 'error', 'message': 'imageUrl is required'}), 400
        main_py = os.path.join(os.path.dirname(__file__), 'main.py')
        if not os.path.exists(main_py):
            return jsonify({'status': 'error', 'message': 'main.py not found'}), 500
        # Set encoding explicitly if needed
        result = subprocess.run(['python', main_py, image_url], capture_output=True, text=True, encoding='utf-8', check=False, timeout=30)
        if result.returncode != 0:
            return jsonify({'status': 'error', 'message': 'OCR script error', 'details': result.stderr[:500]}), 500
        try:
            return jsonify(json.loads(result.stdout.strip()))
        except Exception as e:
            return jsonify({'status': 'error', 'message': f'Bad OCR JSON: {e}'}), 500
    except subprocess.TimeoutExpired:
        return jsonify({'status': 'error', 'message': 'OCR timeout.'}), 504
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Server error in upload: {e}'}), 500


# --- Expiry Date Endpoint ---
# --- Expiry Date Endpoint ---
@app.route('/expirydate', methods=['POST'])
def expirydate():
    try:
        data = request.get_json()
        image_url = data.get('imageUrl')
        if not image_url:
            return jsonify({'status': 'error', 'message': 'imageUrl is required'}), 400

        expiry_py = os.path.join(os.path.dirname(__file__), 'main.py')
        if not os.path.exists(expiry_py):
            return jsonify({'status': 'error', 'message': 'Expiry processing script not found'}), 500

        # Execute the main.py script with the image URL and type 'expiry'
        result = subprocess.run(
            ['python', expiry_py, image_url, '--type', 'expiry'],
            capture_output=True,
            text=True,
            encoding='utf-8',
            check=False,  # Don't raise an exception for non-zero exit codes
            timeout=60  # Increased timeout
        )

        print("=== EXPIRY PROCESSING RESULT ===")
        print(f"Return code: {result.returncode}")
        print("Standard output:")
        print(result.stdout)
        print("Standard error:")
        print(result.stderr)
        print("===============================")

        if result.returncode != 0:
            print(f"Error in expiry processing: {result.stderr}")
            return jsonify({'status': 'error', 'message': 'Expiry processing error', 'details': result.stderr[:500]}), 500

        # Parse the JSON output from main.py
        try:
            output_lines = result.stdout.strip().split('\n')
            print(6666666666666666666)
            print(output_lines)

            parsed_data = None
            for line in reversed(output_lines):  # Check from the end in case there's other output
                try:
                    parsed_data = json.loads(line)
                    if 'ocr_text' in parsed_data:  # Assuming your JSON has 'ocr_text'
                        return jsonify({'status': 'success', 'data': parsed_data}), 200
                except json.JSONDecodeError:
                    continue  # This line wasn't valid JSON

            # If no JSON with ocr_text was found
            return jsonify({'status': 'error', 'message': 'OCR text not found in response'}), 500

        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Output that couldn't be parsed: {result.stdout}")
            return jsonify({'status': 'error', 'message': f'Failed to parse expiry processing result: {e}'}), 500

    except subprocess.TimeoutExpired:
        return jsonify({'status': 'error', 'message': 'Expiry processing timed out.'}), 504
    except Exception as e:
        import traceback
        print(f"Server error in /expirydate: {e}\n{traceback.format_exc()}")
        return jsonify({'status': 'error', 'message': f'Server error in expirydate: {e}'}), 500 

# --- Endpoint for Generating Shopping List (NO AUTHENTICATION) ---
@app.route('/generate-shopping-list', methods=['POST'])
# @check_auth # Decorator REMOVED
def generate_list_endpoint():
    # This endpoint now trusts the data sent by the client.
    # Add robust input validation.
    try:
        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'Missing JSON request body'}), 400

        user_budget = data.get('budget')
        inventory_items = data.get('inventory') # Get inventory list from request body

        # --- Input Validation ---
        if user_budget is None:
            return jsonify({'status': 'error', 'message': 'Missing budget field'}), 400
        try:
            user_budget_float = float(user_budget)
            if user_budget_float <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            return jsonify({'status': 'error', 'message': 'Budget must be a positive number'}), 400

        if inventory_items is None:
            return jsonify({'status': 'error', 'message': 'Missing inventory field'}), 400
        if not isinstance(inventory_items, list):
            return jsonify({'status': 'error', 'message': 'Inventory must be a list'}), 400

        print(f"Received request: budget {user_budget_float}, {len(inventory_items)} items.")

        # --- Call the Greedy Algorithm Logic ---
        # Pass the received inventory and validated budget
        shopping_list = generate_budget_shopping_list_logic(inventory_items, user_budget_float)

        print(f"Generated shopping list with {len(shopping_list)} items.")
        return jsonify(shopping_list), 200 # Return JSON array directly

    except Exception as e:
        import traceback
        print(f"Error Traceback:\n{traceback.format_exc()}")
        return jsonify({'status': 'error', 'message': f'Server error generating list: {e}'}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Flask server on host 0.0.0.0 port {port}")
    # Use debug=False and a production server (Waitress/Gunicorn) for deployment
    app.run(host='0.0.0.0', port=port, debug=True)