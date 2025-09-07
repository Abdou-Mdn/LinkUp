import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../store/auth.store'
import { formatChatDate, formatTime, timeSince } from '../../lib/util/timeFormat';
import { Ban, Check, CheckCheck, CirclePlus, ClipboardCopy, Copy, Download, Eraser, FileImage, Mail, MessageSquareQuote, Reply, SquarePen, Trash2, X } from 'lucide-react';
import { useChatStore } from '../../store/chat.store';
import GroupPreview from './GroupPreview';
import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton'
import toast from 'react-hot-toast';
import TertiaryButton from '../TertiaryButton';
import { deleteMessage } from '../../lib/api/chat.api';
import { cancelJoinRequest, sendJoinRequest } from '../../lib/api/group.api';


const Announcement = ({ name, text}) => {
    return (
        <div className='p-1 w-full text-center text-sm text-light-txt2 dark:text-dark-txt2'>
            <p>{`${name} ${text}`}</p>
        </div>
    )
}

const DeletedMessage = ({name, isMine, displaySender, sender, setDisplayMenu}) => {
    return (
        <div className='w-full relative'>
            <div 
                onClick={() => setDisplayMenu(prev => !prev)}
                className='w-full min-w-[100px] py-2 px-4 flex items-center gap-2 rounded-2xl border-1 text-light-txt2 dark:text-dark-txt2 border-light-txt2 dark:border-dark-txt2'
            > 
                <Ban className='size-4' />
                <span>{`${isMine ? "You" : name} deleted this message`}</span>
            </div>
            { displaySender &&
                <div className={`size-8 rounded-full bg-transparent absolute bottom-0 ${isMine ? '-right-9' : '-left-9'}`}>
                    <img src={ sender ? sender : '/assets/avatar.svg'} className='size-8 rounded-full shrink-0' />
                </div>
            }
        </div>
    )
}

const GroupCard = ({message, isMine, displaySender, sender, isSeen, onClick, displayMenu, setDisplayMenu, setDeleteModal, setEdit, setText, setReplyTo, inputRef}) => {
    const { authUser, setAuthUser } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const [menuPosition, setMenuPosition] = useState("bottom");
    const menuRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (displayMenu && containerRef.current) {
          const containerRec = containerRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
    
          const spaceBelow = viewportHeight - containerRec.bottom;
          const spaceAbove = containerRec.top;
    
          const menuHeight = 300; 
    
          if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
            setMenuPosition("top");
          } else {
            setMenuPosition("bottom");
          }
        }
        if (displayMenu && menuRef.current) {
          menuRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [displayMenu]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
            onClick(false);
            }
        };
        if (displayMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [displayMenu]);

    const group = message.groupInvite;

    const count = group.members.length;
    const isMember = group.members.some(m => m.user == authUser.userID);
    const sentRequest = authUser.sentJoinRequests.some(r => r.group == group.groupID);

    const handleJoin = async (event) => {
        event.stopPropagation();
        if(loading) return;
        setLoading(true);
        const res = await sendJoinRequest(group.groupID);
        if(res?.user) {
            setAuthUser(res.user);
        }
        setLoading(false);
    }

    const handleCancel = async (event) => {
        event.stopPropagation
        setLoading(true);
        const res = await cancelJoinRequest(group.groupID);
        if(res?.user) {
            setAuthUser(res.user);
        }
        setLoading(false);
    }

    return (
        <div className='w-full relative' ref={containerRef}>
            <div 
                onClick={() => onClick(prev => !prev)}
                className={`w-full min-w-[200px] p-2 overflow-hidden flex flex-col items-center gap-2 bg-light-200 dark:bg-dark-200 text-light-txt dark:text-dark-txt
                    ${isMine ? 'rounded-tr-4xl rounded-tl-4xl rounded-bl-4xl' : 'rounded-tr-4xl rounded-tl-4xl rounded-br-4xl'}
                `}
            >
                <div className='w-full flex items-center gap-3 '>
                    <img src={group.image ? group.image : '/assets/group-avatar.svg'} className='size-15 rounded-[50%]'/>
                    <div>
                        <p className='font-semibold'>{group.name}</p>
                        <p className='text-xs opacity-80'>
                            {`${count} ${count == 1 ? 'member' : 'members'}`}
                        </p>
                    </div>
                </div>
                <p className='w-full text-[16px] px-4'>
                    {`${isMine ? "You sent" : "Sent you"} an invite to join `} <strong>{group.name}</strong>
                </p>
                {
                    isMember ? 
                    <PrimaryButton 
                        text="Already a member" 
                        className='w-full p-3' 
                        disabled={isMember} 
                    /> :  
                    sentRequest ? (
                        <SecondaryButton 
                            text='Cancel Request' 
                            isColored={false} 
                            className='w-full p-3' 
                            leftIcon={<X className='size-6' />}
                            disabled={isMember}
                            loading={loading}
                            onClick={handleCancel}
                        />
                    ) : (
                        <PrimaryButton 
                            text="Join" 
                            className='w-full p-3' 
                            leftIcon={<CirclePlus className='size-6' />}
                            disabled={isMember}
                            loading={loading}
                            onClick={handleJoin} 
                        />
                    )
                }
                <div className='w-full flex items-center justify-end gap-1 pb-1 pr-2'>
                    <span className='text-xs opacity-80'>{formatTime(message.createdAt)}</span>
                </div>
            </div>
            { displaySender &&
                <div className={`size-8 rounded-full bg-transparent absolute bottom-0 ${isMine ? '-right-9' : '-left-9'}`}>
                    <img src={ sender ? sender : '/assets/avatar.svg'} className='size-8 rounded-full shrink-0' />
                </div>
            }
            {
                displayMenu && 
                <OptionsMenu 
                    ref={menuRef} 
                    position={menuPosition} 
                    message={message}
                    isMine={isMine}
                    isSeen={isSeen}
                    isGroupCard={true}
                    setEdit={setEdit}
                    setText={setText}
                    setReplyTo={setReplyTo}
                    setDisplayMenu={setDisplayMenu}
                    setDeleteModal={setDeleteModal}   
                    inputRef={inputRef}
                />
            }
        </div>
    )
}

