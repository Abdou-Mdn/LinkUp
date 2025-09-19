
import { axiosInstance } from '../axios'
import { toast } from "react-hot-toast";

// verify if email is registered in the system before password reset
// params: email <string>
// returns: * message <string>, success or error
//          * userID <number> if registred, 
const verifyEmail = async (email) => {
    try {
        const res = await axiosInstance.post(`/auth/verify-email`, { email });
        
        return res.data
    } catch (error) {
        toast.error(error.response.data.message)
        return error.response.data.message;
    }
}

// send OTP code to user's email for password reset
// params: email <string>
// returns: * message <string>
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

// verify OTP code submitted by the user
// params: * email <string>
//         * otp <string>
// returns: * message <string>
//          * token <string> if OTP was valid
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

// reset password using token provided by OTP verification
// params: * token <string>
//         * password <string>
// returns: * message <string>
//          * reset <boolean> if password was reset or not
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