import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isCheckingAuth: false,
    isUpdating: false,

    checkAuth: async () => {
        set({ isCheckingAuth: true});
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data});
        } catch (error) {
            set({authUser: null});
        } finally {
            set({ isCheckingAuth: false});
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login",data);
            set({authUser: res.data.user});
            toast.success("Logged in successfully");
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({ isLoggingIn: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup",data);
            console.log(res.data)
            set({ authUser: res.data.user });
            toast.success("Account created successfully");
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isSigningUp: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({authUser: null});
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error(error.respose.data.message);
        }
    },

    updateProfile: async ({ cover, profilePic, name, bio, birthdate, socials}) => {
        if(get().isUpdating) return;
        set({ isUpdating: true });
        try {
            const res = await axiosInstance.put("/user/profile", {
                name, bio, profilePic, cover, birthdate, socials
            });
            const { message, user } = res.data;
            if(user) {
                set({ authUser: user });
            }
            toast.success(message);
        } catch (error) {
            toast.error(error.respose.data.message);
        } finally {
            set({ isUpdating: false });
        }
    }

}))