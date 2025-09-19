import React, { useState } from 'react'
import { Check, X } from 'lucide-react'

import { acceptJoinRequest, declineJoinRequest } from '../../lib/api/group.api'

import { timeSince } from '../../lib/util/timeFormat'

import SecondaryButton from '../SecondaryButton'
import TertiaryButton from '../TertiaryButton'

/* 
 * JoinRequestPreview component
 * Preview for received requests list in group's profile.

 * - Displays requester infos: profile pic, name.
 * - Displays request's time as additional infos.
 * - Displays action buttons (accept/decline)
 
 * Integrates with API functions:
 * - `acceptJoinRequest`, `declineJoinRequest`
 
 * Uses utility function: `timeSince`

 * params:
 * - request: object infos to display
 * - groupID: group targeted by request actions
 * - onAccept: callback function to update group and groups list after accepting the request
 * - onDecline: callback function to update group and groups list after declining the request 
 * - isAddingMember: boolean to control whether request is in add member modal or not
*/
const JoinRequestPreview = ({request, groupID, onAccept, onDecline, isAddingMember = false}) => {
    // loading states
    const [accepting, setAccepting] = useState(false);
    const [declining, setDeclining] = useState(false);

    // handle accept request
    const acceptRequest = async () => {
        setAccepting(true);
        try {
            const res = await acceptJoinRequest(groupID, request.userID);
            if(res?.group) {
                onAccept(res.group, res.addedUser);
            }
        } catch (error) {
            console.log("error in accept join request", error);
        } finally {
            setAccepting(false);
        }
    }

    // handle decline request
    const declineRequest = async () => {
         setDeclining(true);
        try {
           
            const res = await declineJoinRequest(groupID, request.userID);
            if(res?.group) {
                onDecline(res.group, request.userID);
            }
        } catch (error) {
            console.log("error in decline join request", error);
        } finally {
            setDeclining(false);
        }
    }
  
  return (
    <div
      title={request.name} 
      className='w-full flex items-center gap-2 py-1 px-2 mt-2 bg-light-200 dark:bg-dark-200 hover:bg-light-100 dark:hover:bg-dark-100 text-light-txt dark:text-dark-txt'
    >
        {/* profile pic */}
        <img src={request.profilePic ? request.profilePic : '/assets/avatar.svg'} className='size-12 rounded-full'/>
        <div className='flex flex-col min-w-0 flex-1'>
            {/* name */}
            <p className='font-semibold truncate'>{request.name}</p>
            {/* request date */}
            <p className='text-xs truncate text-light-txt2 dark:text-dark-txt2'>
                {
                    `Requested ${timeSince(request.requestedAt)}`
                }
            </p>
        </div>
        {/* action buttons (display only accept button in adding members modal) */}
        <div className='flex flex-col items-end gap-1'>
            {/* request notice in adding memeber modal */}
            {isAddingMember && <p className='text-xs truncate text-light-txt2 dark:text-dark-txt2'>already sent a request</p>}
            <div className='flex items-center gap-2'>
                {/* accept request button */}
                <TertiaryButton
                    leftIcon={<Check className='size-5 lg:size-6' />} 
                    toolip="Accept" 
                    className={`${isAddingMember ? 'p-0.5 lg:p-1 rounded-sm lg:rounded-lg' : 'p-1 rounded-lg'}`}                        
                    loading={accepting}
                    disabled={declining} 
                    onClick={acceptRequest}
                    loaderSize='size-5 lg:size-6'
                />
                {/* decline request button */}
                {
                    !isAddingMember && (
                        <SecondaryButton 
                            leftIcon={<X className='size-5 lg:size-6' />} 
                            toolip="Decline" 
                            isColored={false}
                            className='p-1 rounded-lg'
                            loading={declining}
                            disabled={accepting}
                            onClick={declineRequest}
                            loaderSize='size-5 lg:size-6'
                        />
                    )
                }
            </div>
        </div>
    </div>
  )
}

export default JoinRequestPreview