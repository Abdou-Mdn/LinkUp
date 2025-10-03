const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose);

// User Schema
const userSchema = new mongoose.Schema({
    // auto incremented unique number ID for each user
    userID: {
        type: Number,
        unique: true,
    },

    // email address of the user (used for login and authentication)
    email: {
        type: String,
        required: true,
    },

    // user's display name
    name: {
        type: String,
        required: true
    },

    // user's hashed password
    password: {
        type: String,
        required: true,
    },

    // short bio/description for user's profile (max 150 characters)
    bio: {
        type: String,
        default: '',
        maxlength: 150, 
    },

    // URL to the user's profile picture
    profilePic: {
        type: String,
        default: '',
    },

    // URL to the user's profile cover imaage
    cover: {
        type: String,
        default: ''
    },

    // last time user was seen online
    lastSeen: Date,
    
    // user's birthdate
    birthdate: Date,
    
    // list of user's connected social media accounts
    socials: [{
        id: {
            type: Number,
            required: true
        },
        // accepted plateforms 
        platform: {
            type: String,
            enum: ["facebook", "instagram", "twitter", "snapchat", "github", "tiktok", "reddit"],
            required: true,
        },
        // url
        link: {
            type: String,
            required: true
        },
        // username in the media selected
        label: {
            type: String,
            required: true
        }
    }],

    // list of user's confirmed friends
    friends: [{ 
        user: {type: Number, ref: "User"},
        friendsSince: Date
    }],

    // list of friend requests received by the user
    friendRequests: [{
        user: {type: Number, ref: "User"},
        requestedAt: Date
    }],

    // list of friend requests sent by the user
    sentFriendRequests: [{
        user: {type: Number, ref: "User"},
        requestedAt: Date
    }],

    // list of join requests sent to groups by the user
    sentJoinRequests: [{
        group: {type: Number, ref: "Group"},
        requestedAt: Date
    }],

    // flag for soft deletion of the account
    isDeleted: {
        type: Boolean,
        default: false,
    },

    // one-time-password details (used for password reset)
    otp: {
        code: { type: String },
        expires: { type: Date },
        lastSent: { type: Date},
        attempts: { type: Number}
    }
}, {
    timestamps: true // automatically adds createdAt and updatedAt
})

// auto increment userID for each new user
userSchema.plugin(AutoIncrement, {inc_field: 'userID'});

// User Model
const User = mongoose.model("User",userSchema);

module.exports = User;