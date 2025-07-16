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

export {
    createGroup
}