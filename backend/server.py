# server.py
from flask import Flask, jsonify, request
import subprocess
import json
import os

app = Flask(__name__)

@app.route('/upload', methods=['POST'])
def upload():
    try:
        data = request.get_json()
        image_url = data.get('imageUrl')

        if not image_url:
            return jsonify({'status': 'error', 'message': 'imageUrl is required'}), 400

        result = subprocess.run(['python', 'main.py', image_url], capture_output=True, text=True) #pass image url as argument.
        print("Subprocess Error:", result.stderr)

        api_response = result.stdout.strip()
        print("Veryfi API Response:", api_response)

        try:
            json_data = json.loads(api_response)
            return jsonify(json_data)
        except json.JSONDecodeError as e:
            return jsonify({
                'status': 'error',
                'message': f"Invalid JSON response: {str(e)}"
            }), 500

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)