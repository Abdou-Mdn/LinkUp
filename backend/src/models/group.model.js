const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose);

// Group Schema
const groupSchema = new mongoose.Schema({
    // auto incremented unique number ID for each group
    groupID: {
        type: Number,
        unique: true
    },

    // group's display name
    name: {
        type: String,
        required: true
    },

    // URL to group's avatar image
    image: {
        type: String,
        default: ''
    },

    // URL to group's banner image
    banner: {
        type: String,
        default: ''
    },

    // short description for group's profile (max 150 characters)
    description: {
        type: String,
        default: '',
        maxlength: 150, 
    },

    // list of group's confirmed members
    members: [{
        user: {type: Number, ref: "User"},
        joinedAt: Date
    }],

    // list of group's admins
    admins: [{
        type: Number,
        ref: "User"
    }],

    // list of received join requests
    joinRequests: [{
        user: {type: Number, ref: "User"},
        requestedAt: Date
    }]
},{
    timestamps: true // automatically adds createdAt and updatedAt
});

// auto increment groupID for each new group
groupSchema.plugin(AutoIncrement, {inc_field: 'groupID'});

// Group Model
const Group = mongoose.model("Group", groupSchema);

module.exports = Group;