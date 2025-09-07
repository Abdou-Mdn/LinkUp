import { axiosInstance } from '../axios'
import { toast } from "react-hot-toast";

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

const getPrivateChat = async (userID) => {
    try {
        const res = await axiosInstance.get(`/chat/private/${userID}`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const getGroupChat = async (groupID) => {
    try {
        const res = await axiosInstance.get(`/chat/group/${groupID}`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

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

const markMessagesAsSeen = async (chatID) => {
    try {
        const res = await axiosInstance.put(`/chat/seen/${chatID}`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

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

const editMessage = async (messageID, newText) => {
    try {
        const res = await axiosInstance.put(`/chat/message/${messageID}`, { newText });
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const deleteMessage = async (messageID) => {
    try {
        const res = await axiosInstance.delete(`/chat/message/${messageID}`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}


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