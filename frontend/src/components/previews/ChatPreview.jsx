import React from 'react'
import { useAuthStore } from '../../store/auth.store'
import { formatDateWithSuffix, timeSince } from '../../lib/util/timeFormat'


const ChatPreview = ({chat, onClick = () => {}}) => {
  
    const { authUser } = useAuthStore();
    const isGroup = chat.isGroup;
    const message = chat.lastMessage;


    let otherUser, seenByOther, isOnline = null;
    if(!isGroup) {
        otherUser = chat.participants.filter(p => p.userID !== authUser.userID)[0];
        seenByOther = message.seenBy.some(u => u.user == otherUser.userID);
    }

    const isMyMessage = message.sender.userID == authUser.userID;
    const seenByMe = message.seenBy.some(u => u.user == authUser.userID);

    let additionalInfo = isMyMessage ? "You" : isGroup ? message.sender.name : "";
    
    if(message.isDeleted) {
        additionalInfo += " deleted message"
    } else if(!isMyMessage && message.replyTo) {
        additionalInfo += " replied to your message";
    } else if(message.groupInvite) {
        additionalInfo += " sent a group invite";
    } else if (!message.text && message.image) {
        additionalInfo += " sent an image";
    } else if (message.isAnnouncement) {
        additionalInfo += " " + message.text;
    } else {
        additionalInfo += `${isGroup || isMyMessage ? ':' : ''} ` + message.text;
    }

  return (
    <div 
        onClick={() => onClick(chat)}
        title={isGroup ? chat.group.name : otherUser.name}
        className='w-full flex items-center gap-3 px-1 py-2 cursor-pointer mt-1 bg-light-200 dark:bg-dark-200 text-light-txt dark:text-dark-txt hover:bg-light-100 dark:hover:bg-dark-100'
    >
        <div className='flex-shrink-0 relative size-fit'>
            {
                isGroup ? (
                    <img src={chat.group.image ? chat.group.image : '/assets/group-avatar.svg'} className='size-12 rounded-[50%]'/>
                ) : (
                    <img src={otherUser.profilePic ? otherUser.profilePic : '/assets/avatar.svg'} className='size-12 rounded-[50%]'/>
                )
            }
            { isOnline && <div className='bg-accent border-3 border-light-200 dark:border-dark-200 size-4.25 rounded-[50%] absolute -right-0.75 -bottom-0.75'></div> }
        </div>
       <div className='w-full flex flex-col min-w-0'>
            {
                isGroup ? (
                    <p className={`truncate ${seenByMe ? "font-normal" : "font-bold"}`}>{chat.group.name}</p>
                ) : (
                    <p className={`truncate ${seenByMe ? "font-normal" : "font-bold"}`}>{otherUser.name}</p> 
                )
            }
            <div className={`flex items-center gap-1 text-sm ${seenByMe && 'text-light-txt2 dark:text-dark-txt2'}`}>
                <p className='truncate'>{additionalInfo}</p>
                <p className='text-xs shrink-0'>{`• ${timeSince(chat.updatedAt)}`}</p>
            </div>
       </div>
       {
        !seenByMe && <div className='size-2.5 shrink-0 bg-primary rounded-[50%]'></div>
       }
       {
        isMyMessage && seenByOther && <img src={(otherUser.profilePic && !otherUser.isDeleted) ? otherUser.profilePic : '/assets/avatar.svg'} className='size-4 shrink-0 rounded-[50%]'/>
       }
    </div>
  )
}

export default ChatPreview