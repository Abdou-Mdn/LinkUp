require("dotenv").config();
const express = require("express");
const connectDB = require("./lib/db");
const app = express();
const PORT = process.env.PORT;

app.use("/api/auth", require("./routes/auth.route.js"));

app.listen(PORT,() => {
    console.log(`server is running on port: ${PORT}`);
    connectDB();
})