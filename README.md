# SEU
Simple Encoding and Uploading 

# Usage
First you must have handbrake-cli installed on your system.
Next make a file named index.js and place this into its contents. (Edit accordingly)
```
let SEU = require("seu");
// Initialize SEU to a path you wish to use for encoding files without the trailing slash ("/")
var worker = SEU("/path/to/encode/stuff");
```
Then type `node imdex.js`, after it says in the console that it started just drop a file into whatever path you specifieds new "encode" folder.

# TODO
Upload api code and much more.
