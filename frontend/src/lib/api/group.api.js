import { axiosInstance } from '../axios'
import { toast } from "react-hot-toast";

const createGroup = async ({name, members}) => {
    try {
        const res = await axiosInstance.post("/group/", { name, members });
        toast.success("Group created successfully");
        return res.data;
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const getGroups = async (name, reset, page = 1, limit = 10) => {
    try {
        const res = await axiosInstance.get("/group/search/", {
            params: { name, page: reset ? 1 : page, limit }
        });
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const getGroupDetails = async (groupID) => {
    try {
        const res = await axiosInstance.get(`/group/details/${groupID}`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const getAdminGroups = async (reset, page = 1, limit = 10) => {
    try {
        const res = await axiosInstance.get('/group/admin-of/',{
            params: { page: reset ? 1 : page, limit }
        });
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const getMemberGroups = async (reset, page = 1, limit = 10) => {
    try {
        const res = await axiosInstance.get('/group/member-of/',{
            params: { page: reset ? 1 : page, limit }
        });
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const getSentJoinRequests = async (reset, page = 1, limit = 10) => {
    try {
        const res = await axiosInstance.get("/user/requests/sent/groups", {
            params: { page: reset ? 1 : page, limit }
        });
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const getMembers = async (groupID, reset, page = 1, limit = 10) => {
    try {
        console.log(groupID)
        const res = await axiosInstance.get(`/group/members/${groupID}`, {
            params: { page: reset ? 1 : page, limit }
        });
        return res.data
    } catch (error) {
        return null;
    }
}

const getJoinRequests = async (groupID, reset, page = 1, limit = 10) => {
     try {
        const res = await axiosInstance.get(`/group/requests/${groupID}`, {
            params: { page: reset ? 1 : page, limit }
        });
        return res.data
    } catch (error) {
        return null;
    }
}

const getFriendMembers = async (groupID) => {
    try {
        const res = await axiosInstance.get(`/group/members/${groupID}/friends`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const updateGroup = async (groupID, name, banner, image, description) => {
    try {
        const res = await axiosInstance.put(`/group/update/${groupID}`, {
            name, description, image, banner
        });

        const { message, group} = res.data;
        toast.success(message);
        return group;
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const deleteGroup = async (groupID) => {
    try {
        const res = await axiosInstance.delete(`/group/remove/${groupID}`);
        toast.success(res.data.message);
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const sendJoinRequest = async (groupID) => {
    try {
        const res = await axiosInstance.post(`/group/request/${groupID}`);
        toast.success(res.data.message);
        return res.data;
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const cancelJoinRequest = async (groupID) => {
    try {
        const res = await axiosInstance.delete(`/group/request/${groupID}/cancel`);
        toast.success(res.data.message);
        return res.data;
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const leaveGroup = async (groupID) => {
    try {
        const res = await axiosInstance.post(`/group/leave/${groupID}`);
        toast.success(res.data.message);
        return res.data;
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const addMembers = async (groupID, users) => {
    try {
        const res = await axiosInstance.post(`/group/members/${groupID}`, { users });
        toast.success(res.data.message);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const removeMember = async (groupID, userID) => {
    try {
        const res = await axiosInstance.delete(`/group/members/${groupID}/${userID}`);
        toast.success(res.data.message);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const promoteToAdmin = async (groupID, userID, fromToast) => {
    try {
        const res = await axiosInstance.post(`/group/admins/${groupID}/${userID}`);
        return res.data
    } catch (error) {
        if(!fromToast) toast.error(error.response.data.message)
        return null;
    }
}

const demoteFromAdmin = async (groupID, userID, fromToast) => {
    try {
        const res = await axiosInstance.delete(`/group/admins/${groupID}/${userID}`);
        return res.data
    } catch (error) {
        if(!fromToast) toast.error(error.response.data.message)
        return null;
    }
}

const acceptJoinRequest = async (groupID, userID) => {
    try {
        const res = await axiosInstance.post(`/group/request/${groupID}/accept/${userID}`)
        toast.success(res.data.message);
        return res.data;
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const declineJoinRequest = async (groupID, userID) => {
    try {
        const res = await axiosInstance.post(`/group/request/${groupID}/decline/${userID}`)
        toast.success(res.data.message);
        return res.data;
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

export {
    createGroup, getGroupDetails, getGroups, 
    getAdminGroups, getMemberGroups, getSentJoinRequests,
    getMembers, getJoinRequests, getFriendMembers,
    updateGroup, deleteGroup, leaveGroup,
    sendJoinRequest, cancelJoinRequest, acceptJoinRequest, declineJoinRequest,
    addMembers, removeMember, promoteToAdmin, demoteFromAdmin
}