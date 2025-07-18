const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose);

const groupSchema = new mongoose.Schema({
    groupID: {
        type: Number,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: '',
        maxlength: 150, 
    },
    members: [{
        user: {type: Number, ref: "User"},
        joinedAt: Date
    }],
    banner: {
        type: String,
        default: ''
    },
    admins: [{
        type: Number,
        ref: "User"
    }],
    joinRequests: [{
        user: {type: Number, ref: "User"},
        requestedAt: Date
    }]
},{
    timestamps: true
});

groupSchema.plugin(AutoIncrement, {inc_field: 'groupID'});

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;