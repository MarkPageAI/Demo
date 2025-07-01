const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("OK from Backend");
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});

// WebSocket integration (Task 1.4)
const WebSocket = require("ws");

// Gắn WebSocket server vào HTTP server đã tạo
const wss = new WebSocket.Server({ server });

console.log("WebSocket server created, waiting for connections...");

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket");

  // Gửi tin nhắn chào mừng tới client vừa kết nối
  ws.send("Hi there, you are connected to the WebSocket server!");

  // Xử lý tin nhắn từ client
  ws.on("message", (message) => {
    console.log("Received message from client: %s", message);
    // Broadcast tin nhắn này tới tất cả client đang kết nối (bao gồm cả người gửi)
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`Server broadcast: ${message}`);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected from WebSocket");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

module.exports = server;
