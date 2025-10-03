import React from 'react'
import { Cake, CalendarCheck, Handshake, Mail, Users } from 'lucide-react';
import { FaFacebook, FaInstagram, FaGithub, FaRedditAlien, FaXTwitter, FaTiktok, FaSnapchat } from 'react-icons/fa6';

import { useAuthStore } from '../../store/auth.store';

import { formatDateWithSuffix } from '../../lib/util/timeFormat'

import ProfileButtons from '../ProfileButtons'
import ProfilePreview from '../previews/ProfilePreview';
import ProfileSkeleton from '../skeleton/ProfileSkeleton';


/* 
 * Profile component
 * Main container for user profiles.

 * - Displays user infos: cover, profile pic, name, bio, email, birthdate, socials, date the account is created, friends count, mutual friends.
 * - Displays action buttons based on friendship state (me/ friends/ requested/ strangers).
 * - Strangers:  can see action button (send/cancel friend request) .
 * - Requested:  can see user's request state and action buttons (accept, decline request)
 * - Friends: can see action buttons (open chat, unfriend)
 * - Me: no action buttons and no mutual friends
 
 * Uses utility function: `formatDateWithSuffix

 * params:
 * - user: object infos to display
 * - setUser: setter to update user
 * - loading: loading state
 * - mutualFriends: mutual friends list 
 * - updateList: function to update users list in discover page (only when friendship changes)
 * - updateFriends: function to update friends list in friends page
 * - updateFriendRequests: function to update received friend requests list in friends page
 * - updateSentRequests: function to update sent friend requests list in friends page
*/
const Profile = ({ user, mutualFriends = null, setUser, loading, updateList, updateFriends, updateFriendRequests, updateSentRequests}) => {
  const { setAuthUser } = useAuthStore();

  // render skeleton while still loading infos
  if(loading || !user) {
    return  <ProfileSkeleton />
  }

  // handle updates on send friend request
  const onAdd = (user, profile) => {
    setAuthUser(user);
    setUser(profile);
    if(updateSentRequests) {
      updateSentRequests(prev => [...prev, profile]);
    }
  }

  // handle updates on cancel friend request
  const onCancel = (user, profile) => {
    setAuthUser(user);
    setUser(profile);
    if(updateSentRequests){
      updateSentRequests(prev => prev.filter(r => r.userID !== profile.userID));
    }
  }

  // handle updates on accept friend request
  const onAccept = (user, profile) => {
    setAuthUser(user);
    setUser(profile);
    if(updateList) {
      updateList(prev => prev.map(u => u.userID == profile.profileID ? profile : u));
    }
    if(updateFriendRequests) {
      updateFriendRequests(prev => prev.filter(r => r.userID !== profile.userID));
    }
    if(updateFriends){
      updateFriends(prev => {
        const newFriends = [...prev, profile]
        return newFriends.sort((a, b) => a.name.localeCompare(b.name));
      });
    }
  }

  // handle updates on cancel friend request
  const onDecline = (user, profile) => {
    setAuthUser(user);
    setUser(profile);
    if(updateFriendRequests) {
      updateFriendRequests(prev => prev.filter(r => r.userID !== profile.userID));
    }
  }

  // handle updates on remove friend
  const onUnfriend = (user, profile) => {
    setAuthUser(user);
    setUser(profile);

    if(updateList) {
      updateList(prev => prev.map(u => u.userID == profile.profileID ? profile : u));
    }
    if(updateFriends) {
      updateFriends(prev => prev.filter(f => f.userID !== profile.userID));
    }
  }

  return (
    <div className='size-full bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'>
        {/* pictures */}
        <div className='w-full h-[190px] lg:h-[270px] relative'>
          {/* cover image */}
          {
            user.cover ? <img src={user.cover} className='w-full h-[140px] lg:h-[200px] object-cover' /> :
            <div className='w-full h-[140px] lg:h-[200px] bg-light-300 dark:bg-dark-300'></div> 
          }
          {/* profile picture */}
          <img src={user.profilePic ? user.profilePic : "/assets/avatar.svg"} className='size-[100px] lg:size-[150px] rounded-full absolute left-4 lg:left-8 bottom-0 border-4 border-light-100 dark:border-dark-100' />
        </div>
        {/* main infos */}
        <div className='w-full p-3 mb-2 lg:pl-10 relative'>
          {/* name */}
          <span className='text-xl lg:text-2xl font-bold'>{user.name}</span>
          {/* action buttons */}
          <ProfileButtons 
            user={user} 
            setUser={setUser} 
            onAdd={onAdd}
            onCancel={onCancel}
            onAccept={onAccept}
            onDecline={onDecline}
            onUnfriend={onUnfriend} 
          />
          {/* bio */}
          <p className='mt-1 text-light-txt2 dark:text-dark-txt2 text-sm lg:text-normal w-[75%] min-w-[350px] whitespace-pre-wrap'>{user.bio}</p>
        </div>
        {/* additional infos */}
        <div className='w-full flex flex-col lg:flex-row items-start justify-between p-2 gap-4 lg:gap-0'>
          <div className='flex flex-col gap-4 w-full lg:w-1/2'>
            {/* informations */}
            <div className='w-full pl-3 lg:pl-8'>
              {/* friends count */}
              <p className='flex gap-2 py-2'>
                <Users className='size-6' />
                Friends: {user.friends.length}
              </p>
              {/* created at */}
              <p className='flex gap-2 py-2'>
                <CalendarCheck className='size-6' />
                Member since : {formatDateWithSuffix(user.createdAt)}
              </p>
              {/* email */}
              <p className='flex gap-2 py-2'>
                <Mail className='size-6' />
                {user.email}
              </p>
              {/* birthdate */}
              {user.birthdate && 
                <p className='flex gap-2 py-2'>
                  <Cake className='size-6' />
                  {formatDateWithSuffix(user.birthdate)}
                </p>
              }
            </div>
            {/* socials */}
            { user.socials.length > 0 &&
              <div className='w-full pl-3 lg:pl-8'>
                <h3 className='font-semibold'>Socials:</h3>
                {
                  user.socials.map(s => (
                    <p key={s.id} className='flex gap-2 py-2 group w-fit cursor-pointer'>
                      {
                        s.platform == "facebook" ? <FaFacebook className='size-6 group-hover:text-primary' /> :
                        s.platform == "instagram" ? <FaInstagram className='size-6 group-hover:text-primary' /> :
                        s.platform == "twitter" ? <FaXTwitter className='size-6 group-hover:text-primary' /> :
                        s.platform == "snapchat" ? <FaSnapchat className='size-6 group-hover:text-primary' /> :
                        s.platform == "github" ? <FaGithub className='size-6 group-hover:text-primary' /> :
                        s.platform == "tiktok" ? <FaTiktok className='size-6 group-hover:text-primary' /> :
                        <FaRedditAlien className='size-6 group-hover:text-primary' />
                      }
                      <a href={s.link} target="_blank" rel="noopener noreferrer" className='group-hover:underline group-hover:text-primary'>
                        {s.label}
                      </a>
                    </p>
                  ))
                }
              </div>
            }
          </div>
          {/* mutual friends */}
          {
            mutualFriends?.length > 0 && (
              <div className='w-full lg:w-1/2 flex flex-col  px-3 lg:px-8 max-h-[450px]'>
                <div className='flex gap-2 items-center justify-between py-2'>
                  <p className='flex gap-2 items-center'>
                    <Handshake className='size-6' />
                    Mutual friends
                  </p>
                  <span>
                    {mutualFriends.length}
                  </span>
                </div>
                <ul className='bg-light-200 dark:bg-dark-200 h-full overflow-y-scroll'>
                  {
                    mutualFriends.map(f => <ProfilePreview key={f.userID} user={f} />)
                  }
                </ul>
              </div>
            )
          }
        </div>
    </div>
  )
}

export default Profile