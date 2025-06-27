import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isCheckingAuth: false,

    checkAuth: async () => {
        set({ isCheckingAuth: true});
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data});
        } catch (error) {
            set({authUser: null});
            console.log("Error in checkAuth: ",error);
        } finally {
            set({ isCheckingAuth: false});
        }
    },

}))