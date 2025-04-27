import veryfi
import json
import sys

# client_id = "vrfJb83IaW4IbK6Eg28H7AbzyW7G4nN32Iw1NUe"
# client_secret = "NXLSCY1sxMUwJPkmsJLtv9zFCbIRE4PhEyduStapvdLGDtiJTwobfWj6TkX88IItiniNcKZNAA2B3WhL9YN0vP4Rca6u0VUhbbVCzR5kdxGbB2YX0jxMAkLoMzKEWR5T"
# username = "nadundilshanuni01"
# api_key = "4af28a5365155d15c6e05f1e773702eb"

client_id = "vrfjphSBoGyt69PSG1aHYDJipTtZvLE28uhz4Kb"
client_secret = "TUAEFjoNf4S9R8VYVUEmGYz0i1KX08aWHhIhE50wMOLF63385lCy3pr0ElSXtoyy6HxrXm599sAKhHhB9wZMFEYoaDkywuUJOxV5gv3OC3Do8D2Xlu31eT7SPPrlZSX9"
username = "nadundilshan0001"
api_key = "39ad88107defbeb3020a7519e2b637a2"


client = veryfi.Client(client_id, client_secret, username, api_key)
categories = ["Grocery", "Travel"]

# Get imageUrl from command-line arguments
image_url = sys.argv[1]

json_result = client.process_document_url(image_url, categories)

# Only print the JSON string
print(json.dumps(json_result))