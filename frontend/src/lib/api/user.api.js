import { axiosInstance } from '../axios'


const getUserDetails = async (userID) => {
    try {
        const res = await axiosInstance.get(`/user/${userID}`);
        return res.data
    } catch (error) {
        console.log("error in get user details", error);
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
        console.log("error in get users", error);
        return null;
    }
}


export {
    getUserDetails, getUsers
}