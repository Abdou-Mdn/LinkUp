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

export {
    createGroup, getGroups, getAdminGroups, getMemberGroups, getSentJoinRequests
}