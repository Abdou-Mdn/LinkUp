import React, { useEffect, useRef, useState } from 'react'
import { Ghost } from 'lucide-react';

import { useChatStore } from '../store/chat.store';
import { useAuthStore } from '../store/auth.store';

import { getChats } from '../lib/api/chat.api';
import { getFriendsIDs } from '../lib/api/user.api';

import ResponsiveLayout from '../components/layout/ResponsiveLayout';
import ChatPreview from '../components/previews/ChatPreview';
import ChatPreviewSkeleton from '../components/skeleton/ChatPreviewSkeleton';
import ChatContainer from '../components/main/ChatContainer';

/* 
 * Aside component
 * displays a sidebar with a list of online friends, and list of chats 

 * - Online friends: a horizontal list that contains the profile pics of all online friends (for quick access in opening chats) 
 * - Chats list: a list of all the chats, ordered chronologically from newest to oldest with infinite scroll 
 
 * params:
 * - chats: list of chats to display 
 * - loading: initial loading state
 * - loadingMore: loading more state
 * - loadMore: function to load more data (groups/requests) based on active tab
 * - selectChat: open a chat to display on main
 * - onlineFriends: list of onlineFriends
*/
const Aside = ({chats, loading, loadingMore, loadMore, selectChat, onlineFriends}) => {

  // loader ref
  const chatLoaderRef = useRef(null);

  // set up IntersedctionObserver to load more chats
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
      {/* online friends list */}
      {
        loading ? (
          /* display skeletons while loading  */
          <div className='w-full p-2 flex justify-start items-center gap-3 overflow-x-auto scrollbar border-b border-light-txt2 dark:border-dark-txt2'>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className='size-13 rounded-full shrink-0 animate-pulse bg-light-300 dark:bg-dark-300'/>)}
          </div>
        ) : 
          onlineFriends.length > 0 && (
          <div className='w-full p-2 flex justify-start items-center gap-3 overflow-x-auto scrollbar border-b border-light-txt2 dark:border-dark-txt2'>
            {
              onlineFriends.map(f => (
                <button 
                  key={f.userID} 
                  title={f.name} 
                  className='flex-shrink-0 relative size-fit cursor-pointer'
                  onClick={() => selectChat({userID: f.userID})}
                >
                  {/* image */}
                  <img src={f.profilePic ? f.profilePic : "/assets/avatar.svg"} alt="" className='size-13 rounded-full' />
                  {/* online status */}
                  <div className='bg-accent border-3 border-light-200 dark:border-dark-200 size-4.25 rounded-full absolute -right-0.75 -bottom-0.75'></div>
                </button>
              ))
            }
          </div>
        )
        
      }
    
      {/* chats list */}
      <div className='flex-1 w-full px-2 overflow-y-auto scrollbar'>
        {
          // display skeletons while loading chats
          loading ? (
            Array.from({ length: 8 }).map((_, i) => <ChatPreviewSkeleton key={i} />)
          ) : 
            chats.length == 0 ? (
              // empty chats list 
              <div className='flex-1 py-10 flex flex-col items-center gap-2 text-center'> 
                <Ghost className='size-6' />
                You don't have any chats yet. Start a chat to see it here
              </div> 
            ) : (
            <ul className='mt-2'>
              {
                // display chats
                chats.map(chat => <ChatPreview key={chat.chatID} chat={chat} onSelect={selectChat} />)
              }
              {
                // display skeletons while loading more chats 
                loadingMore && Array.from({ length: 2 }).map((_, i) => <ChatPreviewSkeleton key={i} />)
              }
              {/* sentinal div for loading more member groups */}
              <div ref={chatLoaderRef}></div>
            </ul>
          )
        }
      </div>
  </div>
)}

