import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { Ban, CheckCheck, CircleAlert, CirclePlus, ClipboardCopy, Download, Reply, SendHorizonal, SquarePen, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence, animate } from 'motion/react';

import { useAuthStore } from '../../store/auth.store'
import { useChatStore } from '../../store/chat.store';

import { deleteMessage } from '../../lib/api/chat.api';
import { cancelJoinRequest, sendJoinRequest } from '../../lib/api/group.api';

import { formatChatDate, formatTime, timeSince } from '../../lib/util/timeFormat';

import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton'
import TertiaryButton from '../TertiaryButton';


/* 
 * Message type announcement. 
 * Displays system announcements 

 * params :
 * - name: sender name.
 * - text: announcement's text content
*/
const Announcement = ({ name, text}) => {
    return (
        <div className='p-1 w-full text-center text-xs lg:text-sm text-light-txt2 dark:text-dark-txt2'>
            <p>{`${name} ${text}`}</p>
        </div>
    )
}

/* 
 * Message type deleted. 
 * Displays placeholder for deleted messages 

 * params :
 * - name: sender name.
 * - isMine: boolean controls whether it's my message or not (for alignment left/right)
 * - displaySender: boolean controls whether sender's profile picture is displayed next to message or not
 * - sender: message sender's infos
 * - setDisplayMenu: setter to toggle details visibility (no menu for deleted messages just additional infos)
*/
const DeletedMessage = ({name, isMine, displaySender, sender, setDisplayMenu}) => {
    return (
        <div className='w-full relative'>
            <div 
                onClick={() => setDisplayMenu(prev => !prev)}
                className='w-full min-w-[100px] p-2 lg:px-4 flex items-center gap-2 rounded-2xl border-1 text-light-txt2 dark:text-dark-txt2 border-light-txt2 dark:border-dark-txt2'
            > 
                <Ban className='size-4' />
                <span className='text-sm lg:text-normal'>{`${isMine ? "You" : name} deleted this message`}</span>
            </div>
            {/* sender's profile picture */}
            { displaySender &&
                <div className={`size-6 lg:size-8 rounded-full bg-transparent absolute bottom-0 ${isMine ? '-right-7 lg:-right-9' : '-left-7 lg:-left-9'}`}>
                    <img src={ sender ? sender : '/assets/avatar.svg'} className='size-6 lg:size-8 rounded-full shrink-0' />
                </div>
            }
        </div>
    )
}

