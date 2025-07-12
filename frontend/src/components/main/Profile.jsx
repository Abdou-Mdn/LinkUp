import React from 'react'
import { Cake, CalendarCheck, Handshake, Mail, Users } from 'lucide-react';
import { FaFacebook, FaInstagram, FaGithub, FaRedditAlien, FaXTwitter, FaTiktok, FaSnapchat } from 'react-icons/fa6';
import { formatDateWithSuffix } from '../../lib/util/timeFormat'
import ProfileButtons from '../ProfileButtons'
import ProfileSkeleton from '../skeleton/ProfileSkeleton';
import ProfilePreview from '../previews/ProfilePreview';


const Profile = ({ user, mutualFriends, setUser, loading, onSelect, updateRequestList}) => {

  if(loading || !user) {
    return  <ProfileSkeleton />
  }

  return (
    <div className='size-full bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'>
        {/* pictures */}
        <div className='w-full h-[270px] relative'>
          {/* cover image */}
          {
            user.cover ? <img src={user.cover} className='w-full h-[200px] object-cover' /> :
            <div className='w-full h-[200px] bg-light-300 dark:bg-dark-300'></div> 
          }
          {/* profile picture */}
          <img src={user.profilePic ? user.profilePic : "/assets/avatar.svg"} className='size-[150px] rounded-[50%] absolute left-8 bottom-0 border-4 border-light-100 dark:border-dark-100' />
        </div>
        {/* main infos */}
        <div className='w-full p-3 mb-2 lg:pl-10 relative'>
          <span className='text-2xl font-bold'>{user.name}</span>
          {/* action buttons */}
          <ProfileButtons user={user} setUser={setUser} updateRequestList={updateRequestList} />
          <p className='mt-1 text-light-txt2 dark:text-dark-txt2 w-[75%] min-w-[350px]'>{user.bio}</p>
        </div>
        {/* additional infos */}
        <div className='w-full flex flex-col lg:flex-row items-start justify-between p-2 gap-4 lg:gap-0'>
          <div className='flex flex-col gap-4 w-full lg:w-1/2'>
            {/* informations */}
            <div className='w-full pl-3 lg:pl-8'>
              <p className='flex gap-2 py-2'>
                <Users className='size-6' />
                Friends: {user.friends.length}
              </p>
              <p className='flex gap-2 py-2'>
                <CalendarCheck className='size-6' />
                Member since : {formatDateWithSuffix(user.createdAt)}
              </p>
              <p className='flex gap-2 py-2'>
                <Mail className='size-6' />
                {user.email}
              </p>
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
            mutualFriends.length > 0 && (
              <div className='w-full lg:w-1/2 flex flex-col  px-3 lg:px-8'>
                <div className='flex gap-2 items-center justify-between py-2'>
                  <p className='flex gap-2 items-center'>
                    <Handshake className='size-6' />
                    Mutual friends
                  </p>
                  <span>
                    {mutualFriends.length}
                  </span>
                </div>
                <ul className='bg-light-200 dark:bg-dark-200'>
                  {
                    mutualFriends.map(f => <ProfilePreview key={f.userID} user={f} onClick={onSelect} />)
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