/* 
 * Main component
 * Main panel that displays the chat container .
 * If nothing is selected, shows a placeholder illustration + message. 

 * params:
 * - chat: chat display, passed down as props (ChatContainer)
 * - loadingChat: loading chat state, passed down to ChatContainer
 * - onSendMessage, onEditMessage, onDeleteMessage, onSeenMessages: update chat list in aside passed down as props
*/
const Main = ({ chat, loadingChat, onSendMessage, onEditMessage, onDeleteMessage, onSeenMessages }) => (
  <div className='min-h-screen size-full'> 
    {
      // display chat container if chat is selected
      chat ? 
        <ChatContainer 
          chat={chat} 
          loading={loadingChat} 
          onSendMessage={onSendMessage} 
          onEditMessage={onEditMessage} 
          onDeleteMessage={onDeleteMessage} 
          onSeenMessages={onSeenMessages} 
        /> : (
        // display placeholder if not
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

/* 
 * Home Page
 * used to check and use chats, see and send messages in private and group messages
 * consists of an aside and a main for displaying the chats 

 * Integrates with API functions:
 * - `getChats`, `markMessagesAsSeen`
*/
function HomePage() {
  const { selectedChat, loadingChat, selectChat, loadMessages, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const { onlineUsers } = useAuthStore();

  /* -------- aside states -------- */
  const [friends, setFriends] = useState([]); // state to store the list of user's friends 
  const [loadingChats, setLoadingChats] = useState(false); // initial loading state
  const [loadingMoreChats, setLoadingMoreChats] = useState(false); // loading more state
  
  // chats list states (pagination)
  const [chats, setChats] = useState([]);
  const [chatPage, setChatPage] = useState(1);
  const [hasMoreChats, setHasMoreChats] = useState(false);

  const limit = 10; // items per page

  // keep track of online friends
  const onlineFriends = friends.filter(f => onlineUsers.includes(f.userID));

  
  /* -------- aside data fetching -------- */

  // get list of friends from backend
  const fetchFriends = async () => {
    try {
      const res = await getFriendsIDs();

      if(res?.friends) {
        setFriends(res.friends);
      }
    } catch (error) {
      console.log("error in fetching friends ids", error);
    }
  }

  // get chats from backend
  const fetchChats = async (reset = false) => {
    // exit early if there are no more chats 
    if(!reset && !hasMoreChats){
      setLoadingChats(false);
      setLoadingMoreChats(false);
      return;
    }

    try {
      const res = await getChats(reset, chatPage, limit);

      if(res?.chats) {
        const newChats = res.chats;
        const totalPages = res.totalPages;

        setChats(prev => reset ? newChats : [...prev, ...newChats]);
        setHasMoreChats((reset ? 1 : chatPage) < totalPages);
        setChatPage(reset ? 2 : chatPage + 1);
      } 
    } catch (error) {
      console.log("error in fetching chats", error);
    } finally {
      if(reset) {
        setLoadingChats(false);
      } else {
        setLoadingMoreChats(false);
      }
    }
  }

  // initial data loading 
  useEffect(() => {
    const loadChats = async () => {
      setLoadingChats(true);
      await Promise.all([
        fetchFriends(),
        fetchChats(true),
        loadMessages()
      ]);
    }

    loadChats();
  }, []);

  // load more chats
  const loadMoreChats = async () => {
    if(loadingChats || loadingMoreChats) return;
    setLoadingMoreChats(true);
    fetchChats();
  }

  // update chats list and selected chat after sending a message (or receiving a message)
  const onSendMessage = (chat, lastMessage, updatedAt) => {
    setChats(prev => {
      const updatedChat = { ...chat, lastMessage, updatedAt };
      const newChats = [
        updatedChat,
        ...prev.filter(c => c.chatID !== chat.chatID)
      ];
      return newChats;
    })
  }

  // update chats list and selected chat after editing a message
  const onEditMessage = (chatID, messageID, text) => {
    console.log(chatID, messageID, text);
    console.log("chats",chats);
    setChats(prev => prev.map(c => {
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
    }));
  }

  // update chats list and selected chat after deleting a message
  const onDeleteMessage = (chatID, messageID) => {
    setChats(prev => prev.map(c => {
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
    }));
  }

  // update chats list after messages are seen
  const onSeenMessages = (chat) => {
    setChats((prev) =>
      prev.map((c) => (c.chatID === chat.chatID ? chat : c)) 
    )
  }

  // subscribe and unsubscribe to messages 
  useEffect(() => {
    subscribeToMessages(onSendMessage, onSeenMessages, onEditMessage, onDeleteMessage);
    return () => unsubscribeFromMessages();
  }, [selectedChat?.chatID]);

  // layout rendering
  return (
    <ResponsiveLayout 
      aside={
        <Aside
          chats={chats}
          loading={loadingChats}
          loadingMore={loadingMoreChats}
          loadMore={loadMoreChats}
          selectChat={selectChat}
          onlineFriends={onlineFriends}
        />
      } 
      main={
        <Main 
          chat={selectedChat}
          loadingChat={loadingChat}
          onSendMessage={onSendMessage}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
          onSeenMessages={onSeenMessages}
        />
      } 
    />
  )
}

export default HomePage