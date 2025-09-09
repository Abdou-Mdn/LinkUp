
import { axiosInstance } from '../axios'
import { toast } from "react-hot-toast";

const verifyEmail = async (email) => {
    try {
        const res = await axiosInstance.post(`/auth/verify-email`, { email });
        
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return error.response.data.message;
    }
}

const sendCode = async (email) => {
    try {
        const res = await axiosInstance.post(`/auth/send-otp`, { email });
        toast.success(res.data.message);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const verifyCode = async (email, code) => {
    try {
        const res = await axiosInstance.post(`/auth/verify-otp`, { email, code });
        toast.success(res.data.message);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}

const resetPassword = async (token, password) => {
    try {
        const res = await axiosInstance.post(`/auth/reset-password`, { token, password });
        toast.success(res.data.message);
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return null;
    }
}


export { verifyEmail, sendCode, verifyCode, resetPassword }