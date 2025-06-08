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
    bio: {
        type: String,
        default: '',
        maxlength: 150, 
    },
    profilePic: {
        type: String,
        default: '',
    },
    lastSeen: Date,
    birthdate: Date,
    socials: [{
        social: {
            type: String,
            enum: ["facebook", "instagram", "twitter", "linkedin", "github", "discord","reddit"],
            required: true,
        },
        link: {
            type: String,
            required: true
        },
    }],
    friends: [{ 
        user: {type: Number, ref: "User"},
        friendsSince: Date
    }],
    friendRequests: [{
        user: {type: Number, ref: "User"},
        requestedAt: Date
    }],
    pinnedGroups: [{
        type: Number,
        ref: "Group"
    }]
}, {
    timestamps: true
})

userSchema.plugin(AutoIncrement, {inc_field: 'userID'});

const User = mongoose.model("User",userSchema);

module.exports = User;