/* 
 * Message type group invite. 
 * Displays group card with action button for group invites 

 * Integrates with API functions:
 * - `sendJoinRequest`, `cancelJoinRequest`
 
 * Uses utility function: `formatTime`

 * params :
 * - message: message infos to display.
 * - isMine: boolean controls whether it's my message or not (for alignment left/right)
 * - displaySender: boolean controls whether sender's profile picture is displayed next to message or not
 * - sender: message sender's infos
 * - isSeen: boolean controls whether the message is seen or not
 * - displayMenu: boolean state controls options menu and details visibility
 * - setDisplayMenu: setter to toggle displayMenu state
 * - setDeleteModal, setEdit, setText, setReplyTo, inputRef: passed down to options menu
*/
const GroupCard = ({message, isMine, displaySender, sender, isSeen, displayMenu, setDisplayMenu, setDeleteModal, setEdit, setText, setReplyTo, inputRef, disabledChat, isTemp}) => {
    const { authUser, setAuthUser } = useAuthStore();
    // loading state
    const [loading, setLoading] = useState(false);

    // options menu logic
    const [menuPosition, setMenuPosition] = useState("bottom");
    const menuRef = useRef(null);
    const containerRef = useRef(null);

    // get group infos
    const group = message.groupInvite;
    // get members count
    const count = group.members.length;
    // check if user is already a member
    const isMember = group.members.some(m => m.user == authUser.userID);
    // check if user already sent a join request
    const sentRequest = authUser.sentJoinRequests.some(r => r.group == group.groupID);

    // handle options menu position (top/bottom based on available space)
    useEffect(() => {
        if (displayMenu && containerRef.current) {
            // get the bounding box of the container relative to the viewport
            const containerRec = containerRef.current.getBoundingClientRect();
            
            // calculate available space above the container
            const spaceAbove = containerRec.top;
            
            // measure menu height
            const menuHeight = menuRef.current.offsetHeight;
        
            // decide whether the dropdown should open upwards or downwards:
            // - if there's enough space above, place it on top.
            // - otherwise, default to placing it below.
            if (spaceAbove > menuHeight) {
                setMenuPosition("top");
            } else {
                setMenuPosition("bottom");
            }
        }

        // ensure the dropdown stays in view when it opens by smoothly scrolling it into the visible area if needed
        if (displayMenu && menuRef.current) {
            menuRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [displayMenu]);

    // handle click outside of menu
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setDisplayMenu(false);
            }
        };
        if (displayMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [displayMenu]);

    // handle send join request
    const handleJoin = async (event) => {
        event.stopPropagation();
        if(loading) return;
        setLoading(true);
        try {
            const res = await sendJoinRequest(group.groupID);
            if(res?.user) {
                setAuthUser(res.user);
            }   
        } catch (error) {
            console.log("error in group card send join request", error)
        } finally {
            setLoading(false);
        }   
    }

    // handle cancel join request
    const handleCancel = async (event) => {
        event.stopPropagation()
        setLoading(true);
        try {
            const res = await cancelJoinRequest(group.groupID);
            if(res?.user) {
                setAuthUser(res.user);
            }
        } catch (error) {
            console.log("error in group card send join request", error)
        } finally {
            setLoading(false);
        }   
    }

    return (
        <div className='w-full relative' ref={containerRef}>
            <div 
                onClick={() => { if(!isTemp) setDisplayMenu(prev => !prev) }}
                className={`w-full min-w-[200px] p-2 overflow-hidden flex flex-col items-center gap-2 bg-light-200 dark:bg-dark-200 text-light-txt dark:text-dark-txt
                    ${isMine ? 'rounded-tr-4xl rounded-tl-4xl rounded-bl-4xl' : 'rounded-tr-4xl rounded-tl-4xl rounded-br-4xl'}
                `}
            >
                {/* group infos */}
                <div className='w-full flex items-center gap-3 '>
                    {/* image */}
                    <img src={group.image ? group.image : '/assets/group-avatar.svg'} className='size-12 lg:size-15 rounded-full'/>
                    <div>
                        {/* name */}
                        <p className='font-semibold'>{group.name}</p>
                        {/* members count */}
                        <p className='text-xs opacity-80'>
                            {`${count} ${count == 1 ? 'member' : 'members'}`}
                        </p>
                    </div>
                </div>
                {/* notice text */}
                <p className='w-full text-center text-sm lg:text-normal px-4'>
                    {`${isMine ? "You sent" : "Sent you"} an invite to join `} <strong>{group.name}</strong>
                </p>
                {/* action button */}
                {
                    isMember ? 
                    /* disabled button for members */
                    <PrimaryButton 
                        text="Already a member" 
                        className='w-full p-3 text-sm lg:text-normal' 
                        disabled={isMember} 
                    /> :  
                    sentRequest ? (
                        /* cancel join request for users who already sent a request */
                        <SecondaryButton 
                            text='Cancel Request' 
                            isColored={false} 
                            className='w-full p-3 text-sm lg:text-normal' 
                            leftIcon={<X className='size-5 lg:size-6' />}
                            disabled={isMember}
                            loading={loading}
                            onClick={(e) => handleCancel(e)}
                        />
                    ) : (
                        /* send join request if didn't send yet */
                        <PrimaryButton 
                            text="Join" 
                            className='w-full p-3 text-sm lg:text-normal' 
                            leftIcon={<CirclePlus className='size-5 lg:size-6' />}
                            disabled={isMember}
                            loading={loading}
                            onClick={(e) => handleJoin(e)} 
                        />
                    )
                }
                {/* message sent time */}
                <div className='w-full flex items-center justify-end gap-1 pb-1 pr-2'>
                    <span className='text-xs opacity-80'>{formatTime(message.createdAt)}</span>
                </div>
            </div>
            {/* sender profile pic */}
            { displaySender &&
                <div className={`size-6 lg:size-8 rounded-full bg-transparent absolute bottom-0 ${isMine ? '-right-7 lg:-right-9' : '-left-7 lg:-left-9'}`}>
                    <img src={ sender ? sender : '/assets/avatar.svg'} className='size-6 lg:size-8 rounded-full shrink-0' />
                </div>
            }
            {/* menu options */}
            <AnimatePresence>
            {
                !isTemp && displayMenu && 
                <OptionsMenu 
                    ref={menuRef} 
                    position={menuPosition} 
                    message={message}
                    isMine={isMine}
                    isSeen={isSeen}
                    isGroupCard={true}
                    onClose={() => setDisplayMenu(false)}
                    setEdit={setEdit}
                    setText={setText}
                    setReplyTo={setReplyTo}
                    setDeleteModal={setDeleteModal}   
                    inputRef={inputRef}
                    disabledChat={disabledChat}
                />
            }
            </AnimatePresence>
        </div>
    )
}

