import { create } from "zustand";

export const useLayoutStore = create((set, get) => ({
    isMobile: window.innerWidth <= 768,
    isMainActive: false,

    updateIsMobile: () => set({
        isMobile: window.innerWidth <= 768
    }),

    setMainActive: (state) => set({
        isMainActive: state
    }),
}));