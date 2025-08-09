import React, { useState } from 'react'
import { timeSince } from '../../lib/util/timeFormat'
import SecondaryButton from '../SecondaryButton'
import { Check, X } from 'lucide-react'
import { acceptJoinRequest, declineJoinRequest } from '../../lib/api/group.api'
import TertiaryButton from '../TertiaryButton'

const JoinRequestPreview = ({request, groupID, onAccept, onDecline, isAddingMember = false}) => {
    const [loading, setLoading] = useState(false);

    const acceptRequest = async () => {
        if(loading) return;
        try {
            setLoading(true);
            const res = await acceptJoinRequest(groupID, request.userID);
            if(res?.group) {
                onAccept(res.group, res.addedUser);
            }
        } catch (error) {
            console.log("error in accept join request", error);
        } finally {
            setLoading(false);
        }
    }

    const declineRequest = async () => {
        if(loading) return;
        try {
            setLoading(true);
            const res = await declineJoinRequest(groupID, request.userID);
            if(res?.group) {
                onDecline(res.group, request.userID);
            }
        } catch (error) {
            console.log("error in decline join request", error);
        } finally {
            setLoading(false);
        }
    }
  
  return (
    <div
      title={request.name} 
      className='w-full flex items-center gap-2 py-1 px-2 mt-2
    bg-light-200 dark:bg-dark-200 text-light-txt dark:text-dark-txt hover:bg-light-100 dark:hover:bg-dark-100'
    >
        <img src={request.profilePic ? request.profilePic : '/assets/avatar.svg'} className='size-12 rounded-[50%]'/>
        <div className='flex flex-col min-w-0 flex-1'>
            <p className='font-semibold truncate'>{request.name}</p>
            <p className='text-xs truncate text-light-txt2 dark:text-dark-txt2'>
                {
                    `Requested ${timeSince(request.requestedAt)}`
                }
            </p>
        </div>
        <div className='flex flex-col items-end gap-1'>
            {isAddingMember && <p className='text-xs truncate text-light-txt2 dark:text-dark-txt2'>already sent a request</p>}
            <div className='flex items-center gap-2'>
                <TertiaryButton
                    leftIcon={<Check className='size-6' />} 
                    toolip="Accept" 
                    className='p-1 rounded-lg'                        
                    disabled={loading} 
                    onClick={acceptRequest}
                />
                {
                    !isAddingMember && (
                        <SecondaryButton 
                            leftIcon={<X className='size-6' />} 
                            toolip="Decline" 
                            isColored={false}
                            className='p-1 rounded-lg'
                            disabled={loading}
                            onClick={declineRequest}
                        />
                    )
                }
            </div>
        </div>
    </div>
  )
}

export default JoinRequestPreview