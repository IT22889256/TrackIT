import veryfi
import json
import sys

# client_id = "vrfJb83IaW4IbK6Eg28H7AbzyW7G4nN32Iw1NUe"
# client_secret = "NXLSCY1sxMUwJPkmsJLtv9zFCbIRE4PhEyduStapvdLGDtiJTwobfWj6TkX88IItiniNcKZNAA2B3WhL9YN0vP4Rca6u0VUhbbVCzR5kdxGbB2YX0jxMAkLoMzKEWR5T"
# username = "nadundilshanuni01"
# api_key = "4af28a5365155d15c6e05f1e773702eb"


client_id = "vrfT9wsksPVUvZ42jrsON77abhjOGgW0PhsxjYb"
client_secret = "RJjakEXgrCpAZDrSdmcapjNesWHUmVfg0VDDRB4Py8S23rSnneSxF8ekmxcmHbgKTNftimtjMDUAXbVDBRc4g6uu6EFij9Wa6ezz9Y3zIWSaFwY8hlzE0NrnrGWjoVfd"
username = "stocktrack8"
api_key = "ef0924c60fbf111c1bc9a3f8618f99fc"


client = veryfi.Client(client_id, client_secret, username, api_key)
categories = ["Grocery", "Travel"]

# Get imageUrl from command-line arguments
image_url = sys.argv[1]

json_result = client.process_document_url(image_url, categories)

# Only print the JSON string
print(json.dumps(json_result))import veryfi
import json
import sys




#-------03
client_id = "vrfT9wsksPVUvZ42jrsON77abhjOGgW0PhsxjYb"
client_secret = "RJjakEXgrCpAZDrSdmcapjNesWHUmVfg0VDDRB4Py8S23rSnneSxF8ekmxcmHbgKTNftimtjMDUAXbVDBRc4g6uu6EFij9Wa6ezz9Y3zIWSaFwY8hlzE0NrnrGWjoVfd"
username = "stocktrack8"
api_key = "ef0924c60fbf111c1bc9a3f8618f99fc"


client = veryfi.Client(client_id, client_secret, username, api_key)
categories = ["Grocery", "Travel"]

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py <image_url> [--type <processing_type>]")
        sys.exit(1)

    image_url = sys.argv[1]
    processing_type = sys.argv[3] if len(sys.argv) > 3 and sys.argv[2] == '--type' else None

    if processing_type == 'expiry':
        try:
            # Veryfi doesn't have a specific 'expiry' category.
            # You might need to adjust the categories or use a different Veryfi function
            # or logic to extract expiry dates.
            # For now, let's process it as a generic document and you'll need
            # to inspect the 'other' fields in the JSON response for expiry information.
            json_result = client.process_document_url(image_url, ["Other"])
            print("---------------------- (Expiry Processing)")
            print(json_result)
            print(json.dumps(json_result))
        except veryfi.errors.VeryfiClientError as e:
            error_data = {"status": "error", "message": f"Veryfi Client Error: {e}"}
            print(json.dumps(error_data))
            sys.exit(1)
        except Exception as e:
            error_data = {"status": "error", "message": f"Error processing expiry: {e}"}
            print(json.dumps(error_data))
            sys.exit(1)
    else:
        # Default processing (assuming this is for general OCR)
        try:
            json_result = client.process_document_url(image_url, categories)
            print("---------------------- (General Processing)")
            print(json_result)
            print(json.dumps(json_result))
        except veryfi.errors.VeryfiClientError as e:
            error_data = {"status": "error", "message": f"Veryfi Client Error: {e}"}
            print(json.dumps(error_data))
            sys.exit(1)
        except Exception as e:
            error_data = {"status": "error", "message": f"Error processing document: {e}"}
            print(json.dumps(error_data))
            sys.exit(1)