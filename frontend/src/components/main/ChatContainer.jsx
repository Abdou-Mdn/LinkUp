import React, { useEffect, useRef, useState } from 'react'
import { ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '../../store/auth.store';
import { useChatStore } from '../../store/chat.store';

import { isDifferentDay } from '../../lib/util/timeFormat';

import ChatHeader from '../layout/ChatHeader'
import ChatInput from '../ChatInput'
import MessageBubble from '../previews/MessageBubble';
import ChatContainerSkeleteon from '../skeleton/ChatContainerSkeleteon';
import MessageSkeleton from '../skeleton/MessageSkeleton';



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
*/
const ChatContainer = ({ onSendMessage, onEditMessage, onDeleteMessage }) => {
  const { authUser } = useAuthStore();
  const { selectedChat, loadingChat, messages, loadingMessages,  loadingMoreMessages, loadMoreMessages } = useChatStore();


  // check if chat is private then get other user infos from chat participants
  let otherUser = null, isOnline = null;
  if(!selectedChat.isGroup) {
    otherUser = selectedChat.participants.filter(p => p.userID !== authUser.userID)[0];
  } 
  
  // find my last message
  const myLastMessage = [...messages].reverse().find(m => m.sender.userID === authUser.userID);

  // management states
  const [text, setText] = useState(""); // chat input text state
  const [image, setImage] = useState(null); // image attachement
  const [replyTo, setReplyTo] = useState(null); // reply target message
  const [edit, setEdit] = useState(null); // message being edited
  const [scrollDown, setScrollDown] = useState(false); // "back to bottom" button visibility

  // necessary references
  const textInputRef = useRef(null); // ref to chat input
  const scrollRef = useRef(null); // ref to scroll container
  const bottomRef = useRef(null); // ref to sentinel div at the bottom 
  const loaderRef = useRef(null); // ref to loader (for infinit scroll) 
  const messagesRefs = useRef({}); // refs to each message DOM node
  const lastScrollTop = useRef(0); // stores last scroll positiob (for loadMore detection)


  // scroll to bottom when initial messages load
  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [loadingMessages]);

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
      return element.scrollIntoView({ behavior: "smooth"});
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
    }, 500);
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

  // scroll down automatically when user send a new message
  useEffect(() => {
    if(myLastMessage) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [myLastMessage]);

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

              return (
                <div
                  key={msg.messageID}
                  id={`msg-${msg.messageID}`}
                  ref={el => messagesRefs.current[msg.messageID] = el}
                >
                  <MessageBubble    
                    message={msg} 
                    otherUser={otherUser}
                    displayDay={displayDay} 
                    displaySender={displaySender} 
                    myLastMessage={isMyLastMessage}
                    setReplyTo={setReplyTo}
                    setEdit={setEdit}
                    setText={setText}
                    inputRef={textInputRef}
                    scrollToMessage={scrollToMessage}
                    onDeleteMessage={onDeleteMessage}
                  />
                </div>
              )
            })
            }
            {/* sentinal div for scrolling to the bottom */}
            <div ref={bottomRef}></div>
          </ul>
        }
      </div>
      {/* back to bottom button */}
      { scrollDown && <button title='Back to bottom'
        className={`p-2 rounded-full cursor-pointer transition-all absolute ${(edit || replyTo) ? 'bottom-36' : 'bottom-24'} right-1/2 z-10 border-1 bg-light-300 dark:bg-dark-300 border-light-txt2 dark:border-dark-txt2 text-light-txt2 dark:text-dark-txt2 hover:border-primary hover:bg-primary hover:text-inverted`}
        onClick={() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }}  
      >
        <ArrowDown className='size-6' />
      </button>}
      {/* chat input or deleted account notice */}
      {
        // if chat is private and user is deleted then display notice
        !selectedChat.isGroup && otherUser.isDeleted ? (
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