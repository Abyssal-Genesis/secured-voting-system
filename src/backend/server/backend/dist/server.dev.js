"use strict";

var https = require("https");

var fs = require("fs");

var express = require("express");

var app = express(); // Load SSL Certificates

var options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem")
}; // Sample Route to Verify HTTPS

app.get("/", function (req, res) {
  res.send("Backend is running securely with HTTPS!");
}); // Start HTTPS Server

https.createServer(options, app).listen(3000, function () {
  console.log("Secure server running on https://localhost:3000");
});
//# sourceMappingURL=server.dev.js.map