const Bubble = ({message, isMine, displaySender, sender, isSeen, onClick, displayMenu, setDisplayMenu, setDeleteModal, setReplyTo, setEdit, setText, inputRef, scrollToMessage}) => {
    const [menuPosition, setMenuPosition] = useState("bottom");
    const menuRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (displayMenu && containerRef.current) {
          const containerRec = containerRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
    
          const spaceBelow = viewportHeight - containerRec.bottom;
          const spaceAbove = containerRec.top;
    
          const menuHeight = 300; 
    
          if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
            setMenuPosition("top");
          } else {
            setMenuPosition("bottom");
          }
        }
        if (displayMenu && menuRef.current) {
          menuRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [displayMenu]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClick(false);
            }
        };
        if (displayMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [displayMenu]);


    const replyTo = message.replyTo;
    return (
        <div className='w-full relative' ref={containerRef}>
            <div 
                onClick={() => onClick(prev => !prev)}
                className={`w-full min-w-[100px] overflow-hidden flex flex-col items-center gap-1
                    ${isMine ? 'bg-gradient-to-tr from-primary to-secondary text-inverted rounded-tr-2xl rounded-tl-2xl rounded-bl-2xl' : 
                    'bg-light-300 text-light-txt dark:bg-dark-300 dark:text-dark-txt rounded-tr-2xl rounded-tl-2xl rounded-br-2xl'}
                `}
            >
                {replyTo && (
                    <div className='w-full pt-2 px-2 min-w-[200px]'>
                        <div 
                            onClick={(e) => {
                                e.stopPropagation();
                                scrollToMessage(replyTo.messageID)
                            }}
                            className={`w-full max-h-12 rounded-xl flex items-center gap-2 shadow-4xl overflow-hidden cursor-pointer group
                                ${isMine ? 'bg-[#fff4]' : 'bg-[#0004] dark:bg-[#fff4]'}
                            `}
                        >
                            <div className={`h-20 w-2 group-hover:w-3 mr-1 transition-all ${isMine ? 'bg-inverted' : 'bg-light-txt dark:bg-dark-txt'}`}>.</div>
                            {replyTo.image && !replyTo.isDeleted && <img src={replyTo.image} alt="" className='size-10 shrink-0 rounded-sm object-cover' />}
                            <div className='flex-1 flex flex-col px-2'>
                                <span className='text-sm font-bold'>{replyTo.sender.name}</span>
                                <span className='text-xs truncate'>
                                    { replyTo.isDeleted ? 'Deleted Message' : replyTo.groupInvite ? 'Group Invite' : (!replyTo.text && replyTo.image) ? 'Photo' : replyTo.text}            
                                </span>
                            </div>
                        </div> 
                    </div>
                )}
                {message.image && <img src={message.image} alt="" className='max-w-full h-auto object-contain' />}
                {message.text && <p className='w-full text-[16px] pt-1 px-4 whitespace-pre-wrap'>{message.text}</p>}
                <div className='w-full flex items-center justify-end gap-1 pb-1 pr-2'>
                    { message.isEdited && <span className='text-xs opacity-80'>Edited •</span>}
                    <span className='text-xs opacity-80'>{formatTime(message.createdAt)}</span>
                </div>
            </div>
            { displaySender &&
                <div className={`size-8 rounded-full bg-transparent absolute bottom-0 ${isMine ? '-right-9' : '-left-9'}`}>
                    <img src={ sender ? sender : '/assets/avatar.svg'} className='size-8 rounded-full shrink-0' />
                </div>
            }
            {
                displayMenu && 
                <OptionsMenu 
                    ref={menuRef} 
                    position={menuPosition} 
                    message={message}
                    isMine={isMine}
                    isSeen={isSeen}
                    setReplyTo={setReplyTo}
                    setEdit={setEdit}
                    setText={setText}
                    setDisplayMenu={setDisplayMenu}
                    setDeleteModal={setDeleteModal}
                    inputRef={inputRef}   
                />
            }
        </div>
    )
}

