import { axiosInstance } from '../axios'
import { toast } from "react-hot-toast";

// ---------------------------
// getters and fetching data
// ---------------------------

// get chats with pagination
// params: * reset <boolean>  
//         * page <number>
//         * limit <number>
// returns: * chats <array> chats list
//          * totalPages <number>
const getChats = async (reset, page = 1, limit = 10) => {
    try {
        const res = await axiosInstance.get("/chat/", {
            params: { page: reset ? 1 : page, limit }
        });
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

// get private chat with a specefic user
// params: * userID <number>  
// returns: * chat <object> 
const getPrivateChat = async (userID) => {
    try {
        const res = await axiosInstance.get(`/chat/private/${userID}`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}


// get group chat of a specefic group
// params: * groupID <number>  
// returns: * chat <object> 
const getGroupChat = async (groupID) => {
    try {
        const res = await axiosInstance.get(`/chat/group/${groupID}`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

// get messages of a specefic chat with pagination
// params:  * chatID <number>
//          * reset <boolean>  
//          * page <number>
//          * limit <number>
// returns: * messages <array> messages list
//          * totalPages <number>
const getChatMessages = async (chatID, reset, page, limit = 30) => {
    try {
        const res = await axiosInstance.get(`/chat/messages/${chatID}`, {
            params: { page: reset ? 1 : page, limit }
        });
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

// -----------------
// message actions
// -----------------

// mark as seen all unseen messages of a specefic chat
// params:  * chatID <number>
// returns: * chat <object> updated chat after seeing messages, used to update chats list
const markMessagesAsSeen = async (chatID) => {
    try {
        const res = await axiosInstance.put(`/chat/seen/${chatID}`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

// send a message in a specefic chat or to a specefic user (if chat doesn't exist yet it will be created)
// params:  * chatID <number>  
//          * receiverID <number>
//          * text <string>
//          * image <base64Image>
//          * replyTo <number>
// returns: * message <string>
//          * newMessage <object> sent message, will be added to messages state
//          * chat <object> updated chat after sending message, used to update chats list
const sendMessage = async ({chatID, receiverID, text, image, replyTo}) => {
    try {
        const res = await axiosInstance.post(`/chat/message/`, {
            chatID, receiverID, text, image, replyTo
        });
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}


// update a specefic message 
// params:  * messageID <number>  
//          * text <string>
// returns: * message <string>
//          * updatedMessage <object> updated message, used to update messages and chats list
const editMessage = async (messageID, newText) => {
    try {
        const res = await axiosInstance.put(`/chat/message/${messageID}`, { newText });
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}


// delete a specefic message 
// params:  * messageID <number>  
// returns: * message <string>
//          * deletedMessage <object> updated message, used to update messages and chats list
const deleteMessage = async (messageID) => {
    try {
        const res = await axiosInstance.delete(`/chat/message/${messageID}`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

// send group invites to a list of users
// params:  * receiverIDs <array>  
//          * groupInvite <number>
// returns: * message <string>
//          * successful <number> number of successful sent invites
//          * failed <number> number of failed sent invites
//          * invites <array> list of sent invites (one is used to update messages if selected chat is a chat with a receiver)
const sendGroupInvites = async ({receiverIDs, groupInvite}) => {
    try {
        const res = await axiosInstance.post(`/chat/invite/`, {
            receiverIDs, groupInvite
        });
        const { successful, failed } = res.data;
        if(successful > 0) {
            if (successful == 1) {
                toast.success("Group invite sent successfully");
            } else {
                toast.success(`${successful} group invites sent successfully`);
            }
        }
        if(failed > 0) {
            if (failed == 1) {
                toast.error("Failed to send group invite");
            } else {
                toast.error(`Failed to send ${failed} group invites`);
            }
        }
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

export {
    getChats, getPrivateChat, getGroupChat, getChatMessages, markMessagesAsSeen, 
    sendMessage, editMessage, deleteMessage, sendGroupInvites
}