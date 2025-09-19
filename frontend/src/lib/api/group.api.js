import { axiosInstance } from '../axios'
import { toast } from "react-hot-toast";

// ---------------------------
// getters and fetching data
// ---------------------------

// search for groupss by name with pagination
// params: * name <string>
//         * reset <boolean>  
//         * page <number>
//         * limit <number>
// returns: * groups <array> groupss list
//          * totalPages <number> 
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

// get full profile details of a specific group
// params: * groupID <number>
// returns : group <object> group info 
const getGroupDetails = async (groupID) => {
    try {
        const res = await axiosInstance.get(`/group/details/${groupID}`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

// get groups i'm admin of with pagination
// params: * reset <boolean>  
//         * page <number>
//         * limit <number>
// returns: * groups <array> groupss list
//          * totalPages <number>
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


// get groups i'm only member of with pagination
// params: * reset <boolean>  
//         * page <number>
//         * limit <number>
// returns: * groups <array> groupss list
//          * totalPages <number>
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


// get sent join requests with pagination
// params: * reset <boolean>  
//         * page <number>
//         * limit <number>
// returns: * requests <array> join requests list
//          * totalPages <number>
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

// get members of specific group with pagination
// params: * groupID <number>
//         * reset <boolean>  
//         * page <number>
//         * limit <number>
// returns: * members <array> members list
//          * totalPages <number>
const getMembers = async (groupID, reset, page = 1, limit = 10) => {
    try {
        const res = await axiosInstance.get(`/group/members/${groupID}`, {
            params: { page: reset ? 1 : page, limit }
        });
        return res.data
    } catch (error) {
        return null;
    }
}


// get recieved join requests of specific group with pagination
// params: * groupID <number>
//         * reset <boolean>  
//         * page <number>
//         * limit <number>
// returns: * requests <array> join requests list
//          * totalPages <number>
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


// get friends that are members of specific group
// params: * groupID <number>
// returns: * members <array> members list
const getFriendMembers = async (groupID) => {
    try {
        const res = await axiosInstance.get(`/group/members/${groupID}/friends`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

// ---------------
// group actions
// ---------------

// create a new group 
// params:  * name <string>
//          * members <array>
// returns: * message <string>
//          * group <object> newly created group
const createGroup = async ({name, members}) => {
    try {
        const res = await axiosInstance.post("/group/", { name, members });
        
        toast.success(res.data.message);
        return res.data;
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}


// update a specific group 
// params:  * groupID <number>
//          * name <string>
//          * banner <base64Image>
//          * image <base64Image>
//          * description <string>
// returns: * message <string>
//          * group <object> updated group
const updateGroup = async (groupID, name, banner, image, description) => {
    try {
        const res = await axiosInstance.put(`/group/update/${groupID}`, {
            name, description, image, banner
        });

        toast.success(res.data.message);
        return res.data;
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}


// delete a specific group 
// params:  * groupID <number>
// returns: * message <string>
const deleteGroup = async (groupID) => {
    try {
        const res = await axiosInstance.delete(`/group/remove/${groupID}`);
        toast.success(res.data.message);
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}


// leave a specefic group 
// params:  * groupID <number>
// returns: * message <string>
//          * group <object> updated group after leaving, used to update group profile
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

// ---------------------
// join request actions
// ---------------------

// send a join request to a specific group
// params:  * groupID <number>
// returns: * message <string>
//          * group <object> updated group after sending request, used to update group profile
//          * user <object> updated user after sending request, used to update authUser global state
//          * request <object> sent request, used to update requests list
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


// cancel a sent join request to a specific group
// params:  * groupID <number>
// returns: * message <string>
//          * group <object>
//          * user <object> 
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


// accept a recieved join request to a specific group from a specific user (admin only action)
// params:  * groupID <number>
//          * userID <number>
// returns: * message <string>
//          * group <object>
//          * addedUser <object> used to update members list
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

// decline a received join request to a specific group from a specific user (admin only action)
// params:  * groupID <number>
//          * userID <number>
// returns: * message <string>
//          * group <object>
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

// ---------------------
// group member actions
// ---------------------

// add members to a specific group (admin only action)
// params:  * groupID <number>
//          * users <array>
// returns: * message <string>
//          * group <object> updated group after adding members
//          * addedUsers <array> used to update members list
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

// remove a member from a specific group (admin only action)
// params:  * groupID <number>
//          * userID <number>
// returns: * message <string>
//          * group <object> 
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


// promote a member to an admin in a specific group (admin only action)
// params:  * groupID <number>
//          * userID <number>
//          * fromToast <boolean> if action was called from toast (using dismiss button)
// returns: * message <string>
//          * group <object>
const promoteToAdmin = async (groupID, userID, fromToast) => {
    try {
        const res = await axiosInstance.post(`/group/admins/${groupID}/${userID}`);
        return res.data
    } catch (error) {
        if(!fromToast) toast.error(error.response.data.message)
        return null;
    }
}


// demote an admin to a normal member in a specific group (admin only action)
// params:  * groupID <number>
//          * userID <number>
//          * fromToast <boolean> if action was called from toast (using dismiss button)
// returns: * message <string>
//          * group <object>
const demoteFromAdmin = async (groupID, userID, fromToast) => {
    try {
        const res = await axiosInstance.delete(`/group/admins/${groupID}/${userID}`);
        return res.data
    } catch (error) {
        if(!fromToast) toast.error(error.response.data.message)
        return null;
    }
}

export {
    getGroupDetails, getGroups, 
    getAdminGroups, getMemberGroups, getSentJoinRequests, 
    getMembers, getJoinRequests, getFriendMembers,
    createGroup, updateGroup, deleteGroup, leaveGroup,
    sendJoinRequest, cancelJoinRequest, acceptJoinRequest, declineJoinRequest,
    addMembers, removeMember, promoteToAdmin, demoteFromAdmin
}