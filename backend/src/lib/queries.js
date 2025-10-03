const Chat = require("../models/chat.model");
const Message = require("../models/message.model");

const relevanceSearchPipeline = (name, projection) => {
    return [
        {
            $addFields: {
                relevance: {
                $switch: {
                    branches: [
                    {
                        case: { $regexMatch: { input: "$name", regex: new RegExp(`^${name}`, "i") } },
                        then: 0
                    },
                    {
                        case: { $regexMatch: { input: "$name", regex: new RegExp(name, "i") } },
                        then: 1
                    }
                    ],
                    default: 2
                }
                }
            }
        },
        { $sort: { relevance: 1, createdAt: -1 } },
        { $project: { ...projection } }
    ];
}

const createAnnouncementMessage = async ({ chatID, sender, text, session }) => {
    // create the announcement message
    const message = new Message({
        chatID,
        sender,
        text,
        isAnnouncement: true
    });

    // save message
    const savedMessage = await message.save({session});

    // update chat with lastMessage and updatedAt
    await Chat.updateOne(
        { chatID },
        { $set: { lastMessage: savedMessage.messageID, updatedAt: new Date() } },
        { session }
    );
}


module.exports = { relevanceSearchPipeline, createAnnouncementMessage }