import React, { useEffect, useRef, useState } from 'react'
import ChatHeader from '../layout/ChatHeader'
import ChatInput from '../ChatInput'
import { useChatStore } from '../../store/chat.store';
import MessageBubble from '../previews/MessageBubble';
import { isDifferentDay } from '../../lib/util/timeFormat';
import { useAuthStore } from '../../store/auth.store';
import { ArrowDown } from 'lucide-react';
import ChatContainerSkeleteon from '../skeleton/ChatContainerSkeleteon';
import MessageSkeleton from '../skeleton/MessageSkeleton';

const ChatContainer = ({ chat, loading, onSendMessage, onEditMessage, onDeleteMessage }) => {
  const { authUser } = useAuthStore();
  const { messages, loadingMessages,  loadingMoreMessages, loadMoreMessages } = useChatStore();
  
  const [canLoadMore, setCanLoadMore] = useState(false);

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [edit, setEdit] = useState(null);

  const [scrollDown, setScrollDown] = useState(false);

  const textInputRef = useRef(null);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const loaderRef = useRef(null);
  const messagesRefs = useRef({});
  const firstLoadRef = useRef(true);


  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // distance from bottom
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    setScrollDown(distanceFromBottom > 200); // show button if > 200px away
  };

  const scrollToMessage = (messageID, retries = 10) => {
    const element = messagesRefs.current[messageID];
    if (element) {
      return element.scrollIntoView({ behavior: "smooth"});
    }

    if (retries <= 0) return;

    loaderRef.current.scrollIntoView({ behavior: "smooth"});
    setTimeout(() => {
      scrollToMessage(messageID, retries - 1);
    }, 1000);
  };

  useEffect(() => {
    if (bottomRef.current && firstLoadRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
      firstLoadRef.current = false;
      setCanLoadMore(true)
    }
  }, [messages]);

  useEffect(() => {
    if(!canLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if(entries[0].isIntersecting) {
          loadMoreMessages();
        }
      }, 
      {
        threshold: 1.0
      }
    );

    const target = loaderRef.current; 
    if(target) observer.observe(target);

    return () => observer.disconnect();
  }, [loadingMessages, loadingMoreMessages, canLoadMore]);
  

  if (loading) {
    return <ChatContainerSkeleteon />;
  }

  let otherUser, isOnline = null;
  if(!chat.isGroup) {
    otherUser = chat.participants.filter(p => p.userID !== authUser.userID)[0];
  } 
  
  const myLastMessage = [...messages].reverse().find(m => m.sender.userID === authUser.userID);

  return (
    <div className="h-screen flex flex-col relative overflow-y-hidden bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt">
      <ChatHeader chat={chat} />
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar" onScroll={handleScroll}>
        {
          loadingMessages ? Array.from({ length: 10 }).map((_, i) => <MessageSkeleton key={i} isMine={i % 2 === 0} displayDay={i % 5 === 0} />) :
          <>
            <ul className='min-h-full flex flex-col justify-end align-bottom'>
              <div ref={loaderRef} className='w-full flex flex-col items-center gap-2 p-2'>
                <div className='flex-shrink-0 relative size-fit'>
                    {
                      chat.isGroup ? (
                          <img src={chat.group.image ? chat.group.image : '/assets/group-avatar.svg'} className='size-[150px] rounded-[50%]'/>
                        ) : (
                          <img src={otherUser.profilePic ? otherUser.profilePic : '/assets/avatar.svg'} className='size-[150px] rounded-[50%]'/>
                        )
                    }
                    { isOnline && <div className='bg-accent border-4 border-light-200 dark:border-dark-200 size-7 rounded-[50%] absolute right-1.5 bottom-1.5'></div> }
                </div>
                <div className='text-2xl font-bold text-center'>
                  { chat.isGroup ? chat.group.name : otherUser.name }
                </div>
              </div>
              { loadingMoreMessages && Array.from({ length: 2 }).map((_, i) => <MessageSkeleton key={i} isMine={i % 2 === 0} displayDay={i % 5 === 0} />)}
              {
                messages.length == 0 ? <div className='text-sm text-light-txt2 dark:text-dark-txt2 text-center py-10'>No messages yet. Start the conversation by sending a message!</div> : 
                messages.map((msg, idx) => {
                const prevMsg = messages[idx - 1];
                const nextMsg = messages[idx + 1];

                const displayDay = !prevMsg || isDifferentDay(prevMsg.createdAt, msg.createdAt);
                const displaySender = !nextMsg || nextMsg.sender.userID !== msg.sender.userID;

                const isMyLastMessage = myLastMessage ? msg.messageID == myLastMessage.messageID : false;

                return (
                  <div
                    key={msg.messageID}
                    id={`msg-${msg.messageID}`}
                    ref={el => messagesRefs.current[msg.messageID] = el}
                  >
                    <MessageBubble    
                      message={msg} 
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
              <div ref={bottomRef}></div>
            </ul>
          </>
        }
      </div>
      { scrollDown && <button 
        className={`p-2 rounded-full cursor-pointer transition-all absolute ${(edit || replyTo) ? 'bottom-36' : 'bottom-24'} right-1/2 z-10 border-1 bg-light-300 dark:bg-dark-300 border-light-txt2 dark:border-dark-txt2 text-light-txt2 dark:text-dark-txt2 hover:border-primary hover:bg-primary hover:text-inverted`}
        onClick={() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }}  
      >
        <ArrowDown className='size-6' />
      </button>}
      <ChatInput 
        chat={chat} 
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
    </div>
  );
};


export default ChatContainer