/* 
 * Message type normal. 
 * Displays bubble for normal messages (colored based on sender)
 * Displays reply section in case the message is a reply
 * Displays image and text  

 * Uses utility function: `formatTime`

 * params :
 * - message: message infos to display.
 * - isMine: boolean controls whether it's my message or not (for alignment left/right)
 * - displaySender: boolean controls whether sender's profile picture is displayed next to message or not
 * - sender: message sender's infos
 * - isSeen: boolean controls whether the message is seen or not
 * - displayMenu: boolean state controls options menu and details visibility
 * - setDisplayMenu: setter to toggle displayMenu state
 * - setDeleteModal, setEdit, setText, setReplyTo, inputRef: passed down to options menu
 * - scrollToMessage: function to scroll to the original message of reply section
*/
const Bubble = ({message, isMine, displaySender, sender, isSeen, displayMenu, setDisplayMenu, setDeleteModal, setReplyTo, setEdit, setText, inputRef, scrollToMessage, disabledChat, isTemp}) => {
    
    // get reply's original message infos
    const replyTo = message.replyTo;
    
    // options menu logic
    const [menuPosition, setMenuPosition] = useState("bottom");
    const menuRef = useRef(null);
    const containerRef = useRef(null);

    // handle options menu position (top/bottom based on available space)
    useEffect(() => {
        if (displayMenu && containerRef.current) {
            // get the bounding box of the container relative to the viewport
            const containerRec = containerRef.current.getBoundingClientRect();
            
            // calculate available space above the container
            const spaceAbove = containerRec.top;
            
            // measure menu height
            const menuHeight = menuRef.current.offsetHeight ;
          
            // decide whether the dropdown should open upwards or downwards:
            // - if there's enough space above, place it on top.
            // - otherwise, default to placing it below.
            if (spaceAbove > menuHeight) {
                setMenuPosition("top");
            } else {
                setMenuPosition("bottom");
            }
        }

        // ensure the dropdown stays in view when it opens by smoothly scrolling it into the visible area if needed
        if (displayMenu && menuRef.current) {
            menuRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [displayMenu]);
    
    // handle click outside of menu
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setDisplayMenu(false);
            }
        };
        if (displayMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [displayMenu]);

    return (
        <div className='w-full relative' ref={containerRef}>
            <div 
                onClick={() => { if(!isTemp) setDisplayMenu(prev => !prev) }}
                className={`w-full min-w-[100px] overflow-hidden flex flex-col items-center gap-1
                    ${isMine ? 'bg-gradient-to-tr from-primary to-secondary text-inverted rounded-tr-2xl rounded-tl-2xl rounded-bl-2xl' : 
                    'bg-light-300 text-light-txt dark:bg-dark-300 dark:text-dark-txt rounded-tr-2xl rounded-tl-2xl rounded-br-2xl'}
                `}
            >
                {/* reply section (only if the message is a reply) */}
                {replyTo && (
                    <div className='w-full pt-2 px-2 min-w-[200px]'>
                        <div 
                            onClick={(e) => {
                                e.stopPropagation();
                                scrollToMessage(replyTo.messageID)
                            }}
                            className={`w-full max-h-12 rounded-xl flex items-center gap-1 lg:gap-2 shadow-4xl overflow-hidden cursor-pointer group
                                ${isMine ? 'bg-[#fff4]' : 'bg-[#0004] dark:bg-[#fff4]'}
                            `}
                        >
                            <div className={`h-20 w-1.5 group-hover:w-2 mr-1 transition-all ${isMine ? 'bg-inverted' : 'bg-light-txt dark:bg-dark-txt'}`}>.</div>
                            {/* display image preview if original message is not deleted and has an image*/}
                            {replyTo.image && !replyTo.isDeleted && <img src={replyTo.image} alt="" className='size-8 lg:size-10 shrink-0 rounded-sm object-cover' />}
                            <div className='flex-1 flex flex-col px-1 max-w-[75%]'>
                                {/* original message name */}
                                <span className='text-sm font-bold'>{replyTo.sender.name}</span>
                                {/* original message infos (deleted/ group invite/ photo/ text) */}
                                <span className='text-xs truncate'>
                                    { replyTo.isDeleted ? 'Deleted Message' : replyTo.groupInvite ? 'Group Invite' : (!replyTo.text && replyTo.image) ? 'Photo' : replyTo.text}            
                                </span>
                            </div>
                        </div> 
                    </div>
                )}
                {/* image if message has one */}
                {message.image && <img src={message.image} alt="" className='max-w-full h-auto object-contain' />}
                {/* message's content text (pre formatted, keeps the same format as typed) */}
                {message.text && <p className='w-full text-sm lg:text-normal pt-1 px-2 lg:px-4 whitespace-pre-wrap'>{message.text}</p>}
                <div className='w-full flex items-center justify-end gap-1 pb-1 pr-2'>
                    {/* display if message is edited */}
                    { message.isEdited && <span className='text-xs opacity-80'>Edited •</span>}
                    {/* message timestamp */}
                    <span className='text-xs opacity-80'>{formatTime(message.createdAt)}</span>
                </div>
            </div>
            {/* sender's profile picture */}
            { displaySender &&
                <div className={`size-6 lg:size-8 rounded-full bg-transparent absolute bottom-0 ${isMine ? '-right-7 lg:-right-9' : '-left-7 lg:-left-9'}`}>
                    <img src={ sender ? sender : '/assets/avatar.svg'} className='size-6 lg:size-8 rounded-full shrink-0' />
                </div>
            }
            {/* options menu */}
            <AnimatePresence>
            {
                !isTemp && displayMenu && 
                <OptionsMenu 
                    ref={menuRef} 
                    position={menuPosition} 
                    message={message}
                    isMine={isMine}
                    isSeen={isSeen}
                    onClose={() => setDisplayMenu(false)}
                    setReplyTo={setReplyTo}
                    setEdit={setEdit}
                    setText={setText}
                    setDeleteModal={setDeleteModal}
                    inputRef={inputRef}   
                    disabledChat={disabledChat}
                />
            }
            </AnimatePresence>
        </div>
    )
}

