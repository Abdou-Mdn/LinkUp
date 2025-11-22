require("dotenv").config();
const express = require("express");
const http = require("http");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./lib/db");
const { initSocket } = require("./lib/socket");

const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;

// Parse incoming JSON requests with a size limit of 5MB
app.use(express.json({ limit: '5mb' }));

// Parse cookies from incoming requests
app.use(cookieParser());

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors({
    origin: [CLIENT_URL, "http://localhost:5173"], // - allows frontend at CLIENT_URL or http://localhost:5173 to make requests
    credentials: true // allows sending cookies & auth headers
}));

// All API routes are organized in separate route files
app.use("/api/auth", require("./routes/auth.route.js")); // authentication routes (login, signup...)
app.use("/api/user", require("./routes/user.route.js")); // user related routes (profiles, friend requests...) 
app.use("/api/group", require("./routes/group.route.js")); // group management routes (profiles, members, join requests...)
app.use("/api/chat", require("./routes/chat.route.js")); // chat messaging routes (chats, messages, send message...)

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io and pass the server
initSocket(server);

// Start server and connect to database when ready
server.listen(PORT,() => {
    console.log(`server is running on port: ${PORT}`);
    connectDB(); // initialize mongoDB connection
})