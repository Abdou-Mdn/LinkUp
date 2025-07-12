import { axiosInstance } from '../axios'
import { toast } from "react-hot-toast";

const getUserDetails = async (userID) => {
    try {
        const res = await axiosInstance.get(`/user/details/${userID}`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}


const getUsers = async (name, reset, page = 1, limit = 10) => {
    try {
        const res = await axiosInstance.get("/user/search/", {
            params: { name, page: reset ? 1 : page, limit }
        });
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const sendFriendRequest = async (userID) => {
    try {
        const res = await axiosInstance.post(`/user/request/${userID}`);
        toast.success(res.data.message);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const cancelFriendRequest = async (userID) => {
    try {
        const res = await axiosInstance.delete(`/user/request/cancel/${userID}`);
        toast.success(res.data.message);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const acceptFriendRequest = async (userID) => {
    try {
        const res = await axiosInstance.post(`/user/request/accept/${userID}`);
        toast.success(res.data.message);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const declineFriendRequest = async (userID) => {
    try {
        const res = await axiosInstance.post(`/user/request/decline/${userID}`);
        toast.success(res.data.message);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const removeFriend = async (userID) => {
    try {
        const res = await axiosInstance.delete(`/user/friend/${userID}`);
        toast.success(res.data.message);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const getFriends = async (reset, page = 1, limit = 10) => {
    try {
        const res = await axiosInstance.get("/user/friends/", {
            params: { page: reset ? 1 : page, limit }
        });
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const getFriendRequests = async (reset, page = 1, limit = 10) => {
    try {
        const res = await axiosInstance.get("/user/requests/recieved", {
            params: { page: reset ? 1 : page, limit }
        });
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const getSentFriendRequests = async (reset, page = 1, limit = 10) => {
    try {
        const res = await axiosInstance.get("/user/requests/sent", {
            params: { page: reset ? 1 : page, limit }
        });
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const getMutualFriends = async (userID) => {
    try {
        const res = await axiosInstance.get(`/user/mutual/${userID}`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

export {
    getUserDetails, getUsers, 
    sendFriendRequest, cancelFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend,
    getFriends, getFriendRequests, getSentFriendRequests, getMutualFriends
}