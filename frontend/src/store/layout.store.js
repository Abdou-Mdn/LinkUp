import { create } from "zustand";

// this store manages responsive ui state (mobile/desktop)
// and wether the main panel is currently active

export const useLayoutStore = create((set, get) => ({
    isMobile: window.innerWidth <= 768, // true if screen width is <= 768px
    isMainActive: false, // controls wether main panel is active (only on mobile)

    // setters 
    // updates isMobile based on current window size (used in a resize event listener)
    updateIsMobile: () => set({
        isMobile: window.innerWidth <= 768
    }),

    // sets main panel visibility
    setMainActive: (state) => set({
        isMainActive: state
    }),
}));