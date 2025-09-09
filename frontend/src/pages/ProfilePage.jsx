import React, { useState, useEffect } from 'react'
import Profile from '../components/main/Profile'
import { useAuthStore } from '../store/auth.store'
import ResponsiveLayout from '../components/layout/ResponsiveLayout';
import { getUserDetails } from '../lib/api/user.api';
import { useLayoutStore } from '../store/layout.store';
import { LockKeyhole, LogOut, MailCheck, UserPen, UserX } from 'lucide-react';
import MobileHeader from '../components/layout/MobileHeader';
import EditProfile from '../components/main/EditProfile';
import UpdateEmail from '../components/main/UpdateEmail';
import UpdatePassword from '../components/main/UpdatePassword';
import DeleteAccount from '../components/main/DeleteAccount';


const Aside = ({activeSection, setActiveSection}) => {
  const { authUser, logout } = useAuthStore();
  const { isMobile, setMainActive } = useLayoutStore();
  
  return (
    <div className='w-full h-screen flex flex-col justify-between items-center
      bg-light-200 text-light-txt dark:bg-dark-200 dark:text-dark-txt'>
      <div className='w-full px-2 py-4 flex flex-col gap-1 justify-start items-center'>
        <div 
          className={`${!isMobile && activeSection == "profile" && 'bg-light-300 dark:bg-dark-300'} 
          w-full p-4 flex items-center gap-4 cursor-pointer hover:bg-light-100 dark:hover:bg-dark-100 transition-all`}
          onClick={() => {
            setActiveSection("profile");
            setMainActive(true);
          }}
        >
          <img 
            src={authUser.profilePic ? authUser.profilePic :'/assets/avatar.svg'} 
            className='size-8 rounded-[50%]'
          /> 
          { authUser.name }
        </div>
        <div 
          className={`${!isMobile && activeSection == "edit profile" && 'bg-light-300 dark:bg-dark-300'} 
          w-full p-4 flex items-center gap-4 cursor-pointer hover:bg-light-100 dark:hover:bg-dark-100 transition-all`}
          onClick={() => {
            setActiveSection("edit profile");
            setMainActive(true);
          }}
        >
          <UserPen className='size-8'/>
          Edit Profile
        </div>
        <div 
          className={`${!isMobile && activeSection == "update email" && 'bg-light-300 dark:bg-dark-300'} 
          w-full p-4 flex items-center gap-4 cursor-pointer hover:bg-light-100 dark:hover:bg-dark-100 transition-all`}
          onClick={() => {
            setActiveSection("update email");
            setMainActive(true);
          }}
        >
          <MailCheck className='size-8'/>
          Update Email
        </div>
        <div 
          className={`${!isMobile && activeSection == "update password" && 'bg-light-300 dark:bg-dark-300'} 
          w-full p-4 flex items-center gap-4 cursor-pointer hover:bg-light-100 dark:hover:bg-dark-100 transition-all`}
          onClick={() => {
            setActiveSection("update password");
            setMainActive(true);
          }}
        >
          <LockKeyhole className='size-8'/>
          Update Password
        </div>
        <div 
          className={`${!isMobile && activeSection == "delete account" && 'bg-light-300 dark:bg-dark-300'} 
          w-full p-4 flex items-center gap-4 cursor-pointer hover:bg-light-100 dark:hover:bg-dark-100 transition-all`}
          onClick={() => {
            setActiveSection("delete account");
            setMainActive(true);
          }}
        >
          <UserX className='size-8'/>
          Delete Account
        </div>
      </div>
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


const Main = ({activeSection, user, loading}) => (
  <div className='h-screen w-full overflow-y-auto scrollbar'>
    {/* mobile header */}
    <MobileHeader title={activeSection} />
    {
      activeSection == "profile" ? <Profile user={user} loading={loading} /> :
      activeSection == "edit profile" ? <EditProfile /> :
      activeSection == "update email" ? <UpdateEmail /> :
      activeSection == "update password" ? <UpdatePassword /> :
      activeSection == "delete account" ? <DeleteAccount /> : null
    }
  </div>
)

function ProfilePage() {
  const { authUser } = useAuthStore();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("profile")

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