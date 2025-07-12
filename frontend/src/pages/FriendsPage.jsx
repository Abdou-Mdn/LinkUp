import React, { useEffect, useRef, useState } from 'react'
import ResponsiveLayout from '../components/layout/ResponsiveLayout'
import { getFriendRequests, getFriends, getMutualFriends, getSentFriendRequests, getUserDetails } from '../lib/api/user.api'
import { Ghost } from 'lucide-react'
import ProfilePreviewSkeleton from '../components/skeleton/ProfilePreviewSkeleton'
import ProfilePreview from '../components/previews/ProfilePreview'
import RequestPreview from '../components/previews/RequestPreview'
import RequestPreviewSkeleton from '../components/skeleton/RequestPreviewSkeleton'
import { useLayoutStore } from '../store/layout.store'
import MobileHeader from '../components/layout/MobileHeader'
import Profile from '../components/main/Profile'

const Aside = ({
  activeTab, setActiveTab,
  friends, friendRequests, sentRequests,
  loading, loadingMore, loadMore, selectUser, onUpdate
}) => {

  const friendsLoaderRef = useRef(null);
  const requestsLoaderRef = useRef(null);
  const sentLoaderRef = useRef(null);

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

    const target = activeTab == "friends" ? friendsLoaderRef.current : activeTab == "requests" ? requestsLoaderRef.current : sentLoaderRef.current;
    if(target) observer.observe(target);

    return () => observer.disconnect();
  }, [activeTab, loading, loadingMore]);

  return (
    <div className='w-full h-screen flex flex-col items-center
    bg-light-200 text-light-txt dark:bg-dark-200 dark:text-dark-txt'>

      {/* tabs */}
      <div className='flex items-center justify-between w-full gap-1'>
        <div title='Friends' className={`flex-1 py-3 text-sm font-outfit font-medium text-center cursor-pointer border-b-2
          ${activeTab == "friends" ? 'text-primary border-primary border-b-4' : 
            'text-light-txt dark:text-dark-txt border-light-txt dark:border-dark-txt hover:text-light-txt2 dark:hover:text-dark-txt2 hover:border-light-txt2 dark:hover:border-dark-txt2'
          }`}
          onClick={() => setActiveTab("friends")}
        >
          Friends
        </div>
        <div title='Friend Requests' className={`flex-1 py-3 text-sm font-outfit font-medium text-center cursor-pointer border-b-2 truncate
          ${activeTab == "requests" ? 'text-primary border-primary border-b-4' : 
            'text-light-txt dark:text-dark-txt border-light-txt dark:border-dark-txt hover:text-light-txt2 dark:hover:text-dark-txt2 hover:border-light-txt2 dark:hover:border-dark-txt2'
          }`}
          onClick={() => setActiveTab("requests")}
        >
          Friend Requests
        </div>
        <div title='Sent Requests' className={`flex-1 py-3 text-sm font-outfit font-medium text-center cursor-pointer border-b-2 truncate
          ${activeTab == "sent" ? 'text-primary border-primary border-b-4' : 
            'text-light-txt dark:text-dark-txt border-light-txt dark:border-dark-txt hover:text-light-txt2 dark:hover:text-dark-txt2 hover:border-light-txt2 dark:hover:border-dark-txt2'
          }`}
          onClick={() => setActiveTab("sent")}
        >
          Sent Requests
        </div>
      </div>
      
      {/* content */}
      {/* friends tab */} 
      {
        activeTab == "friends" && (
          <div className='w-full flex-1 px-2 overflow-y-scroll'> 
            {
              loading ? (
                Array.from({ length: 8 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
              ) :
              friends.length == 0 ? (
                <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                  <Ghost className='size-6' />
                  You have no friends 
                </div> 
              ) : 
              <ul className='px-1'>
                {
                  friends.map(friend => <ProfilePreview key={friend.userID} user={friend} onClick={selectUser}/>) 
                }
                {
                  loadingMore && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                }
                <div ref={friendsLoaderRef}></div>
              </ul> 
            }
          </div>
        )
      }
      {/* friend requests tab */} 
      {
        activeTab == "requests" && (
          <div className='w-full flex-1 px-2 overflow-y-scroll'> 
            {
              loading ? (
                Array.from({ length: 8 }).map((_, i) => <RequestPreviewSkeleton key={i} isSent={false} />)
              ) :
              friendRequests.length == 0 ? (
                <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                  <Ghost className='size-6' />
                  You have no friend requests 
                </div> 
              ) : 
              <ul>
                
                {
                  friendRequests.map(req => (
                    <RequestPreview key={req.userID} request={req} isSent={false} onClick={selectUser} onUpdate={onUpdate} />
                  ))
                }
                {
                  loadingMore && Array.from({ length: 2 }).map((_, i) => <RequestPreviewSkeleton key={i} isSent={false} />)
                }
                <div ref={requestsLoaderRef}></div>
              </ul> 
            }
          </div>
        )
      }
      {/* sent requests tab */} 
      {
        activeTab == "sent" && (
          <div className='w-full flex-1 px-2 overflow-y-scroll'> 
            {
              loading ? (
                 Array.from({ length: 8 }).map((_, i) => <RequestPreviewSkeleton key={i} isSent={true} />)
              ) :
              sentRequests.length == 0 ? (
                <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                  <Ghost className='size-6' />
                  You have no pending requests 
                </div> 
              ) : 
              <ul>
                {
                  sentRequests.map(req => (
                    <RequestPreview key={req.userID} request={req} isSent={true} onClick={selectUser} onUpdate={onUpdate} />
                  ))
                }
                {
                  loadingMore && Array.from({ length: 2 }).map((_, i) => <RequestPreviewSkeleton key={i} isSent={true} />)
                }
                <div ref={sentLoaderRef}></div>
              </ul> 
            }
          </div>
        )
      } 
    </div>
  )
}


const Main = ({user,mutualFriends, setUser, loading, selectUser, updateRequestList}) => {
  return (
      <div className='min-h-screen w-full'>
        <MobileHeader title={user ? "Profile" : "Group"} />
        {
          user ? (
            <Profile 
              user={user} 
              mutualFriends={mutualFriends} 
              setUser={setUser} 
              loading={loading} 
              onSelect={selectUser} 
              updateRequestList={updateRequestList}
            />
          ) : (
            <div className='w-full h-screen flex flex-col items-center justify-center gap-2'>
              <img src="/assets/profile-interface.svg" className='w-[45%]' />
              <span className='text-xl font-outfit text-light-txt dark:text-dark-txt'> 
                Select a user to view their profile!
              </span>
            </div>
          )
          
        }
      </div>
    )
}

function FriendsPage() {
  const { setMainActive } = useLayoutStore();
  const [activeTab, setActiveTab] = useState("friends");

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  const [friendsPage, setFriendsPage] = useState(1);
  const [friendRequestsPage, setFriendRequestsPage] = useState(1);
  const [sentRequestsPage, setSentRequestsPage] = useState(1);

  const [hasMoreFriends, setHasMoreFriends] = useState(false);
  const [hasMoreFriendRequests, setHasMoreFriendRequests] = useState(false);
  const [hasMoreSentRequests, setHasMoreSentRequests] = useState(false);

  const limit = 10;

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mutualFriends, setMutualFriends] = useState([]);

  const fetchFriends = async (reset) => {
    if(!reset && !hasMoreFriends) return;
    const result = await getFriends(reset, friendsPage, limit);

    if(result?.friends) {
      const newFriends = result.friends;
      const totalPages = result.totalPages;

      setFriends(prev => reset ? newFriends : [...prev, ...newFriends]);
      setHasMoreFriends((reset ? 1 : friendsPage) < totalPages);
      setFriendsPage(reset ? 2 : friendsPage + 1);
    }
  }

  const fetchFriendRequests = async (reset) => {
    if(!reset && !hasMoreFriendRequests) return;
    const result = await getFriendRequests(reset, friendRequestsPage, limit);

    if(result?.requests) {
      const newRequests = result.requests;
      const totalPages = result.totalPages;

      setFriendRequests(prev => reset ? newRequests : [...prev, ...newRequests]);
      setHasMoreFriendRequests((reset ? 1 : friendRequestsPage) < totalPages);
      setFriendRequestsPage(reset ? 2 : friendRequestsPage + 1);
    }
  }

  const fetchSentRequests = async (reset) => {
    if(!reset && !hasMoreSentRequests) return;
    const result = await getSentFriendRequests(reset, sentRequestsPage, limit);

    if(result?.requests) {
      const newRequests = result.requests;
      const totalPages = result.totalPages;

      setSentRequests(prev => reset ? newRequests : [...prev, ...newRequests]);
      setHasMoreSentRequests((reset ? 1 : sentRequestsPage) < totalPages);
      setSentRequestsPage(reset ? 2 : sentRequestsPage + 1);
    }
  }

  const fetchData = async (reset = false) => {
    if(activeTab == "friends") {
      await fetchFriends(reset);
    } else if (activeTab == "requests") {
      await fetchFriendRequests(reset);
    } else {
      await fetchSentRequests(reset);
    }

    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchData(true);
    };

    loadInitialData();
  }, [activeTab]);


  const loadMore = async () => {
    if(!loading && !loadingMore) {
      setLoadingMore(true);
      fetchData();
    }
  } 

  const updateRequestList = (userID, profile) => {
    let newList = [];
    if(activeTab == "requests") {
      newList = [...friendRequests].filter(req => req.userID !== userID);
      setFriendRequests(newList);
    } else {
      newList = [...sentRequests].filter(req => req.userID !== userID);
      setSentRequests(newList)
    }

    if(selectedUser.userID === userID) {
      setSelectedUser(profile);
    }
  }

  const selectUser = async (userID) => {
    setLoadingProfile(true);
    setSelectedUser(userID);
    setMainActive(true); 
    try {
      const res = await getUserDetails(userID);
      const mut = await getMutualFriends(userID);
      
      if(mut.mutualFriends) {
        setMutualFriends(mut.mutualFriends)
      }
      
      if(res) {
        setSelectedUser(res);
      } else {
        setSelectedUser(null);
        setMainActive(false)
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoadingProfile(false);
    }
  }

  return (
    <ResponsiveLayout
      aside={
        <Aside 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          friends={friends}
          friendRequests={friendRequests}
          sentRequests={sentRequests}
          loading={loading}
          loadingMore={loadingMore}
          loadMore={loadMore}
          selectUser={selectUser}
          onUpdate={updateRequestList}
        />
      }
      main={
        <Main 
          user={selectedUser}
          mutualFriends={mutualFriends}
          setUser={setSelectedUser}
          loading={loadingProfile}    
          selectUser={selectUser}
          updateRequestList={updateRequestList}
        />
      }
    />  
  )
}

export default FriendsPage