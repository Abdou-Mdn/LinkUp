const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence");

const messageSchema = new mongoose.Schema({
    messageID: {
        type: Number,
        unique: true,
    },
    sender: {
        type: Number,
        required: true,
        ref: "User"
    },
    receiver: {
        type: Number,
        ref: "User"
    },
    groupChat: {
        type: Number,
        ref: "Group"
    },
    isPrivate: {
        type: Boolean,
        default: true
    },
    text: String,
    image: String,
    replyTo: {
        type: Number,
        ref: "Message",
        default: null
    },
    isDelivered: {
        type: Boolean,
        default: false,
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