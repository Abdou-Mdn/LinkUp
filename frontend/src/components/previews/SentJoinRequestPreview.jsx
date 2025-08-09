import React, { useState } from 'react'
import { timeSince } from '../../lib/util/timeFormat'
import PrimaryButton from '../PrimaryButton'
import SecondaryButton from '../SecondaryButton'
import { UserCheck, UserX, X } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { acceptFriendRequest, cancelFriendRequest, declineFriendRequest } from '../../lib/api/user.api'
import { cancelJoinRequest } from '../../lib/api/group.api'

const SentJoinRequestPreview = ({request, onClick, onCancel}) => {
    const { setAuthUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
  
    const cancelRequest = async () => {
        setLoading(true);
        const res = await cancelJoinRequest(request.groupID);
        if(res?.group) {
            setAuthUser(res.user);
            onCancel(res.group)
        }
        setLoading(false);
    }

  return (
    <div
      title={request.name}
      onClick={() => onClick(request.groupID)} 
      className='w-full flex items-center gap-2 py-1 px-2 cursor-pointer mt-2
    bg-light-200 dark:bg-dark-200 text-light-txt dark:text-dark-txt hover:bg-light-100 dark:hover:bg-dark-100'
    >
       <img src={request.image ? request.image : '/assets/group-avatar.svg'} className='size-12 rounded-[50%]'/>
       <div className='flex flex-col min-w-0 flex-1'>
            <p className='font-semibold truncate'>{request.name}</p>
            <p className='text-xs truncate text-light-txt2 dark:text-dark-txt2'>
                {
                    `sent ${timeSince(request.requestedAt)}`
                }
            </p>
       </div>
        <div className='flex items-center justify-center gap-2'>
            <SecondaryButton 
                leftIcon={<X className='size-6' />} 
                toolip="Cancel" 
                className='p-1 rounded-lg mt-0' 
                isColored={false}
                onClick={(e) => {
                    e.stopPropagation();
                   cancelRequest()
                }}
                disabled={loading}
            />
        </div>
    </div>
  )
}

export default SentJoinRequestPreview