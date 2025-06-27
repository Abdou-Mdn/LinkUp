import { create } from "zustand";

export const useThemeStore = create((set, get) => ({
    theme: localStorage.getItem("theme") || "light",
    toggleTheme: () => {
        const theme = get().theme;
        const newTheme = theme == "light" ? "dark" : "light"
        localStorage.setItem("theme",newTheme);
        set({theme: newTheme})
    },
}));