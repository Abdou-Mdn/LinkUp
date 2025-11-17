import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

import { useAuthStore } from '../../store/auth.store';
import { useChatStore } from '../../store/chat.store';

import { isDifferentDay } from '../../lib/util/timeFormat';
import { markMessagesAsSeen } from '../../lib/api/chat.api';

import ChatHeader from '../layout/ChatHeader'
import ChatInput from '../ChatInput'
import MessageBubble from '../previews/MessageBubble';
import ChatContainerSkeleteon from '../skeleton/ChatContainerSkeleteon';
import MessageSkeleton from '../skeleton/MessageSkeleton';
import TypingIndicator from '../previews/TypingIndicator';



/* 
 * ChatContainer component
 * Main container for chat conversations.

 * - Displays ChatHeader (top bar with chat/group info).
 * - Shows messages with infinite scroll support.
 * - Handles reply/edit/delete message actions.
 * - Renders ChatInput for composing messages.
 
 * params:
 * - onSendMessage: callback function to update chats list after sending a message
 * - onEditMessage: callback function to update chats list after editing a message
 * - onDeleteMessage: callback function to update chats list after deleting a message
 * - onSeenMessages: callback function to update chats list after seeing new messages
*/
const ChatContainer = ({ onSendMessage, onEditMessage, onDeleteMessage, onSeenMessages }) => {
  const { authUser, onlineUsers, socket } = useAuthStore();
  const { selectedChat, updateSelectedChat, loadingChat, messages, loadingMessages,  loadingMoreMessages, loadMoreMessages, updateMessages, typingUsers } = useChatStore();

  // check if at least one participant of the chat is online (authenticated user is excluded)
  const onlineMembers = selectedChat?.participants?.filter(p => p.userID !== authUser.userID && onlineUsers.includes(p.userID)) || [];
  const isOnline = onlineMembers.length > 0;

  // check if chat is private then get other user infos from chat participants
  let otherUser = null;
  if(!selectedChat.isGroup && !loadingChat) {
    otherUser = selectedChat.participants.filter(p => p.userID !== authUser.userID)[0];
  } 

  // check if chat is private and disabled
  const disabledChat = !selectedChat.isGroup && otherUser?.isDeleted;

  // find my last message
  const myLastMessage = [...messages].reverse().find(m => m.sender.userID === authUser.userID);
  
  // keep track of the last message in the discussion
  const lastMessage = messages[messages.length - 1];

  // check if there are new unseen messages
  const newMessages = ((lastMessage !== myLastMessage) && (!lastMessage?.seenBy?.some(u => u.user === authUser.userID ))) || false;

  // management states
  const [text, setText] = useState(""); // chat input text state
  const [image, setImage] = useState(null); // image attachement
  const [replyTo, setReplyTo] = useState(null); // reply target message
  const [edit, setEdit] = useState(null); // message being edited
  const [scrollDown, setScrollDown] = useState(false); // "back to bottom" button visibility
  const [highlightedID, setHighlightedID] = useState(null); // state to manage the highlighted message

  // necessary references
  const textInputRef = useRef(null); // ref to chat input
  const scrollRef = useRef(null); // ref to scroll container
  const bottomRef = useRef(null); // ref to sentinel div at the bottom 
  const loaderRef = useRef(null); // ref to loader (for infinit scroll) 
  const messagesRefs = useRef({}); // refs to each message DOM node
  const lastScrollTop = useRef(0); // stores last scroll position (for loadMore detection)

  // scroll to bottom when initial messages load
  const scrollToBottom = () => {
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }
  
  // scroll to bottom on initial load
  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      scrollToBottom();
    }
  }, [loadingMessages]);

  // mark new messages as seen after scrolling to bottom
  useEffect(() => {
    const seeMessages = async () => {
      try {
        if(selectedChat && messages.length > 0 && !scrollDown && newMessages) {
          const res = await markMessagesAsSeen(selectedChat.chatID); // mark messages as seen

          if(res?.chat) {
            onSeenMessages(res.chat);

            const newMessages = useChatStore.getState().messages.map(msg => {
              if(msg.seenBy.some(u => u.user === authUser.userID)) return msg;

              return {...msg, seenBy: [...msg.seenBy, {user: authUser.userID, seenAt: res.seenAt}]}
            });

            updateMessages(newMessages)
          }
        } 
      } catch (error) {
        console.log("error in marking messages as seen", error);
      }
    }

    seeMessages();
  }, [scrollDown, lastMessage]);

  // handle scroll event to toggle "back to bottom" button visibility
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // distance from bottom
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    // button appears when user is scrolled > 200px away from the bottom 
    setScrollDown(distanceFromBottom > 200); 
  };

  // scroll smoothly to a specefic message
  const scrollToMessage = (messageID, retries = 10) => {
    // get message reference
    const element = messagesRefs.current[messageID];
    // if message is loaded then scroll to message and exit early
    if (element) {
      element.scrollIntoView({ behavior: "smooth"});
      setHighlightedID(messageID);
      setTimeout(() => {
        setHighlightedID(null);
      }, 2000);
      return;
    }

    // if not loaded yet, we load messages until we reach the message 
    // uses a recursion to call scrollToMessage until message is loaded or retries 10 times (loading fails)
    
    // recursion stopping condition : loading failed
    if (retries <= 0) return toast.error("Failed to load message, please try again");

    // trigger loadMore by scrolling to the loader
    loaderRef.current.scrollIntoView({ behavior: "smooth"});
    // recursive call after waiting 0.5s 
    setTimeout(() => {
      scrollToMessage(messageID, retries - 1);
    }, 1000);
  };


  // set up IntersectionObserver for infinit scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const currentScrollTop = scrollRef.current?.scrollTop ?? 0;
        
        // Only load more if scrolling upwards (not at bottom)
        if (
          entry.isIntersecting &&
          currentScrollTop < lastScrollTop.current
        ) {
          loadMoreMessages();
        }
        lastScrollTop.current = currentScrollTop;
      }, 
      {
        root: scrollRef.current,
        threshold: 1.0
      }
    );

    const target = loaderRef.current; 
    if(target) observer.observe(target);

    return () => observer.disconnect();
  }, [loadingMessages, loadingMoreMessages]);

  // adjust scroll position to avoid jump when new messages are prepended
  useEffect(() => {
    if (!loadingMoreMessages || !scrollRef.current) return;

    const el = scrollRef.current;
    const prevHeight = el.scrollHeight;

    // wait for new messages to render
    requestAnimationFrame(() => {
      const newHeight = el.scrollHeight;
      el.scrollTop = newHeight - prevHeight + el.scrollTop;
    });
  }, [messages, loadingMoreMessages]);

  // scroll down automatically when user sends a new message
  useEffect(() => {
    if(messages.length > 0) {
      if((lastMessage && !scrollDown) || (lastMessage === myLastMessage)) {
        scrollToBottom();
      }
    }
  }, [lastMessage]);

  // scroll down when a user is typing
  useEffect(() => {
    if(typingUsers.length > 0 && !scrollDown) {
      scrollToBottom();
    }
  }, [typingUsers]);

  // real time updates
  useEffect(() => {
    if(!socket) return;

    // update lastSeen online after user goes offline
    const handleUserOffline = ({ userID, lastSeen }) => {
      if(!selectedChat || selectedChat?.isGroup) return;
      const updatedParticipants = selectedChat.participants.map(p => p.userID === Number(userID) ? {...p, lastSeen} : p);
      const newChat = {...selectedChat, participants: updatedParticipants};
      updateSelectedChat(newChat);
    };
    socket.on("userOffline", handleUserOffline);

    // cleanup listeners on unmount
    return () => {
      socket.off("userOffline", handleUserOffline);
    }
  }, [socket, selectedChat]);

  // render skeleton while still loading chat
  if (loadingChat) {
    return <ChatContainerSkeleteon />;
  }

  // render chat container
  return (
    <div className="h-screen flex flex-col relative overflow-y-hidden bg-light-100 dark:bg-dark-100 text-light-txt dark:text-dark-txt">
      <ChatHeader chat={selectedChat} otherUser={otherUser} />
      
      {/* messages*/}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar" onScroll={handleScroll}>
        {
          /* display skeletons while loaidng messages */
          loadingMessages ? Array.from({ length: 10 }).map((_, i) => <MessageSkeleton key={i} isMine={i % 2 === 0} displayDay={i % 5 === 0} />) :
          <ul className='min-h-full flex flex-col justify-end align-bottom'>
            {/* loader section (top of chat history) */}
            <div ref={loaderRef} className='w-full flex flex-col items-center gap-2 p-2'>
              {/* avatar image of user/group */}
              <div className='flex-shrink-0 relative size-fit'>
                  {
                    selectedChat.isGroup ? (
                        <img src={selectedChat.group.image ? selectedChat.group.image : '/assets/group-avatar.svg'} className=' size-[80px] lg:size-[144px] rounded-full'/>
                      ) : (
                        <img src={otherUser.profilePic ? otherUser.profilePic : '/assets/avatar.svg'} className=' size-[80px] lg:size-[144px] rounded-full'/>
                      )
                  }
                  {/* online status */}
                  { isOnline && <div className='bg-accent border-4 border-light-200 dark:border-dark-200 size-5 lg:size-7 rounded-full absolute right-0.5 bottom-0.5'></div> }
              </div>
              {/* user/group name */}
              <div className='text-xl lg:text-2xl font-bold text-center'>
                { selectedChat.isGroup ? selectedChat.group.name : otherUser.name }
              </div>
            </div>
            {/* display skeletons while loading more messages */}
            { loadingMoreMessages && Array.from({ length: 2 }).map((_, i) => <MessageSkeleton key={i} isMine={i % 2 === 0} displayDay={i % 5 === 0} />)}
            {/* display placeholder if there are no messages */}
            {
              messages.length == 0 ? <div className='text-sm text-light-txt2 dark:text-dark-txt2 flex flex-col items-center py-10'>
                <span>No messages yet.</span> 
                <span>Start the conversation by sending a message!</span>
              </div> :
              /* messages list */ 
              messages.map((msg, idx) => {
                const prevMsg = messages[idx - 1];
                const nextMsg = messages[idx + 1];

                // display date if messages are from different days (grouping messages by day)
                const displayDay = !prevMsg || isDifferentDay(prevMsg.createdAt, msg.createdAt);
                // display sender image only at the last message in a succession
                const displaySender = !nextMsg || nextMsg.sender.userID !== msg.sender.userID;

                // check if current message is my last message (to display status "delivered" or "seen")
                const isMyLastMessage = myLastMessage ? msg.messageID == myLastMessage.messageID : false;
                
                // check if message is highlighted
                const isHighlighted = highlightedID === msg.messageID;
                
                return (
                  <div
                    key={msg.messageID ? msg.messageID : msg.tempID}
                    id={`msg-${msg.messageID}`}
                    ref={el => messagesRefs.current[msg.messageID] = el}
                  >
                    <MessageBubble    
                      message={msg} 
                      otherUser={otherUser}
                      displayDay={displayDay} 
                      displaySender={displaySender} 
                      myLastMessage={isMyLastMessage}
                      isHighlighted={isHighlighted}
                      setReplyTo={setReplyTo}
                      setEdit={setEdit}
                      setText={setText}
                      inputRef={textInputRef}
                      scrollToMessage={scrollToMessage}
                      onDeleteMessage={onDeleteMessage}
                      disabledChat={disabledChat}
                    />
                  </div>
                )
              })
            }
            {/* display typing indicators */}
            {
              typingUsers.map(user => (user.userID === authUser.userID) ? null : <TypingIndicator key={user.userID} profilePic={user.profilePic}/>) 
            }
            {/* sentinal div for scrolling to the bottom */}
            <div ref={bottomRef}></div>
          </ul>
        }
      </div>
      {/* back to bottom button */}
      <AnimatePresence>
      { scrollDown && 
        <motion.button 
          title='Back to bottom'
          className={`p-2 rounded-full cursor-pointer transition-colors absolute ${(edit || replyTo) ? 'bottom-36' : 'bottom-24'} right-1/2 z-10 border-1 bg-light-300 dark:bg-dark-300 border-light-txt2 dark:border-dark-txt2 text-light-txt2 dark:text-dark-txt2 hover:border-primary hover:bg-primary hover:text-inverted`}
          onClick={scrollToBottom}  
          initial={{ opacity: 0, y: 50, }}
          animate={{ opacity: 1, y: 0, }}
          exit={{ opacity: 0, y: 50, }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {
            newMessages ? <span className='text-sm'>New Messages</span> : <ChevronDown className='size-6' />
          }
        </motion.button>
      }
      </AnimatePresence>
      {/* chat input or deleted account notice */}
      {
        // if chat is private and user is deleted then display notice
        disabledChat ? (
          <div className='p-3 w-full flex flex-col justify-center items-center border-t-1 border-light-txt2 dark:border-dark-txt2'> 
            <span className='text-sm text-light-txt dark:text-dark-txt'>This account has been deleted</span>
            <span className='text-sm text-center text-light-txt2 dark:text-dark-txt2'>You can no longer send or receive messages in this conversation.</span>
          </div>
        ) : (
          // else display input
          <ChatInput 
            chat={selectedChat} 
            text={text}
            setText={setText}
            imgPreview={image}
            setImgPreview={setImage}  
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            edit={edit}
            setEdit={setEdit}
            ref={textInputRef}
            onSendMessage={onSendMessage}
            onEditMessage={onEditMessage}
          />
        )
      }
    </div>
  );
};


export default ChatContainer