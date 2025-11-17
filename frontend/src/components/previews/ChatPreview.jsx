import React from 'react'

import { useAuthStore } from '../../store/auth.store'
import { useChatStore } from '../../store/chat.store';
import { useLayoutStore } from '../../store/layout.store';

import { timeSince } from '../../lib/util/timeFormat'

/* 
 * ChatPreview component
 * Preview for sidebar chats in home page.

 * - Displays user/group infos: profile pic/image, name, online status.
 * - Displays last message infos: message content, message time, seen status.
 
 * Uses utility function: `timeSince`

 * params:
 * - chat: object infos to display
 * - onSelect: callback function to select a chat to display on chat container 
 */
const ChatPreview = ({chat, onSelect = () => {}}) => {
  
    const { authUser, onlineUsers } = useAuthStore();
    const { selectedChat } = useChatStore();
    const { isMobile } = useLayoutStore();

    // check if chat is selected
    const isSelected = selectedChat?.chatID === chat.chatID;

    // check if chat is group chat or private
    const isGroup = chat.isGroup;
    // get last message infos
    const message = chat.lastMessage;

    // check if at least one participant of the chat is online (authenticated user is excluded)
    const onlineMembers = isGroup ? chat.participants.filter(p => p !== authUser.userID && onlineUsers.includes(p)) : chat.participants.filter(p => p.userID !== authUser.userID && onlineUsers.includes(p.userID));
    const isOnline = onlineMembers.length > 0;

    // get other user infos from participants if chat is private, check if last message was seen by the other user
    let otherUser = null, seenByOther = false;
    if(!isGroup) {
        otherUser = chat.participants.filter(p => p.userID !== authUser.userID)[0];
        seenByOther = message.seenBy.some(u => u.user == otherUser.userID);
    }

    // check if last message was my message, and if it was seen by me
    const isMyMessage = message.sender.userID == authUser.userID;
    const seenByMe = message.seenBy.some(u => u.user == authUser.userID);

    // set up message infos to display 
    // if my message start with "You", if it's group chat start with sender name, else keep empty
    let additionalInfo = isMyMessage ? "You" : isGroup ? message.sender.name : "";

    if(message.isDeleted) {
        // message was deleted
        additionalInfo += ` ${additionalInfo.length == 0 ? 'D' : 'd'}eleted message`;
    } else if(!isMyMessage && message.replyTo) {
        // others replied to your message 
        additionalInfo += ` ${additionalInfo.length == 0 ? 'R' : 'r'}eplied to your message`;
    } else if(message.groupInvite) {
        // message is a group invite
        additionalInfo += ` ${additionalInfo.length == 0 ? 'S' : 's'}ent a group invite`;
    } else if (!message.text && message.image) {
        // message is an image only
        additionalInfo += ` ${additionalInfo.length == 0 ? 'S' : 's'}ent an image`;
    } else if (message.isAnnouncement) {
        // message is an announcement
        additionalInfo += " " + message.text;
    } else {
        // message has text, if it's my message or in chat group prepend ":"
        additionalInfo += `${isGroup || isMyMessage ? ':' : ''} ` + message.text;
    }

  return (
    <div 
        onClick={() => onSelect({chat})}
        title={isGroup ? chat.group.name : otherUser.name}
        className={`w-full flex items-center gap-3 px-1 py-2 cursor-pointer mt-1 transition-all ${!isMobile && isSelected && 'bg-light-300 dark:bg-dark-300'} bg-light-200 dark:bg-dark-200 text-light-txt dark:text-dark-txt hover:bg-light-100 dark:hover:bg-dark-100`}
    >
        {/* group/user image */}
        <div className='flex-shrink-0 relative size-fit'>
            {
                isGroup ? (
                    <img src={chat.group.image ? chat.group.image : '/assets/group-avatar.svg'} className='size-12 rounded-full'/>
                ) : (
                    <img src={otherUser.profilePic ? otherUser.profilePic : '/assets/avatar.svg'} className='size-12 rounded-full'/>
                )
            }
            {/* online status */}
            { isOnline && <div className='bg-accent border-3 border-light-200 dark:border-dark-200 size-4.25 rounded-full absolute -right-0.75 -bottom-0.75'></div> }
        </div>
        {/* informations */}
       <div className='w-full flex flex-col min-w-0'>
            {/* group/user name */}
            {
                isGroup ? (
                    <p className={`truncate ${seenByMe ? "font-normal" : "font-bold"}`}>{chat.group.name}</p>
                ) : (
                    <p className={`truncate ${seenByMe ? "font-normal" : "font-bold"}`}>{otherUser.name}</p> 
                )
            }
            {/* message infos + timestamp */}
            <div className={`flex items-center gap-1 text-sm ${seenByMe && 'text-light-txt2 dark:text-dark-txt2'}`}>
                <p className='truncate'>{additionalInfo}</p>
                <p className='text-xs shrink-0'>{`• ${timeSince(chat.updatedAt, "")}`}</p>
            </div>
       </div>
       {/* if message is not seen by me display a small bullet point */}
       {
        !seenByMe && <div className='size-2.5 shrink-0 bg-primary rounded-full'></div>
       }
       {/* if message is seen by other display their profile picture as small bullet point */}
       {
        isMyMessage && seenByOther && <img src={(otherUser.profilePic && !otherUser.isDeleted) ? otherUser.profilePic : '/assets/avatar.svg'} className='size-4 shrink-0 rounded-full'/>
       }
    </div>
  )
}

export default ChatPreview