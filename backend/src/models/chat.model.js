const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose);

// Chat Schema
const chatSchema = new mongoose.Schema({
    // auto incremented unique number ID for each chat
    chatID: {
        type: Number,
        unique: true
    },

    // flag to separate group chats from private chats
    isGroup: {
        type: Boolean,
        default: false
    },

    // list of chat participants
    participants: [{
        type: Number,
        ref: "User"
    }],

    // group reference in case of a group chat
    group: {
        type: Number,
        ref: "Group",
        default: null
    },

    // chat's last message infos
    lastMessage: {
        type: Number,
        ref: "Message"
    },

    // track last updated (after each message sent) 
    updatedAt: Date,
});

// auto increment chatID with each new chat
chatSchema.plugin(AutoIncrement, {inc_field: 'chatID'});

// Chat Model
const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;