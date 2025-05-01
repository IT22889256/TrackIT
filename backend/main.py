import veryfi
import json
import sys


#-------04
client_id = "vrfji7kW164OeOgDp7PMMOdlicksUagKoBO5W4Y"
client_secret = "R75pyRIV0UmHwvu5D3SraOKbyIc7FOmefrGaH4r9U45zTv1SyJgyez8OKnrefEhfn9yeGuSHR8NkvpsFlYyaGWTfHJHcmiZz4YA3maY3osIZHGsT6hbb411xAxSpozcI"
username = "favourites172"
api_key = "3f42fbcb5c0b6543965c1694617deb48"



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