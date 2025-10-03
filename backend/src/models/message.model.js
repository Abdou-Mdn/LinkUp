const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose);

// Message Schema
const messageSchema = new mongoose.Schema({
    // auto incremented unique number ID for each message
    messageID: {
        type: Number,
        unique: true,
    },

    // reference to which chat is message part of
    chatID: {
        type: Number,
        required: true,
        ref: "Chat"
    },

    // the user who sent the message
    sender: {
        type: Number,
        required: true,
        ref: "User"
    },

    // text content of the message
    text: String,

    // URL to the image content of message
    image: String,

    // reference to the message which this message is replying to
    replyTo: {
        type: Number,
        ref: "Message",
        default: null
    },

    // group details included in the group invite
    groupInvite: {
        type: Number,
        ref: "Group",
        default: null
    },

    // flag to separate system messages from regular ones
    isAnnouncement: {
        type: Boolean,
        default: false
    },

    // flag to track edited messages
    isEdited: {
        type: Boolean,
        default: false
    },

    // flag for soft deletion of the message
    isDeleted: {
        type: Boolean,
        default: false
    },

    // list of users who saw the message
    seenBy: [{
        user: {type: Number, ref: "User"},
        seenAt: Date
    }],
},{
    timestamps: true // automatically adds createdAt and updatedAt
});

// auto increment messageID for each new message
messageSchema.plugin(AutoIncrement, {inc_field: 'messageID'});

// Message Model
const Message = mongoose.model("Message", messageSchema);

module.exports = Message;