const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose);

const messageSchema = new mongoose.Schema({
    messageID: {
        type: Number,
        unique: true,
    },
    chatID: {
        type: Number,
        ref: "Chat"
    },
    sender: {
        type: Number,
        required: true,
        ref: "User"
    },
    text: String,
    image: String,
    replyTo: {
        type: Number,
        ref: "Message",
        default: null
    },
    groupInvite: {
        type: Number,
        ref: "Group",
        default: null
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    seenBy: [{
        user: {type: Number, ref: "User"},
        seenAt: Date
    }],
},{
    timestamps: true
});

messageSchema.plugin(AutoIncrement, {inc_field: 'messageID'});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;