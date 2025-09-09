import React from 'react'
import { useAuthStore } from '../../store/auth.store'
import { formatDateWithSuffix, timeSince } from '../../lib/util/timeFormat'
import { useLayoutStore } from '../../store/layout.store';

const ProfilePreview = ({user, isSelected, onClick = () => {}}) => {
  const { authUser } = useAuthStore();
  const { isMobile } = useLayoutStore();

  let additionalInfo = `Joined on ${formatDateWithSuffix(user.createdAt)}`;;

  if(user.userID == authUser.userID) {
    additionalInfo = "You"
  } else {
    const isFriends = authUser.friends.some(f => f.user == user.userID);

    if(isFriends) {
      if(user.lastSeen) {
        additionalInfo = `Last seen ${timeSince(user.lastSeen)}`;
      } else {
        additionalInfo = "Last seen .. ago"
      }
    } else {
      const authFriends = authUser.friends.map(f => f.user);
      const userFriends = user.friends.map(f => f.user);
      const mutualFriends = authFriends.filter(f => userFriends.includes(f));

      if(mutualFriends.length > 0) {
        additionalInfo = `${mutualFriends.length} mutual ${mutualFriends.length == 1 ? 'friend' : 'friends'}`
      }
    }

  }
  return (
    <div
      title={user.name} 
      onClick={() => onClick(user.userID)} 
      className={`w-full flex items-center gap-3 p-1 cursor-pointer mt-1 ${!isMobile && isSelected && 'bg-light-300 dark:bg-dark-300'}
     text-light-txt dark:text-dark-txt hover:bg-light-100 dark:hover:bg-dark-100`}
    >
       <img src={user.profilePic ? user.profilePic : '/assets/avatar.svg'} className='size-12 rounded-[50%]'/>
       <div>
            <p className='font-semibold truncate'>{user.name}</p>
            <p className='text-xs truncate text-light-txt2 dark:text-dark-txt2'>{additionalInfo}</p>
       </div>
       
    </div>
  )
}

export default ProfilePreview