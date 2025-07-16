import React, { useState } from 'react'
import { timeSince } from '../../lib/util/timeFormat'
import PrimaryButton from '../PrimaryButton'
import SecondaryButton from '../SecondaryButton'
import { UserCheck, UserX, X } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { acceptFriendRequest, cancelFriendRequest, declineFriendRequest } from '../../lib/api/user.api'

const RequestPreview = ({request, isSent, onClick, onUpdate}) => {
    const { setAuthUser } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const cancelRequest = async () => {

        setLoading(true);
        const res = await cancelFriendRequest(request.userID);
        if(res?.user) {
            setAuthUser(res.user);
            onUpdate(request.userID, res.profile);
        }
        setLoading(false);
    }

    const acceptRequest = async () => {
        setLoading(true);
        const res = await acceptFriendRequest(request.userID);
        if(res?.user) {
            setAuthUser(res.user);
            onUpdate(request.userID, res.profile);
        }
        setLoading(false);
    }

    const declineRequest = async () => {
        setLoading(true);
        const res = await declineFriendRequest(request.userID);
        if(res?.user) {
            setAuthUser(res.user);
            onUpdate(request.userID, res.profile);
        }
        setLoading(false);
    }
  
  return (
    <div
      title={request.name}
      onClick={() => onClick(request.userID)} 
      className='w-full flex items-center gap-2 py-1 px-2 cursor-pointer mt-2
    bg-light-200 dark:bg-dark-200 text-light-txt dark:text-dark-txt hover:bg-light-100 dark:hover:bg-dark-100'
    >
       <img src={request.profilePic ? request.profilePic : '/assets/avatar.svg'} className='size-12 rounded-[50%]'/>
       <div className='flex flex-col min-w-0 flex-1'>
            <p className='font-semibold truncate'>{request.name}</p>
            <p className='text-xs truncate text-light-txt2 dark:text-dark-txt2'>
                {
                    `${isSent ? 'Sent' : 'Received'} ${timeSince(request.requestedAt)}`
                }
            </p>
       </div>
        {
            isSent ? (
                <div className='flex items-center justify-center gap-2'>
                    <SecondaryButton 
                        leftIcon={<X className='size-4' />} 
                        toolip="Cancel" 
                        className='p-2 rounded-lg mt-0' 
                        isColored={false}
                        onClick={(e) => {
                            e.stopPropagation();
                            cancelRequest()
                        }}
                        disabled={loading}
                    />
                </div>
            ) : (
                <div className='flex items-center gap-2'>
                    <PrimaryButton 
                        leftIcon={<UserCheck className='size-4' />} 
                        toolip="Accept" 
                        className='p-2 rounded-lg'
                        onClick={(e) => {
                            e.stopPropagation();
                            acceptRequest()
                        }}                        
                        disabled={loading} 
                    />
                    <SecondaryButton 
                        leftIcon={<UserX className='size-4' />} 
                        toolip="Decline" 
                        className='p-2 rounded-lg'
                        onClick={(e) => {
                            e.stopPropagation();
                            declineRequest();
                        }}
                        disabled={loading} 
                    />
                </div>
            )
        }
    </div>
  )
}

export default RequestPreview