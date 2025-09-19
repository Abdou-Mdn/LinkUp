import React, { useState, useEffect } from 'react'
import { LockKeyhole, LogOut, MailCheck, UserPen, UserX } from 'lucide-react';

import { useAuthStore } from '../store/auth.store'
import { useLayoutStore } from '../store/layout.store';

import { getUserDetails } from '../lib/api/user.api';

import ResponsiveLayout from '../components/layout/ResponsiveLayout';
import MobileHeader from '../components/layout/MobileHeader';
import Profile from '../components/main/Profile'
import EditProfile from '../components/main/EditProfile';
import UpdateEmail from '../components/main/UpdateEmail';
import UpdatePassword from '../components/main/UpdatePassword';
import DeleteAccount from '../components/main/DeleteAccount';


/* 
 * Aside component
 * displays a sidebar with a list of options 

 * params:
 * - activeSection: active option state 
 * - setActiveSection: setter to update active option state
*/
const Aside = ({activeSection, setActiveSection}) => {
  const { authUser, logout } = useAuthStore();
  const { isMobile, setMainActive } = useLayoutStore();
  
  return (
    <div className='w-full h-screen overflow-y-auto scrollbar flex flex-col justify-between items-center
      bg-light-200 text-light-txt dark:bg-dark-200 dark:text-dark-txt'>
      {/* list of options */}
      <div className='w-full px-2 py-4 flex flex-col gap-1 justify-start items-center'>
        {/* profile option */}
        <div 
          className={`${!isMobile && activeSection == "profile" && 'bg-light-300 dark:bg-dark-300'} w-full p-4 flex items-center gap-4 cursor-pointer hover:bg-light-100 dark:hover:bg-dark-100 transition-all`}
          onClick={() => {
            setActiveSection("profile");
            setMainActive(true);
          }}
        >
          {/* profile pic */}
          <img 
            src={authUser.profilePic ? authUser.profilePic :'/assets/avatar.svg'} 
            className='size-8 rounded-[50%]'
          /> 
          {/* profile name */}
          { authUser.name }
        </div>

        {/* edit profile option */}
        <div 
          className={`${!isMobile && activeSection == "edit profile" && 'bg-light-300 dark:bg-dark-300'} w-full p-4 flex items-center gap-4 cursor-pointer hover:bg-light-100 dark:hover:bg-dark-100 transition-all`}
          onClick={() => {
            setActiveSection("edit profile");
            setMainActive(true);
          }}
        >
          <UserPen className='size-8'/>
          Edit Profile
        </div>

        {/* update email option */}
        <div 
          className={`${!isMobile && activeSection == "update email" && 'bg-light-300 dark:bg-dark-300'} w-full p-4 flex items-center gap-4 cursor-pointer hover:bg-light-100 dark:hover:bg-dark-100 transition-all`}
          onClick={() => {
            setActiveSection("update email");
            setMainActive(true);
          }}
        >
          <MailCheck className='size-8'/>
          Update Email
        </div>

        {/* update password option */}
        <div 
          className={`${!isMobile && activeSection == "update password" && 'bg-light-300 dark:bg-dark-300'} w-full p-4 flex items-center gap-4 cursor-pointer hover:bg-light-100 dark:hover:bg-dark-100 transition-all`}
          onClick={() => {
            setActiveSection("update password");
            setMainActive(true);
          }}
        >
          <LockKeyhole className='size-8'/>
          Update Password
        </div>

        {/* delete account option */}
        <div 
          className={`${!isMobile && activeSection == "delete account" && 'bg-light-300 dark:bg-dark-300'} w-full p-4 flex items-center gap-4 cursor-pointer hover:bg-light-100 dark:hover:bg-dark-100 transition-all`}
          onClick={() => {
            setActiveSection("delete account");
            setMainActive(true);
          }}
        >
          <UserX className='size-8'/>
          Delete Account
        </div>
      </div>

      {/* logout */}
      <div 
          className='w-full p-6 flex items-center gap-4 cursor-pointer transition-all hover:text-danger justify-self-end'
          onClick={logout}
        >
          <LogOut className='size-8'/>
          Log Out
        </div>
    </div>
  ) 
}

/* 
 * Main component
 * Main panel that displays content based on selected option.
 * - profile: display auth user profile 
 * - edit profile: display edit profile form
 * - update email: display update email form
 * - update password: display update password form
 * - delete account: display delete account form 

 * params:
 * - activeSection: active option state, used to control what to display
 * - user: user profile to display, passed down to Profile
 * - laoding: loading profile state, passed down to Profile
*/
const Main = ({activeSection, user, loading}) => (
  <div className='h-screen w-full overflow-y-auto scrollbar bg-light-100 dark:bg-dark-100'>
    {/* mobile header */}
    <MobileHeader title={activeSection} />

    {/* display main content based on activeSection */}
    {
      activeSection == "profile" ? <Profile user={user} loading={loading} /> :
      activeSection == "edit profile" ? <EditProfile /> :
      activeSection == "update email" ? <UpdateEmail /> :
      activeSection == "update password" ? <UpdatePassword /> :
      activeSection == "delete account" ? <DeleteAccount /> : null
    }
  </div>
)

/* 
 * Profile Page
 * used to check and control authenticated user's profile, edit and update informations
 * consists of an aside with options and a main for displaying the content 

 * Integrates with API functions:
 * - `getUserDetails`
*/
function ProfilePage() {
  const { authUser } = useAuthStore();

  // management states
  const [activeSection, setActiveSection] = useState("profile") // active section state
  const [user, setUser] = useState(null); // user profile 
  const [loading, setLoading] = useState(false); // loading profile state
  
  // load user's profile on mount
  useEffect(() => {
    const fetchData = async () => {
      if(!authUser.userID) return;
      setLoading(true);
      try {
        const res = await getUserDetails(authUser.userID);
        if (res) {
          setUser(res);
        } else {
          setUser(authUser);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authUser]); 

  // layout rendering
  return (
    <ResponsiveLayout 
      aside={
        <Aside 
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      } 
      main={
        <Main 
          activeSection={activeSection}
          user={user}
          loading={loading}
        />
      } 
    />
  )
}

export default ProfilePage