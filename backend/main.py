import veryfi
import json

client_id = "vrfJb83IaW4IbK6Eg28H7AbzyW7G4nN32Iw1NUe"
client_secret = "NXLSCY1sxMUwJPkmsJLtv9zFCbIRE4PhEyduStapvdLGDtiJTwobfWj6TkX88IItiniNcKZNAA2B3WhL9YN0vP4Rca6u0VUhbbVCzR5kdxGbB2YX0jxMAkLoMzKEWR5T"
username = "nadundilshanuni01"
api_key = "4af28a5365155d15c6e05f1e773702eb"


client = veryfi.Client(client_id, client_secret, username, api_key)
categories = ["Grocery", "Travel"]
json_result = client.process_document("files/receipt.jpg", categories)

# Only print the JSON string
print(json.dumps(json_result))