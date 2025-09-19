import React, { useState } from 'react'
import { X } from 'lucide-react'

import { useAuthStore } from '../../store/auth.store'
import { useLayoutStore } from '../../store/layout.store'

import { cancelJoinRequest } from '../../lib/api/group.api'

import { timeSince } from '../../lib/util/timeFormat'

import SecondaryButton from '../SecondaryButton'

/* 
 * SentJoinRequestPreview component
 * Preview for sidebar sent join requests in groups pages.

 * - Displays group infos: image, name.
 * - Displays request's time as additional info
 * - Displays action button to cancel request 

 * Integrates with API functions:
 * - `cancelJoinRequest`

 * Uses utility function: `timeSince`

 * params:
 * - request: object infos to display
 * - isSelected: boolean to check if the requester is open in main profile container or not
 * - onSelect: callback function to select the requested group to display on group profile container
 * - onCancel: callback function to update group profile and requests list after canceling request
*/
const SentJoinRequestPreview = ({request, isSelected, onSelect, onCancel}) => {
    const { setAuthUser } = useAuthStore();
    const { isMobile } = useLayoutStore();

    // loading state
    const [loading, setLoading] = useState(false);
  
    // handle cancel join request
    const cancelRequest = async () => {
        setLoading(true);
        try {
            const res = await cancelJoinRequest(request.groupID);
            if(res?.group) {
                setAuthUser(res.user);
                onCancel(res.group)
            }    
        } catch (error) {
            console.log("error in cancel request in sent join requst preview", error)
        } finally {
            setLoading(false);
        }
    }

  return (
    <div
      title={request.name}
      onClick={() => onSelect(request.groupID)} 
      className={`w-full flex items-center gap-2 py-1 px-2 cursor-pointer mt-2 ${!isMobile && isSelected && 'bg-light-300 dark:bg-dark-300'}
     text-light-txt dark:text-dark-txt hover:bg-light-100 dark:hover:bg-dark-100`}
    >
        {/* image */}
       <img src={request.image ? request.image : '/assets/group-avatar.svg'} className='size-12 rounded-full'/>
       <div className='flex flex-col min-w-0 flex-1'>
            {/* name */}
            <p className='font-semibold truncate'>{request.name}</p>
            {/* request date */}
            <p className='text-xs truncate text-light-txt2 dark:text-dark-txt2'>
                {
                    `sent ${timeSince(request.requestedAt, "")}`
                }
            </p>
       </div>
       {/* cancel request button */}
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
                loading={loading}
            />
        </div>
    </div>
  )
}

export default SentJoinRequestPreview