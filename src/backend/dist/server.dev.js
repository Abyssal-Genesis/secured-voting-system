"use strict";

var https = require("https");

var fs = require("fs");

var express = require("express");

var app = express(); // Load SSL Certificates

var options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem")
}; // Test route to verify HTTPS

app.get("/api/votes", function (req, res) {
  res.json({
    votes: 123
  }); // Replace this with actual vote data from your database
}); // Start HTTPS server

https.createServer(options, app).listen(3000, function () {
  console.log("Secure server running on https://localhost:3000");
});
//# sourceMappingURL=server.dev.js.map
