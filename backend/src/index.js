require("dotenv").config();
const express = require("express");
const connectDB = require("./lib/db");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use("/api/auth", require("./routes/auth.route.js"));
app.use("/api/user", require("./routes/user.route.js"));
app.use("/api/group", require("./routes/group.route.js"));

app.listen(PORT,() => {
    console.log(`server is running on port: ${PORT}`);
    connectDB();
})