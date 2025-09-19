import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { useThemeStore, applyDatePickerTheme } from "./store/theme.store";
import { useAuthStore } from "./store/auth.store";
import { useLayoutStore } from "./store/layout.store";

import HomePage from "./pages/HomePage";
import LogInPage from "./pages/LogInPage";
import SignUpPage from "./pages/SignUpPage";
import DiscoverPage from "./pages/DiscoverPage";
import FriendsPage from "./pages/FriendsPage";
import GroupsPage from "./pages/GroupsPage";
import ProfilePage from "./pages/ProfilePage";
import NavBar from "./components/layout/NavBar";

function App() {
  // global states from zustand stores
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const { updateIsMobile } = useLayoutStore();

  useEffect(() => {
    // initialize responisve layout and date picker theme colors 
    updateIsMobile();
    applyDatePickerTheme(theme);

    // update layout responsiveness when window is resized
    window.addEventListener("resize", () => updateIsMobile());

    // clear event listener on unmount
    return () => window.removeEventListener("resize", () => updateIsMobile());
  }, [updateIsMobile, applyDatePickerTheme]);

  useEffect(() => {
    // check if user is authenticated on first load
    checkAuth();
  }, [checkAuth]);

  if(isCheckingAuth && !authUser ) {
    // return a loading screen while still checking if authenticated 
    return (
      <div className='flex flex-col items-center justify-center h-screen bg-light-100'>
        <img src="/assets/logo.svg" alt="logo" className="size-24 animate-breathe"/>
        <p className="text-light-txt text-center text-lg animate-pulse">Loading...</p>
      </div>
    )
  }

  return (
    <div data-theme={theme}>
      {/* toast notifications */}
      <Toaster />

      {/* show nav bar only if authenticated */}
      { authUser && <NavBar />} 
      
      {/* define app routes with authe protection */}
      <Routes>
        <Route path="/" element={ authUser ? <HomePage /> : <Navigate to="/login"/> }/>
        <Route path="/login" element={ !authUser ? <LogInPage /> : <Navigate to="/"/> }/>
        <Route path="/signup" element={ !authUser ? <SignUpPage /> : <Navigate to="/"/> }/>
        <Route path="/discover" element={ authUser ? <DiscoverPage /> : <Navigate to="/login"/> }/>
        <Route path="/friends" element={ authUser ? <FriendsPage /> : <Navigate to="/login"/> }/>
        <Route path="/groups" element={ authUser ? <GroupsPage /> : <Navigate to="/login"/> }/>
        <Route path="/profile" element={ authUser ? <ProfilePage /> : <Navigate to="/login"/> }/>
        {/* catch-all and redirect for all invalide routes */}
        <Route path='*' element={ authUser ? <Navigate to="/"/> : <Navigate to="/login"/> }/>
      </Routes>
    </div>
  )
}

export default App