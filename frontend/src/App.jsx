import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useThemeStore } from "./store/theme.store";
import { useAuthStore } from "./store/auth.store";

import HomePage from "./pages/HomePage";
import LogInPage from "./pages/LogInPage";
import SignUpPage from "./pages/SignUpPage";
import DiscoverPage from "./pages/DiscoverPage";
import FriendsPage from "./pages/FriendsPage";
import GroupsPage from "./pages/GroupsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {

  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if(isCheckingAuth && !authUser) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <LoaderCircle className="size-10 animate-spin" color="#4A00E0"/>
      </div>
    )
  }

  return (
    <div data-theme={theme}>
      <Routes>
        <Route path="/" element={ authUser? <HomePage /> : <Navigate to="/login"/> }/>
        <Route path="/login" element={ !authUser? <LogInPage /> : <Navigate to="/"/> }/>
        <Route path="/signup" element={ !authUser? <SignUpPage /> : <Navigate to="/"/> }/>
        <Route path="/discover" element={ authUser? <DiscoverPage /> : <Navigate to="/login"/> }/>
        <Route path="/friends" element={ authUser? <FriendsPage /> : <Navigate to="/login"/> }/>
        <Route path="/groups" element={ authUser? <GroupsPage /> : <Navigate to="/login"/> }/>
        <Route path="/profile" element={ authUser? <ProfilePage /> : <Navigate to="/login"/> }/>
        <Route path='*' element={ <NotFoundPage /> }/>
      </Routes>
    </div>
  )
}

export default App