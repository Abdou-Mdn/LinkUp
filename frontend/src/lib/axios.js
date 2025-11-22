import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:2025/api" : "https://linkup-backend-cdy7.onrender.com/api"

export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});