const MessageFooter = ({seenBy, seenByOther, myLastMessage, displayDetails}) => {
    const { selectedChat } = useChatStore();

    const isGroup = selectedChat.isGroup;
    const seenAt = seenByOther.length > 0 ? seenByOther[0].seenAt : null;

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
                (seenByOther.length == 0) ? (
                    myLastMessage &&
                    <>
                        <span>Delivered</span> 
                        <CheckCheck className='size-4' />
                    </>
                ) : (
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
                            {   seenBy.length > 3 && (
                                    <div className="size-3.5 flex items-center justify-center text-[10px] rounded-full bg-light-300 dark:bg-dark-300 text-light-txt dark:text-dark-txt">
                                        +{seenBy.length - 3}
                                    </div>
                                )
                            }
                        </>
                    ) : (
                        !isGroup ? (
                            <span>{`Seen ${timeSince(seenAt)}`}</span>
                        )  : (
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

const OptionsMenu = forwardRef(({position, message, isMine, isSeen, isGroupCard = false, setEdit, setText, setReplyTo, setDisplayMenu, setDeleteModal, inputRef}, ref) => {

    const handleReplyTo = () => {
        setEdit(null);
        setText('');
        setReplyTo(message);
        inputRef.current.focus();
        setDisplayMenu(false);
    }

    const handleCopy = async() => {
        await navigator.clipboard.writeText(message.text)
        toast.success("Text copied to clipboard!")
        setDisplayMenu(false)
    }

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
            setDisplayMenu(false);
        }
    };

    const handleEdit = () => {
        setReplyTo(null)
        setEdit(message);
        setText(message.text);
        inputRef.current.focus();
        setDisplayMenu(false);
    }

    return (
        <div
            ref={ref}
            className={`border-1 drop-shadow-lg rounded-lg absolute w-[250px] ${isMine ? 'right-1/2' : 'left-1/2'} z-10
                ${position === 'top' ? 'bottom-full mb-2' : 'top-10'}
                bg-light-200 border-light-txt2 text-light-txt dark:bg-dark-200 dark:border-dark-txt2 dark:text-dark-txt`}
        >
            <button  
            className='w-full flex items-center gap-2 p-2 capitalize transition-all cursor-pointer border-b-1 border-light-txt2 hover:bg-primary hover:text-inverted'
            onClick={handleReplyTo}  
            >
                <Reply className='size-6' />
                Reply to
            </button>
            {
                !isGroupCard && message.text && (
                <button  
                    className='w-full flex items-center gap-2 p-2 capitalize transition-all cursor-pointer border-b-1 border-light-txt2 hover:bg-primary hover:text-inverted'  
                    onClick={handleCopy}
                >
                    <ClipboardCopy className='size-6' />
                    Copy to clipboard
                </button>
                )
            }
            {
                !isGroupCard && message.image && (
                <button  
                    className='w-full flex items-center gap-2 p-2 capitalize transition-all cursor-pointer border-b-1 border-light-txt2 hover:bg-primary hover:text-inverted'  
                    onClick={handleSave}
                >
                    <Download className='size-6' />
                    Save image
                </button>
                )
            }
            {
                isMine && !isGroupCard && !isSeen && (
                <button  
                    className='w-full flex items-center gap-2 p-2 capitalize transition-all cursor-pointer border-b-1 border-light-txt2 hover:bg-primary hover:text-inverted'  
                    onClick={handleEdit}
                >
                    <SquarePen className='size-6' />
                    Edit
                </button>
                )
            }
            {
                isMine && (
                <button  
                    className='w-full flex items-center gap-2 p-2 capitalize transition-all cursor-pointer border-b-1 border-light-txt2 hover:bg-primary hover:text-inverted'  
                    onClick={() => setDeleteModal(true)}
                >
                    <Trash2 className='size-6' />
                    Delete
                </button>
                )
            }
        </div>
    )
})

const MessageBubble = ({message, displayDay, displaySender, myLastMessage, setReplyTo, setEdit, setText, inputRef, scrollToMessage, onDeleteMessage}) => {
  const { authUser } = useAuthStore();
  const { getSeenBy, messages, updateMessages } = useChatStore();

  const [ displayMenu, setDisplayMenu] = useState(false); 
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMine = message.sender.userID === authUser.userID;
  const seenByOther = message.seenBy.filter(s => s.user !== authUser.userID);

  let seenBy = getSeenBy(message.messageID); 
  seenBy = seenBy.filter(u => u.userID !== authUser.userID)
  

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
            setDeleteModal(false)
        }
  }

  return (
    <>
        {
            displayDay && (
                <div className='p-1 px-10 w-full flex items-center justify-center gap-4 text-center text-sm text-light-txt2 dark:text-dark-txt2'>
                    <div className='flex-1 h-[1px] opacity-70 bg-light-txt2 dark:bg-dark-txt2'></div>
                    <p>{formatChatDate(message.createdAt)}</p>
                    <div className='flex-1 h-[1px] opacity-70 bg-light-txt2 dark:bg-dark-txt2'></div>
                </div>
            )
        }
        <div className={`w-full px-6 py-1 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            {
                message.isAnnouncement ? (
                    <Announcement 
                        name={message.sender.name}
                        text={message.text}
                    />                   
                ) : (
                    <div className='max-w-[70%]'>
                        <div className={isMine ? 'pr-9' : 'pl-9'}>
                            { message.isDeleted ? (
                                <DeletedMessage
                                    isMine={isMine}
                                    name={message.sender.name}
                                    displaySender={displaySender}
                                    sender={message.sender.profilePic}
                                    setDisplayMenu={setDisplayMenu}
                                />
                            ) : message.groupInvite ? (
                                <GroupCard 
                                    message={message}
                                    isMine={isMine} 
                                    displaySender={displaySender}
                                    sender={message.sender.profilePic}
                                    isSeen={seenByOther.length > 0}
                                    onClick={setDisplayMenu}
                                    displayMenu={displayMenu}
                                    setEdit={setEdit}
                                    setText={setText}
                                    setReplyTo={setReplyTo}
                                    setDisplayMenu={setDisplayMenu}
                                    setDeleteModal={setDeleteModal}
                                    inputRef={inputRef}
                                />
                            ) : ( 
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
                                />
                            )}
                            { isMine && (
                                <MessageFooter
                                    myLastMessage={myLastMessage}
                                    seenBy={seenBy}
                                    seenByOther={seenByOther}
                                    displayDetails={displayMenu}
                                />
                            )}
                        </div>
                    </div>
                )
            }
        </div>
        {
            deleteModal && (
                <div onClick={() => setDeleteModal(false)} 
                    className='bg-[#00000066] dark:bg-[#ffffff33] fixed inset-0 z-50 flex items-center justify-center'
                >
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className='h-[40%] w-[50%] min-w-[350px] rounded-2xl flex flex-col items-center justify-center p-10 gap-4 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'
                    >
                        <h3 className='text-danger text-xl font-semibold flex items-center gap-2'>
                            <span> Delete Message </span>
                        </h3>
                        <span className='text-sm text-light-txt dark:text-dark-txt text-center'>
                            Are you sure you want to delete this message ?
                        </span>
                        <div className='mt-2 flex items-center gap-4 w-[80%] min-w-min-w-[300px]'>
                            <TertiaryButton
                                text="Cancel"
                                className='p-2 flex-1'
                                type='button'
                                disabled={loading}
                                onClick={() => setDeleteModal(false)}
                            />
                            <SecondaryButton
                                text="Delete"
                                className='p-2 flex-1'
                                type='button'
                                isColored={true}
                                disabled={loading}
                                onClick={handleDeleteMessage}
                            />
                        </div>
                    </div>
                </div>
            )
        }
    </>
  )
}

export default MessageBubble