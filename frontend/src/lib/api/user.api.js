import { useAuthStore } from '../../store/auth.store';
import { axiosInstance } from '../axios'
import { toast } from "react-hot-toast";

// ---------------------------
// getters and fetching data
// ---------------------------

// get full profile details of a specific user
// params: * userID <number>
// returns : user <object> user info 
const getUserDetails = async (userID) => {
    try {
        const res = await axiosInstance.get(`/user/details/${userID}`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

// search for users by name with pagination
// params: * name <string>
//         * reset <boolean>  
//         * page <number>
//         * limit <number>
// returns: * users <array> users list
//          * totalPages <number> 
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

// get authUser's friends with pagination
// params: * reset <boolean>  
//         * page <number>
//         * limit <number>
// returns: * friends <array> friends list
//          * totalPages <number>
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

// get recieved friend requests with pagination
// params: * reset <boolean>  
//         * page <number>
//         * limit <number>
// returns: * requests <array> friend requests list
//          * totalPages <number>
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


// get sent friend requests with pagination
// params: * reset <boolean>  
//         * page <number>
//         * limit <number>
// returns: * requests <array> friend requests list
//          * totalPages <number>
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

// get mutual friends between authUser and specefic user, with pagination
// params: * reset <boolean>  
//         * page <number>
//         * limit <number>
// returns: * friends <array> friends list
//          * totalPages <number>
const getMutualFriends = async (userID) => {
    try {
        const res = await axiosInstance.get(`/user/mutual/${userID}`);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}


// ----------------------------------
// friends & friend requests actions
// ----------------------------------

// send a friend request to another user
// params: * userID <number>
// returns: * message <string>
//          * user <object> updated authUser after sending request, used to update authStore state
//          * profile <object> updated user profile after sending request, used to update profile state
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

// cancel a sent friend request
// params: * userID <number>
// returns: * message <string>
//          * user <object>
//          * profile <object> 
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

// accept a received friend request
// params: * userID <number>
// returns: * message <string>
//          * user <object>
//          * profile <object>
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


// decline a received friend request
// params: * userID <number>
// returns: * message <string>
//          * user <object>
//          * profile <object>
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

// remove a user from friends list
// params: * userID <number>
// returns: * message <string>
//          * user <object>
//          * profile <object>
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


// ----------------------------------
// profile actions
// ----------------------------------

// update user profile info
// params: * cover <base64Image> 
//         * profilePic <base64Image>
//         * name <string>
//         * bio <string>
//         * birthdate <date>
//         * socials <array>
// returns: * message <string>
//          * user <object> user after updating profile, update authUser global state
const updateProfile = async ({ cover, profilePic, name, bio, birthdate, socials}) => {
    try {
        const res = await axiosInstance.put("/user/profile", {
            name, bio, profilePic, cover, birthdate, socials
        });
        toast.success(res.data.message);
        return res.data;
    } catch (error) {
        toast.error(error.response.data.message);
    }
}


// update user's email
// params: * email <string> 
//         * password <string>
// returns: * message <string>
//          * user <object> 
const updateEmail = async (email, password) => {
    try {
        const res = await axiosInstance.put("/user/email", {email, password});
        toast.success(res.data.message);
        return res.data;
    } catch (error) {
        toast.error(error.response.data.message);
    }
}


// update user's password
// params: * currentPassword <string> 
//         * newPassword <string>
// returns: * message <string>
//          * user <object>
const updatePassword = async (currentPassword, newPassword) => {
    try {
        const res = await axiosInstance.put("/user/password", {currentPassword, newPassword});
        toast.success(res.data.message);
        return res.data;
    } catch (error) {
        toast.error(error.response.data.message);
    }
}


// delete user's account
// params: * password <string>
// returns: * message <string>
const deleteAccount = async (password) => {
    try {
        const res = await axiosInstance.delete("/user/", { data: {password} });
        toast.success(res.data.message);
        useAuthStore.getState().logout();
    } catch (error) {
        toast.error(error.response.data.message);
    }
}

export {
    getUserDetails, getUsers, 
    getFriends, getFriendRequests, getSentFriendRequests, getMutualFriends,
    sendFriendRequest, cancelFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend,
    updateProfile, updateEmail, updatePassword, deleteAccount
}