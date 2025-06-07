const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose);

const userSchema = new mongoose.Schema({
    userID: {
        type: Number,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    profilePic: {
        type: String,
        default: '',
    },
    friends: [{ 
        type: Number,  
        ref: "User"
    }],
    friendRequests: [{
        type: Number,
        ref: "User"
    }],
}, {
    timestamps: true
})

userSchema.plugin(AutoIncrement, {inc_field: 'userID'});

const User = mongoose.model("User",userSchema);

module.exports = User;