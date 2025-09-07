import React, { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/auth.store'

import PrimaryButton from '../components/PrimaryButton'
import { useLayoutStore } from '../store/layout.store';
import ResponsiveLayout from '../components/layout/ResponsiveLayout';
import { getChats, markMessagesAsSeen } from '../lib/api/chat.api';
import ProfilePreviewSkeleton from '../components/skeleton/ProfilePreviewSkeleton';
import { Ghost } from 'lucide-react';
import ChatPreview from '../components/previews/ChatPreview';
import ChatPreviewSkeleton from '../components/skeleton/ChatPreviewSkeleton';
import { useChatStore } from '../store/chat.store';
import ChatContainer from '../components/main/ChatContainer';

const Aside = ({
  chats, loading, loadingMore, loadMore, selectChat
}) => {
  const chatLoaderRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if(entries[0].isIntersecting) {
          loadMore();
        }
      }, 
      {
        threshold: 1.0
      }
    );

    const target = chatLoaderRef.current; 
    if(target) observer.observe(target);

    return () => observer.disconnect();
  }, [loading, loadingMore]);

  return (
  <div className='w-full h-screen flex flex-col items-center bg-light-200 text-light-txt dark:bg-dark-200 dark:text-dark-txt'>
      <div className='w-full p-2 flex justify-start items-center gap-3 overflow-x-auto scrollbar'>
        {
           Array.from({ length: 8 }).map((_, i) => (
              <div key={i} title='name' className='flex-shrink-0 relative size-fit cursor-pointer'>
                <img src="/assets/avatar.svg" alt="" className='size-13 rounded-[50%]' />
                <div className='bg-accent border-3 border-light-200 dark:border-dark-200 size-4.25 rounded-[50%] absolute -right-0.75 -bottom-0.75'></div>
              </div>
           ))
        }
      </div>
      <div className='flex-1 w-full px-2 overflow-y-auto scrollbar'>
        {
          loading ? (
            Array.from({ length: 8 }).map((_, i) => <ChatPreviewSkeleton key={i} />)
          ) : 
          chats.length == 0 ? (
                <div className='flex-1 py-10 flex flex-col items-center gap-2 text-center'> 
                  <Ghost className='size-6' />
                  You don't have any chats yet. Start a chat to see it here
                </div> 
              ) : (
            <ul className='mt-2'>
              {
                chats.map(chat => <ChatPreview key={chat.chatID} chat={chat} onClick={selectChat} />)
              }
              {
                loadingMore && Array.from({ length: 2 }).map((_, i) => <ChatPreviewSkeleton key={i} />)
              }
              <div ref={chatLoaderRef}></div>
            </ul>
          )
        }
      </div>
  </div>
)}

const Main = ({ chat, loadingChat, onSendMessage, onEditMessage, onDeleteMessage }) => (
  <div className='min-h-screen size-full'> 
    {
      chat ? <ChatContainer chat={chat} loading={loadingChat} onSendMessage={onSendMessage} onEditMessage={onEditMessage} onDeleteMessage={onDeleteMessage} /> : (
        <div className='w-full h-screen flex flex-col items-center justify-center gap-2'>
          <img src="/assets/Texting-bro.svg" className='w-[65%]' />
          <span className='text-xl font-outfit text-light-txt dark:text-dark-txt'> 
            Select a chat to start messaging!
          </span>
        </div>
      )
    }
  </div>
)


function HomePage() {
  const { selectedChat, loadingChat, selectChat, updateSelectedChat } = useChatStore();

  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMoreChats, setLoadingMoreChats] = useState(false);
  const [chats, setChats] = useState([]);
  const [chatPage, setChatPage] = useState(1);
  const [hasMoreChats, setHasMoreChats] = useState(false);

  const limit = 10;

  const fetchChats = async (reset = false) => {
    if(!reset && !hasMoreChats){
      setLoadingChats(false);
      setLoadingMoreChats(false);
      return;
    }

    const res = await getChats(reset, chatPage, limit);

    if(res?.chats) {
      const newChats = res.chats;
      const totalPages = res.totalPages;

      setChats(prev => reset ? newChats : [...prev, ...newChats]);
      setHasMoreChats((reset ? 1 : chatPage) < totalPages);
      setChatPage(reset ? 2 : chatPage + 1);
    }

    setLoadingChats(false);
    setLoadingMoreChats(false);
  }

  useEffect(() => {
    const loadChats = async () => {
      setLoadingChats(true);
      await fetchChats(true);
    }

    loadChats();
  }, []);

  const loadMoreChats = async () => {
    if(loadingChats || loadingMoreChats) return;
    setLoadingMoreChats(true);
    fetchChats();
  }

  const onSelect = async (chat) => {
    try {
      selectChat({chat});
      const res = await markMessagesAsSeen(chat.chatID);
      
      if (res?.chat) {
        setChats((prev) =>
          prev.map((c) => (c.chatID === chat.chatID ? res.chat : c))
        );
      } 
    } catch (error) {
      console.log("Failed to mark messages as seen", error);
    }
  }

  const onSendMessage = (chat) => {
    let newChats = chats.filter(c => c.chatID != chat.chatID);
    newChats = [chat, ...newChats];
    setChats(newChats);
    updateSelectedChat(chat);
  }

  const onEditMessage = (chatID, messageID, text) => {
    const newChats = chats.map(c => {
      if (c.chatID !== chatID) return c;
      const lastMessage = c.lastMessage;
      if(lastMessage.messageID !== messageID) return c;

      return {
        ...c,
        lastMessage: {
          ...lastMessage,
          text,
          isEdited: true
        }
      }
    }) 
    setChats(newChats);
  }

  const onDeleteMessage = (chatID, messageID) => {
    const newChats = chats.map(c => {
      if (c.chatID !== chatID) return c;
      const lastMessage = c.lastMessage;
      if(lastMessage.messageID !== messageID) return c;

      return {
        ...c,
        lastMessage: {
          ...lastMessage,
          text: "",
          image: "",
          isDeleted: true
        }
      }
    }) 
    setChats(newChats);
  }

  return (
    <ResponsiveLayout 
      aside={
        <Aside
          chats={chats}
          loading={loadingChats}
          loadingMore={loadingMoreChats}
          loadMore={loadMoreChats}
          selectChat={onSelect}
        />
      } 
      main={
        <Main 
          chat={selectedChat}
          loadingChat={loadingChat}
          onSendMessage={onSendMessage}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
        />
      } 
    />
  )
}

export default HomePage