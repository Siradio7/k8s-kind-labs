const express = require("express");
const os = require("os");

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.json({
    message: "Hello from Kubernetes!",
    service: "k8s-kind-api",
    version: "1.1.0",
    hostname: os.hostname()
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    hostname: os.hostname()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});