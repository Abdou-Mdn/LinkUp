import { v4 as uuidv4 } from "uuid";

// create temporary message for optimistic loading 
const createOptimisticMessage = ({sender, chatID = null, receiverID = null, text = "", image = null, replyTo = null}) => {
    const tempID = uuidv4();
    const date = new Date();
    
    return {
        tempID,
        chatID,
        receiverID,
        text,
        image,
        replyTo,
        isEdited: false,
        isDeleted: false,
        isAnnouncement: false,
        createdAt: date,
        sender,
        seenBy: [ { user: sender, seenAt: date } ],
        groupInvite: null,
        status: "sending..."
    };
}

export {
    createOptimisticMessage,
}