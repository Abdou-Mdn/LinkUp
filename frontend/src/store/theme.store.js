import { create } from "zustand";

export const applyDatePickerTheme = (theme) => {
    const root = document.documentElement;

    if(theme == 'dark') {
        root.style.setProperty('--dp-bg-100', '#0F0F1A');
        root.style.setProperty('--dp-bg-200', '#1C1C2E');
        root.style.setProperty('--dp-bg-300', '#292945');
        root.style.setProperty('--dp-text-100', '#FFFFFF');
        root.style.setProperty('--dp-text-200', '#BFBFD9');
    } else {
        root.style.setProperty('--dp-bg-100', '#FFFFFF');
        root.style.setProperty('--dp-bg-200', '#F0F2F4');
        root.style.setProperty('--dp-bg-300', '#CED2DB');
        root.style.setProperty('--dp-text-100', '#1A1A2E');
        root.style.setProperty('--dp-text-200', '#5A5A7A');
    }
}


export const useThemeStore = create((set, get) => ({
    theme: localStorage.getItem("theme") || "light",
    toggleTheme: () => {
        const theme = get().theme;
        const newTheme = theme == "light" ? "dark" : "light"
        localStorage.setItem("theme",newTheme);
        applyDatePickerTheme(newTheme)
        set({theme: newTheme})
    },
}));