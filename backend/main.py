import veryfi
import json
import sys

# Veryfi API credentials
client_id = "vrfT9wsksPVUvZ42jrsON77abhjOGgW0PhsxjYb"
client_secret = "RJjakEXgrCpAZDrSdmcapjNesWHUmVfg0VDDRB4Py8S23rSnneSxF8ekmxcmHbgKTNftimtjMDUAXbVDBRc4g6uu6EFij9Wa6ezz9Y3zIWSaFwY8hlzE0NrnrGWjoVfd"
username = "stocktrack8"
api_key = "ef0924c60fbf111c1bc9a3f8618f99fc"

# Initialize Veryfi client
client = veryfi.Client(client_id, client_secret, username, api_key)

def main():
    if len(sys.argv) < 2:
        print("Usage: python main.py <image_url> [--type <processing_type>]")
        sys.exit(1)

    image_url = sys.argv[1]
    processing_type = sys.argv[3] if len(sys.argv) > 3 and sys.argv[2] == '--type' else None

    try:
        if processing_type == 'expiry':
            # Process for expiry date detection
            result = client.process_document_url(image_url, ["Other"])
        else:
            # Default processing for receipts
            result = client.process_document_url(image_url, ["Grocery", "Travel"])
        
        print(json.dumps(result))
        
    except veryfi.errors.VeryfiClientError as e:
        error_data = {"status": "error", "message": f"Veryfi Client Error: {e}"}
        print(json.dumps(error_data))
        sys.exit(1)
    except Exception as e:
        error_data = {"status": "error", "message": f"Unexpected Error: {e}"}
        print(json.dumps(error_data))
        sys.exit(1)

if __name__ == "__main__":
    main()