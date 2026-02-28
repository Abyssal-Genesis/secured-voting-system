"use strict";

var https = require("https");

var fs = require("fs");

var express = require("express");

var app = express();
var options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem")
};
https.createServer(options, app).listen(3000, function () {
  console.log("Server running on https://localhost:3000");
});
//# sourceMappingURL=server.dev.js.map
