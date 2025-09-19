import { create } from "zustand";

// utility function to apply CSS variables for the date picker 
// based on the active theme
export const applyDatePickerTheme = (theme) => {
    const root = document.documentElement;

    if(theme == 'dark') {
        // dark theme colors
        root.style.setProperty('--dp-bg-100', '#0F0F1A');
        root.style.setProperty('--dp-bg-200', '#1C1C2E');
        root.style.setProperty('--dp-bg-300', '#292945');
        root.style.setProperty('--dp-text-100', '#FFFFFF');
        root.style.setProperty('--dp-text-200', '#BFBFD9');
    } else {
        // light theme colors
        root.style.setProperty('--dp-bg-100', '#FFFFFF');
        root.style.setProperty('--dp-bg-200', '#F0F2F4');
        root.style.setProperty('--dp-bg-300', '#CED2DB');
        root.style.setProperty('--dp-text-100', '#1A1A2E');
        root.style.setProperty('--dp-text-200', '#5A5A7A');
    }
}


export const useThemeStore = create((set, get) => ({
    // theme global state (initial valus is presisted in localStorage, defaults to "light")
    theme: localStorage.getItem("theme") || "light",
    
    // toggle between "light" and "dark" theme
    toggleTheme: () => {
        const theme = get().theme;
        const newTheme = theme == "light" ? "dark" : "light"
        // presist theme in localStorage
        localStorage.setItem("theme",newTheme);

        // update CSS variables for the date picker
        applyDatePickerTheme(newTheme)

        // update store state
        set({theme: newTheme})
    },
}));