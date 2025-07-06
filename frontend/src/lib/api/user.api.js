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



export {
    getUserDetails
}