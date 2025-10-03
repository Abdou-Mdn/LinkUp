const mongoose = require("mongoose");

/* 
    MongoDB Database Connection

  this file defines a helper function to connect to MongoDB.
  it uses Mongoose and connection string provided in the environment variables
*/
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error(error);
    }
}

module.exports = connectDB;