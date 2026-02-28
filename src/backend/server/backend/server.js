const https = require("https");
const fs = require("fs");
const express = require("express");

const app = express();

// Load SSL Certificates
const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem")
};

// Sample Route to Verify HTTPS
app.get("/", (req, res) => {
  res.send("Backend is running securely with HTTPS!");
});

// Start HTTPS Server
https.createServer(options, app).listen(3000, () => {
  console.log("Secure server running on https://localhost:3000");
});
