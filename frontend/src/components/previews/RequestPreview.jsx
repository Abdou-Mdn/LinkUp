import React, { useState } from 'react'
import { UserCheck, UserX, X } from 'lucide-react'

import { acceptFriendRequest, cancelFriendRequest, declineFriendRequest } from '../../lib/api/user.api'

import { useLayoutStore } from '../../store/layout.store'

import { timeSince } from '../../lib/util/timeFormat'

import SecondaryButton from '../SecondaryButton'
import TertiaryButton from '../TertiaryButton'

/* 
 * RequestPreview component
 * Preview for sidebar friend requests (sent/recieved) in friends pages.

 * - Displays user infos: image, name, online status.
 * - Displays request's time as additional info
 * - Displays action buttons based on request type (sent or received) 

 * Integrates with API functions:
 * - `acceptFriendRequest`, `declineFriendRequest`, `cancelFriendRequest`

 * Uses utility function: `timeSince`

 * params:
 * - request: object infos to display
 * - isSent: boolean to check if request is sent or received
 * - isSelected: boolean to check if the requester is open in main profile container or not
 * - onSelect: callback function to select a requester to display on profile container
 * - onCancel: callback function to update profile and requests list after canceling request
 * - onAccept: callback function to update profile and requests list after accepting request
 * - onDecline: callback function to update profile and requests list after declining request 
 */
const RequestPreview = ({request, isSent, isSelected, onSelect, onCancel, onAccept, onDecline}) => {
    const { isMobile } = useLayoutStore();
    // loading states
    const [canceling, setCanceling] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [declining, setDeclining] = useState(false)

    // handle cancel request
    const cancelRequest = async () => {
        setCanceling(true);
        try {
            const res = await cancelFriendRequest(request.userID);
            if(res?.user && onCancel) {
            onCancel(res.user, res.profile);
            }   
        } catch (error) {
            console.log("error in cancel request from request preview", error);     
        } finally {
            setCanceling(false);
        }
    }

    // handle accept request
    const acceptRequest = async () => {
        setAccepting(true);
        try {
            const res = await acceptFriendRequest(request.userID);
            if(res?.user && onAccept) {
                onAccept(res.user, res.profile);
            }        
        } catch (error) {
            console.log("error in accept request from request preview", error);     
        } finally {
            setAccepting(false);
        }
    }

    // handle decline request
    const declineRequest = async () => {
        setDeclining(true);
        try {
            const res = await declineFriendRequest(request.userID);
            if(res?.user && onCancel) {
                onDecline(res.user, res.profile);
            }      
        } catch (error) {
            console.log("error in decline request from request preview", error);     
        } finally {
            setDeclining(false);
        }
    
    }
  
  return (
    <div
      title={request.name}
      onClick={() => onSelect(request.userID)} 
      className={`w-full flex items-center gap-2 py-1 px-2 cursor-pointer mt-2 ${!isMobile && isSelected && 'bg-light-300 dark:bg-dark-300'} text-light-txt dark:text-dark-txt hover:bg-light-100 dark:hover:bg-dark-100`}
    >
        {/* image */}
        <img src={request.profilePic ? request.profilePic : '/assets/avatar.svg'} className='size-12 rounded-full'/>
        <div className='flex flex-col min-w-0 flex-1'>
            {/* name */}
            <p className='font-semibold truncate'>{request.name}</p>
            {/* request date */}
            <p className='text-xs truncate text-light-txt2 dark:text-dark-txt2'>
                {
                    `${isSent ? 'Sent' : 'Received'} ${timeSince(request.requestedAt, "")}`
                }
            </p>
        </div>
        {
            // if request is sent display only cancel request button
            isSent ? (
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
                        loading={canceling}
                    />
                </div>
            ) : (
                // else display accept/decline buttons
                <div className='flex items-center gap-2'>
                    {/* accept request button */}
                    <TertiaryButton 
                        leftIcon={<UserCheck className='size-6' />} 
                        toolip="Accept" 
                        className='p-1 rounded-lg'
                        onClick={(e) => {
                            e.stopPropagation();
                            acceptRequest()
                        }}                 
                        loading={accepting}       
                        disabled={declining} 
                    />
                    {/* decline request button */}
                    <SecondaryButton 
                        leftIcon={<UserX className='size-6' />} 
                        toolip="Decline" 
                        className='p-1 rounded-lg'
                        onClick={(e) => {
                            e.stopPropagation();
                            declineRequest();
                        }}
                        loading={declining}
                        disabled={accepting} 
                    />
                </div>
            )
        }
    </div>
  )
}

export default RequestPreview