/* 
 * MessageFooter. 
 * Displays message status under the bubble (delivered/ seen) 
 * Displays delivered if it's my last message and is not seen by anyone
 * Displays small images of users who saw my message
 * Displays text if displayDetails is true, (seen at time) if it's in a private chat, (seen by names) if it's group chat  

 * Uses utility function: `timeSince`

 * params :
 * - seendBy: array of users who saw the message
 * - seenByOther: infos of seen status in private chat (time)
 * - myLastMessage: boolean controls whether message footer is rendered or not
 * - displayDetails: boolean controls whether footer contains text details or seen images
*/
const MessageFooter = ({seenBy, seenByOther, myLastMessage, displayDetails, isTemp, status}) => {
    const { selectedChat } = useChatStore();

    if(isTemp && myLastMessage) {
        return (
            <div className={`max-w-full flex items-center justify-end gap-1 pt-0.5 text-xs capitalize ${status == "failed" ? 'text-danger' : 'text-light-txt2 dark:text-dark-txt2 animate-pulse'}`}>
                <>
                    <span>{status}</span> 
                    { status == "failed" ? <CircleAlert className='size-4' /> : <SendHorizonal className='size-4' /> }
                </>
            </div>    
        )
    }

    // check if chat is group chat or private
    const isGroup = selectedChat.isGroup;
    // get the time the message was seen by the other user (private chat)
    const seenAt = seenByOther.length > 0 ? seenByOther[0].seenAt : null;

    // get the names of the users who saw my message (group chat)
    let seenByNames = seenByOther.map(s => {
        const participant = selectedChat.participants.find(p => p.userID == s.user);

        if(!participant) return;
        
        return {
            userID: participant.userID,
            name: participant.name
        }
    })

    
    return (
        <div className='max-w-full flex items-center justify-end gap-1 pt-0.5 text-xs text-light-txt2 dark:text-dark-txt2'>
            {
                // display delivered if no one saw my message yet (only on my last message)
                (seenByOther.length == 0) ? (
                    myLastMessage &&
                    <>
                        <span>Delivered</span> 
                        <CheckCheck className='size-4' />
                    </>
                ) : (
                    // if display details is false render images 
                    !displayDetails ? (
                        <>
                            {
                                seenBy.slice(0, 3).map((u) => (
                                    <img 
                                        key={u.userID}
                                        src={u.profilePic ? u.profilePic : "/assets/avatar.svg"}
                                        alt="" 
                                        className='size-3.5 rounded-full' 
                                    />
                                ))
                            }
                            {/* in case there are more than 3 viewers add a (+#) */}
                            {   seenBy.length > 3 && (
                                    <div className="size-3.5 flex items-center justify-center text-[10px] rounded-full bg-light-300 dark:bg-dark-300 text-light-txt dark:text-dark-txt">
                                        +{seenBy.length - 3}
                                    </div>
                                )
                            }
                        </>
                    ) : (
                        // if displayDetails is true render text details
                        // display time if it's private chat
                        !isGroup ? (
                            <span>{`Seen ${timeSince(seenAt)}`}</span>
                        )  : (
                            // display list of viewers names if it's group chat
                            <p className="flex flex-wrap gap-x-1">
                                <span>Seen by</span>
                                {seenByNames.map((user, idx) => (
                                    <span key={user.userID}>
                                        {user.name}{(idx < seenByNames.length - 1) && ","}
                                    </span>
                                ))}
                            </p>
                        )
                    )
                )
            }
        </div>
    )
}

