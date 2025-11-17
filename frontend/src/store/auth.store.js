import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { io } from 'socket.io-client';
import { useChatStore } from "./chat.store";

const BASE_URL = "http://localhost:2025";

export const useAuthStore = create((set, get) => ({
    // global states
    authUser: null, // currently authenticated user object (null if not logged in)
    isSigningUp: false, // loading state fduring signup
    isLoggingIn: false, // loading state during login
    isCheckingAuth: false, // loading state while verifying session

    // real time states
    socket: null, // active socket 
    onlineUsers: [], // list of online users

    // setter to directly update the authenticated user
    setAuthUser: (user) => set({ authUser: user}),

    // validate current session
    checkAuth: async () => {
        set({ isCheckingAuth: true});
        try {
            // backend returns user info if session is valid
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data});
            get().connectSocket();
        } catch (error) {
            // clear user if session is invalid or expired
            set({authUser: null});
        } finally {
            set({ isCheckingAuth: false});
        }
    },

    // login with credentials 
    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            // data must contain email + password
            // backend returns user info if login is successful
            const res = await axiosInstance.post("/auth/login",data);
            set({authUser: res.data.user});
            get().connectSocket();
            toast.success("Logged in successfully");
        } catch (error) {
            // display backend error message
            toast.error(error.response.data.message)
        } finally {
            set({ isLoggingIn: false });
        }
    },

    // signup with credentials
    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            // data must contain name + email + password
            // backend returns new created user info if signup is successfull 
            const res = await axiosInstance.post("/auth/signup",data);
            set({ authUser: res.data.user });
            get().connectSocket();
            toast.success("Account created successfully");
        } catch (error) {
            // display backend error message
            toast.error(error.response.data.message);
        } finally {
            set({ isSigningUp: false });
        }
    },

    // logout user
    logout: async () => {
        try {
            // clear authenticated user after logout
            await axiosInstance.post("/auth/logout");
            set({authUser: null});
            // reset chat state after logging out
            useChatStore.getState().resetChat();
            get().disconnectSocket();
            toast.success("Logged out successfully");
        } catch (error) {
            // display backend error message
            toast.error(error.response.data.message);
        }
    },

    // connect to socket
    connectSocket: () => {
        const { authUser } = get();
        if(!authUser || get().socket?.connected) return;
        const socket = io(BASE_URL, {
            query: {
                userID: authUser.userID,
            },
            withCredentials: true,
        });
        set({ socket });

        socket.on("onlineUsers", (userIDs) => {
            set({ onlineUsers: userIDs });
        });
    },

    // disconnect from socket
    disconnectSocket: () => {
        if(get().socket?.connected) {
            get().socket.disconnect();
            set({ socket: null });
        }
    },
}))