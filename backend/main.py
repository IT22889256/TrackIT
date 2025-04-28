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
print(json.dumps(json_result))