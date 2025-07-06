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
    cover: {
        type: String,
        default: ''
    },
    lastSeen: Date,
    birthdate: Date,
    socials: [{
        id: {
            type: Number,
            required: true
        },
        platform: {
            type: String,
            enum: ["facebook", "instagram", "twitter", "snapchat", "github", "tiktok", "reddit"],
            required: true,
        },
        link: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        }
    }],
    friends: [{ 
        user: {type: Number, ref: "User"},
        friendsSince: Date
    }],
    friendRequests: [{
        user: {type: Number, ref: "User"},
        requestedAt: Date
    }],
    sentFriendRequests: [{
        user: {type: Number, ref: "User"},
        requestedAt: Date
    }],
    sentJoinRequests: [{
        group: {type: Number, ref: "Group"},
        requestedAt: Date
    }],
    isDeleted: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true
})

userSchema.plugin(AutoIncrement, {inc_field: 'userID'});

const User = mongoose.model("User",userSchema);

module.exports = User;