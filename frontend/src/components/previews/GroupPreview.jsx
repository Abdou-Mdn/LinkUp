import React from 'react'
import { useAuthStore } from '../../store/auth.store'
import { formatDateWithSuffix } from '../../lib/util/timeFormat'

const GroupPreview = ({group, onClick = () => {}}) => {
  const count = group.members.length;
  const additionalInfo = `${count} ${count == 1 ? 'member' : 'members'}`;
  
  return (
    <div
      title={group.name} 
      onClick={() => onClick(group.groupID)} 
      className='w-full flex items-center gap-3 p-1 cursor-pointer mt-1
    bg-light-200 dark:bg-dark-200 text-light-txt dark:text-dark-txt hover:bg-light-100 dark:hover:bg-dark-100'
    >
       <img src={group.image ? group.image : '/assets/group-avatar.svg'} className='size-12 rounded-[50%]'/>
       <div>
            <p className='font-semibold truncate'>{group.name}</p>
            <p className='text-xs truncate text-light-txt2 dark:text-dark-txt2'>{additionalInfo}</p>
       </div>
       
    </div>
  )
}

export default GroupPreview