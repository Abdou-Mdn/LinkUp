const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose);

const chatSchema = new mongoose.Schema({
    chatID: {
        type: Number,
        unique: true
    },
    isGroup: {
        type: Boolean,
        default: false
    },
    participants: [{
        type: Number,
        ref: "User"
    }],
    group: {
        type: Number,
        ref: "Group",
        default: null
    },
    lastMessage: {
        type: Number,
        ref: "Message"
    },
    updatedAt: Date,
});

chatSchema.plugin(AutoIncrement, {inc_field: chatID});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;