/* 
 * OptionsMenu. 
 * Displays menu with different options based on the message 

 * Forwards the menu ref to the parent component to decide menu position

 * params :
 * - position: menu's position (top/bottom)
 * - message: message who opened the menu
 * - isMine: boolean controls whether the message is mine or not (user for menu alignment right/left)
 * - isSeen: if message was seen by others
 * - isGroupCard: if message is a group card
 * - onclose: setter to close the option menu
 * - setEdit: setter to set message as the edit target of chat input
 * - setText: setter to set chat input's text to message's content
 * - setReplyTo: setter to set message as reply target of chat input
 * - setDeletModal: setter to toggle delete message confirmation modal
 * - inputRef: chat input ref used to focus the input
*/
const OptionsMenu = forwardRef(({position, message, isMine, isSeen, isGroupCard = false, onClose, setEdit, setText, setReplyTo, setDeleteModal, inputRef, disabledChat}, ref) => {

    // animation varaiants
    const variants = {
        initial: (position) => ({
            opacity: 0,
            y: position == 'top' ? 10 : -10
        }),
        animate: {
            opacity: 1,
            y: 0
        },
        exit: (position) => ({
            opacity: 0,
            y: position == 'top' ? 10 : -10
        })
    }

    // handle select reply to message
    const handleReplyTo = () => {
        setEdit(null);
        setText('');
        setReplyTo(message);
        inputRef.current.focus();
        onClose();
    }

    // handle select copy to clipboard
    const handleCopy = async() => {
        await navigator.clipboard.writeText(message.text)
        toast.success("Text copied to clipboard!")
        onClose()
    }

    // handle select download image 
    const handleSave = async () => {
        try {
            const response = await fetch(message.image);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "image.jpg"; 
            a.click();

            a.remove();
            window.URL.revokeObjectURL(url); 
        } catch (error) {
            console.error("Error saving image:", error);
            toast.error("Error saving the image");
        } finally {
            onClose();
        }
    };

    // handle select edit message
    const handleEdit = () => {
        setReplyTo(null)
        setEdit(message);
        setText(message.text);
        inputRef.current.focus();
        onClose();
    }
    
    return (
        <motion.div
            ref={ref}
            className={`border-1 drop-shadow-lg rounded-lg text-sm lg:text-normal py-2 px-1 flex flex-col gap-2  w-[250px] absolute z-10 ${isMine ? 'right-1/4 lg:right-1/2' : 'left-1/4 lg:left-1/2'} ${position === 'top' ? 'bottom-full mb-2' : 'top-1/2'} bg-light-200 border-light-txt2 text-light-txt dark:bg-dark-200 dark:border-dark-txt2 dark:text-dark-txt`}
            variants={variants}
            custom={position}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            {/* reply to option */}
            {!disabledChat && 
                <button  
                    className='flex items-center gap-4 p-2 capitalize transition-all cursor-pointer hover:bg-light-300 hover:dark:bg-dark-300'
                    onClick={handleReplyTo}  
                >
                    <Reply className='size-5 lg:size-6' />
                    Reply to
                </button>
            }
            {/* copy to clipboard option (only if message has text and is not a group invite) */}
            {
                !isGroupCard && message.text && (
                <button  
                    className='flex items-center gap-4 p-2 capitalize transition-all cursor-pointer hover:bg-light-300 hover:dark:bg-dark-300'
                    onClick={handleCopy}
                >
                    <ClipboardCopy className='size-5 lg:size-6' />
                    Copy to clipboard
                </button>
                )
            }
            {/* save image option (only if message has image and is not a group invite) */}
            {
                !isGroupCard && message.image && (
                <button  
                    className='flex items-center gap-4 p-2 capitalize transition-all cursor-pointer hover:bg-light-300 hover:dark:bg-dark-300'
                    onClick={handleSave}
                >
                    <Download className='size-5 lg:size-6' />
                    Save image
                </button>
                )
            }
            {/* edit message option (only if message is mine and not seen and is not a group invite) */}
            {
                !disabledChat && isMine && !isGroupCard && !isSeen && (
                <button  
                    className='flex items-center gap-4 p-2 capitalize transition-all cursor-pointer hover:bg-light-300 hover:dark:bg-dark-300'
                    onClick={handleEdit}
                >
                    <SquarePen className='size-5 lg:size-6' />
                    Edit
                </button>
                )
            }
            {/* delete message option (only if message is mine) open confirmation modal */}
            {
                !disabledChat && isMine && (
                <button  
                    className='flex items-center gap-4 p-2 capitalize transition-all cursor-pointer hover:bg-light-300 hover:dark:bg-dark-300'
                    onClick={() => setDeleteModal(true)}
                >
                    <Trash2 className='size-5 lg:size-6' />
                    Delete
                </button>
                )
            }
        </motion.div>
    )
})


