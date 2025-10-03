require("dotenv").config();
const express = require("express");
const connectDB = require("./lib/db");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT;

// Parse incoming JSON requests with a size limit of 5MB
app.use(express.json({ limit: '5mb' }));

// Parse cookies from incoming requests
app.use(cookieParser());

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors({
    origin: "http://localhost:5173", // - allows frontend at http://localhost:5173 to make requests
    credentials: true // allows sending cookies & auth headers
}));

// All API routes are organized in separate route files
app.use("/api/auth", require("./routes/auth.route.js")); // authentication routes (login, signup...)
app.use("/api/user", require("./routes/user.route.js")); // user related routes (profiles, friend requests...) 
app.use("/api/group", require("./routes/group.route.js")); // group management routes (profiles, members, join requests...)
app.use("/api/chat", require("./routes/chat.route.js")); // chat messaging routes (chats, messages, send message...)

// Start server and connect to database when ready
app.listen(PORT,() => {
    console.log(`server is running on port: ${PORT}`);
    connectDB(); // initialize mongoDB connection
})