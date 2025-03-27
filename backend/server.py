from flask import Flask, jsonify
import subprocess
import json

app = Flask(__name__)

@app.route('/upload', methods=['POST'])
def upload():
    try:
        result = subprocess.run(['python', 'main.py'], capture_output=True, text=True)
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