/* 
 * MessageBubble component
 * Preview for message with all types.

 * - Displays message in different styles based on message type.
 * - Displays date separator to group message by day
 * - Displays delete message confirmation modal
 
 * Integrates with API functions:
 * - `deleteMessage`,
 
 * Uses utility function: `formatChatDate`

 * params:
 * - message: object infos to display
 * - displayDay: boolean to control day separator display
 * - display sender: boolean to control sender's image
 * - myLastMessage: boolean to control whether message is my last sent message
 * - setReplyTo, setEdit, setText, inputRef: passed down to OptionMenu via Bubble and GroupCard 
 * - scrollToMessage: passed down to Bubble
 * - onDelete: callback function to update messages and chat after deleting the message 
*/
const MessageBubble = ({message, displayDay, displaySender, myLastMessage, isHighlighted, setReplyTo, setEdit, setText, inputRef, scrollToMessage, onDeleteMessage, disabledChat}) => {
  const { authUser } = useAuthStore();
  const { getSeenBy, messages, updateMessages } = useChatStore();

  // management states
  const [displayMenu, setDisplayMenu] = useState(false); // menu option visibility control state 
  const [deleteModal, setDeleteModal] = useState(false); // delete message confirmation modal visibility state
  const [loading, setLoading] = useState(false); // lodaing state

  // check if message is optimistic 
  const isTemp = message.tempID ? true : false;

  // check if message is mine or not (for alignment)
  const isMine = message.sender.userID === authUser.userID;

  // get other user infos who saw my message
  const seenByOther = message.seenBy.filter(s => s.user !== authUser.userID);

  // get list of users who saw the message (if not an optimistic message)
  let seenBy;
  if(!isTemp) {
    seenBy = getSeenBy(message.messageID); 
  }
  
  // handle delete message
  const handleDeleteMessage = async () => {
    if(loading) return;
    try {
        setLoading(true);
        const res = await deleteMessage(message.messageID);

        if(res?.deletedMessage) {
            const newMessages = messages.map(msg => msg.messageID == message.messageID ? { ...msg, text: "", image: "", isDeleted: true } : msg);
            updateMessages(newMessages);
            onDeleteMessage(message.chatID, message.messageID);
        }
    } catch (error) {
        console.log("error in deleting message", error);
    } finally {
        setLoading(false);
        // close modal
        setDeleteModal(false)
    }
  }

  return (
    <>
        {/* day separator */}
        {
            displayDay && (
                <div className='p-1 px-10 w-full flex items-center justify-center gap-4 text-center text-xs lg:text-sm text-light-txt2 dark:text-dark-txt2'>
                    <div className='flex-1 h-[1px] opacity-70 bg-light-txt2 dark:bg-dark-txt2'></div>
                    <p>{formatChatDate(message.createdAt)}</p>
                    <div className='flex-1 h-[1px] opacity-70 bg-light-txt2 dark:bg-dark-txt2'></div>
                </div>
            )
        }
        {/* message container */}
        <div className={`w-full px-4 py-1 flex transition-colors ease-in-out ${isMine ? 'justify-end' : 'justify-start'} ${isHighlighted && (message.groupInvite ? 'bg-light-300 dark:bg-dark-300' : 'bg-light-200 dark:bg-dark-200')}`}>
            {/* display message based on it's type */}
            {
                // announcement
                message.isAnnouncement ? (
                    <Announcement 
                        name={message.sender.name}
                        text={message.text}
                    />                   
                ) : (
                    // align message to right if mine and to left if not
                    <div className='max-w-[80%] lg:max-w-[65%]'>
                        <div className={isMine ? 'pr-6 lg:pr-9' : 'pl-6 lg:pl-9'}>
                            
                            { 
                              // deleted message
                              message.isDeleted ? (
                                <DeletedMessage
                                    isMine={isMine}
                                    name={message.sender.name}
                                    displaySender={displaySender}
                                    sender={message.sender.profilePic}
                                    setDisplayMenu={setDisplayMenu}
                                />
                            ) :
                              // group invite 
                              message.groupInvite ? (
                                <GroupCard 
                                    message={message}
                                    isMine={isMine} 
                                    displaySender={displaySender}
                                    sender={message.sender.profilePic}
                                    isSeen={seenByOther.length > 0}
                                    displayMenu={displayMenu}
                                    setDisplayMenu={setDisplayMenu}
                                    setEdit={setEdit}
                                    setText={setText}
                                    setReplyTo={setReplyTo}
                                    setDeleteModal={setDeleteModal}
                                    inputRef={inputRef}
                                    disabledChat={disabledChat}
                                    isTemp={isTemp}
                                />
                            ) : ( 
                                // normal message
                                <Bubble
                                    message={message}
                                    isMine={isMine}
                                    displaySender={displaySender}
                                    sender={message.sender.profilePic}
                                    isSeen={seenByOther.length > 0}
                                    onClick={setDisplayMenu}
                                    displayMenu={displayMenu}
                                    setReplyTo={setReplyTo}
                                    setEdit={setEdit}
                                    setText={setText}
                                    setDisplayMenu={setDisplayMenu}
                                    setDeleteModal={setDeleteModal}
                                    inputRef={inputRef}
                                    scrollToMessage={scrollToMessage}
                                    disabledChat={disabledChat}
                                    isTemp={isTemp}
                                />
                            )}
                            {/* display footer under my message */}
                            { isMine && (
                                <MessageFooter
                                    myLastMessage={myLastMessage}
                                    seenBy={seenBy}
                                    seenByOther={seenByOther}
                                    displayDetails={displayMenu}
                                    isTemp={isTemp}
                                    status={message.status}
                                />
                            )}
                        </div>
                    </div>
                )
            }
        </div>
        {/* delete confirmation modal */}
        <AnimatePresence>
        {
            deleteModal && (
                <motion.div 
                    onClick={() => setDeleteModal(false)} 
                    className='bg-[#00000066] dark:bg-[#ffffff33] fixed inset-0 z-50 flex items-center justify-center'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div 
                        onClick={(e) => e.stopPropagation()} 
                        className='h-fit max-h-[40%] w-[50%] min-w-[350px] rounded-2xl flex flex-col items-center justify-center p-10 gap-4 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2}}
                    >
                        {/* title and text */}
                        <h3 className='text-danger lg:text-xl font-semibold flex items-center gap-2'>
                            <span> Delete Message </span>
                        </h3>
                        <span className='text-sm text-light-txt dark:text-dark-txt text-center'>
                            Are you sure you want to delete this message ?
                        </span>
                        <div className='mt-2 flex items-center gap-4 w-[80%] min-w-min-w-[300px]'>
                            {/* close modal button */}
                            <TertiaryButton
                                text="Cancel"
                                className='p-2 flex-1 text-sm lg:text-normal'
                                type='button'
                                disabled={loading}
                                onClick={() => setDeleteModal(false)}
                            />
                            {/* confirm deletion button */}
                            <SecondaryButton
                                text="Delete"
                                className='p-2 flex-1 text-sm lg:text-normal'
                                type='button'
                                isColored={true}
                                disabled={loading}
                                onClick={handleDeleteMessage}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )
        }
        </AnimatePresence>
    </>
  )
}

export default MessageBubble