import React from 'react'
import { useAuthStore } from '../../store/auth.store'
import { useLayoutStore } from '../../store/layout.store';

import { formatDateWithSuffix, timeSince } from '../../lib/util/timeFormat'

/* 
 * ProfilePreview component
 * Preview for sidebar users in discover & friends pages.

 * - Displays user infos: image, name, online status.
 * - Displays additional infos based on profile's online status, and friendship status.
 
 * Uses utility functions: `formatDateWithSuffix`, `timeSince`

 * params:
 * - user: object infos to display
 * - isSelected: boolean to check if this user is open in main profile container or not
 * - onSelect: callback function to select a user to display on profile container 
 */
const ProfilePreview = ({user, isSelected, onSelect = () => {}}) => {
  const { authUser } = useAuthStore();
  const { isMobile } = useLayoutStore();

  // check if user is my friend
    const isFriends = authUser.friends.some(f => f.user == user.userID);
  // user online status
  const isOnline = true;

  // default additional info (date the account was created)
  let additionalInfo = `Joined on ${formatDateWithSuffix(user.createdAt)}`;;

  // if user is me then display (You)
  if(user.userID == authUser.userID) {
    additionalInfo = "You"
  } else if(isFriends) {
    // display online status if user is my friend
    if(user.lastSeen) {
      additionalInfo = `Last seen ${timeSince(user.lastSeen, "")}`;
    } else {
      additionalInfo = "Online"
    }
  } else {
    // if user is not my friend, count mutual friends
    const authFriends = authUser.friends.map(f => f.user);
    const userFriends = user.friends.map(f => f.user);
    const mutualFriends = authFriends.filter(f => userFriends.includes(f));

    // if there are mutual friends display the number
    if(mutualFriends.length > 0) {
      additionalInfo = `${mutualFriends.length} mutual ${mutualFriends.length == 1 ? 'friend' : 'friends'}`
    }
  }

  return (
    <div
      title={user.name} 
      onClick={() => onSelect(user.userID)} 
      className={`w-full flex items-center gap-3 p-1 cursor-pointer mt-1 ${!isMobile && isSelected && 'bg-light-300 dark:bg-dark-300'} text-light-txt dark:text-dark-txt hover:bg-light-100 dark:hover:bg-dark-100`}
    >
      {/* image */}
      <div className='flex-shrink-0 relative size-fit'>
        <img src={user.profilePic ? user.profilePic : '/assets/avatar.svg'} className='size-12 rounded-full'/>
        {/* online status */}
        { isOnline && isFriends && <div className='bg-accent border-3 border-light-200 dark:border-dark-200 size-4.25 rounded-full absolute -right-0.75 -bottom-0.75'></div> }
      </div>
       <div>
          {/* name */}
          <p className='font-semibold truncate'>{user.name}</p>
          {/* additional infos */}
          <p className='text-xs truncate text-light-txt2 dark:text-dark-txt2'>{additionalInfo}</p>
       </div>
    </div>
  )
}

export default ProfilePreview