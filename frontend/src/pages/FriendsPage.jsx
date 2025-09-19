import React, { useEffect, useRef, useState } from 'react'
import { Ghost } from 'lucide-react'

import { useAuthStore } from '../store/auth.store'
import { useLayoutStore } from '../store/layout.store'

import { getFriendRequests, getFriends, getMutualFriends, getSentFriendRequests, getUserDetails } from '../lib/api/user.api'

import ResponsiveLayout from '../components/layout/ResponsiveLayout'
import MobileHeader from '../components/layout/MobileHeader'
import Profile from '../components/main/Profile'
import ProfilePreview from '../components/previews/ProfilePreview'
import RequestPreview from '../components/previews/RequestPreview'
import RequestPreviewSkeleton from '../components/skeleton/RequestPreviewSkeleton'
import ProfilePreviewSkeleton from '../components/skeleton/ProfilePreviewSkeleton'


/* 
 * Aside component
 * displays a sidebar with three tabs Friends, Friend requests, Sent requests

 * - Friends: displays the list of the user's friends
 * - Friend requests: displays the list of received friend requests.
 * - Sent requests: displays the list of sent friend requests
 * - all lists have infinite scroll
 
 * params:
 * - activeTab: state controls which tab is currently active
 * - setActiveTab: setter to update the active tab
 * - friends: list of friends to display
 * - friendRequests: list of received friend requests to display
 * - sentRequests: list of sent friend requests to display
 * - loading: initial loading state
 * - loadingMore: loading more state
 * - loadMore: function to load more data (friends/requests) based on active tab
 * - selectedUser: currently selected user
 * - setUser: update user profile
 * - selectUser: open a user profile to display on main
 * - updateFriends: update the friends list (on accept request/ remove friend)
 * - updateFriendRequests: update the received friend requests list (on accept/decline request)
 * - updateSentRequests: update the sent friend requests list (on send/cancel request) 
*/
const Aside = ({
  activeTab, setActiveTab,
  friends, friendRequests, sentRequests,
  loading, loadingMore, loadMore, selectedUser, setUser, selectUser,
  updateFriends, updateFriendRequests, updateSentRequests
}) => {
  const { setAuthUser } = useAuthStore();

  // loader refs
  const friendsLoaderRef = useRef(null);
  const requestsLoaderRef = useRef(null);
  const sentLoaderRef = useRef(null);

  // set up IntersectionObserver to load more data (friends/requests) based on active tab
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

    // get which loader to attach to the observer
    const target = activeTab == "friends" ? friendsLoaderRef.current : activeTab == "requests" ? requestsLoaderRef.current : sentLoaderRef.current;
    if(target) observer.observe(target);

    return () => observer.disconnect();
  }, [activeTab, loading, loadingMore]);

  // update lists after canceling sent request 
  const onCancel = (user, profile) => {
    setAuthUser(user);
    if(selectedUser?.userID == profile.userID) {
      setUser(profile);
    }
    updateSentRequests(prev => prev.filter(r => r.userID !== profile.userID));
  }

  // update list after accepting received request
  const onAccept = (user, profile) => {
    setAuthUser(user);
    if(selectedUser?.userID == profile.userID) {
      setUser(profile);
    }
    updateFriendRequests(prev => prev.filter(r => r.userID !== profile.userID));
    updateFriends(prev => [...prev, profile]);
  }

  // update lists after declining received request
  const onDecline = (user, profile) => {
    setAuthUser(user);
    if(selectedUser?.userID == profile.userID) {
      setUser(profile);
    }
    updateFriendRequests(prev => prev.filter(r => r.userID !== profile.userID));
  }

  return (
    <div className='w-full h-screen flex flex-col items-center
    bg-light-200 text-light-txt dark:bg-dark-200 dark:text-dark-txt'>

      {/* tabs */}
      <div className='flex items-center justify-between w-full gap-1'>
        {/* friends */}
        <div 
          title='Friends' 
          className={`flex-1 py-3 text-sm font-outfit font-medium text-center cursor-pointer border-b-2 ${activeTab == "friends" ? 'text-primary border-primary border-b-4' : 'text-light-txt dark:text-dark-txt border-light-txt dark:border-dark-txt hover:text-light-txt2 dark:hover:text-dark-txt2 hover:border-light-txt2 dark:hover:border-dark-txt2'}`}
          onClick={() => setActiveTab("friends")}
        >
          Friends
        </div>

        {/* friend requests */}
        <div 
          title='Friend Requests' 
          className={`flex-1 py-3 text-sm font-outfit font-medium text-center cursor-pointer border-b-2 truncate ${activeTab == "requests" ? 'text-primary border-primary border-b-4' : 'text-light-txt dark:text-dark-txt border-light-txt dark:border-dark-txt hover:text-light-txt2 dark:hover:text-dark-txt2 hover:border-light-txt2 dark:hover:border-dark-txt2'}`}
          onClick={() => setActiveTab("requests")}
        >
          Friend Requests
        </div>
        
        {/* sent requests */}
        <div 
          title='Sent Requests' 
          className={`flex-1 py-3 text-sm font-outfit font-medium text-center cursor-pointer border-b-2 truncate ${activeTab == "sent" ? 'text-primary border-primary border-b-4' : 'text-light-txt dark:text-dark-txt border-light-txt dark:border-dark-txt hover:text-light-txt2 dark:hover:text-dark-txt2 hover:border-light-txt2 dark:hover:border-dark-txt2'}`}
          onClick={() => setActiveTab("sent")}
        >
          Sent Requests
        </div>
      </div>
      
      {/* ** friends tab ** */}
      {
        activeTab == "friends" && (
          <div className='w-full flex-1 px-2 overflow-y-auto scrollbar'> 
            {
              // display skeletons while loading friends
              loading ? (
                Array.from({ length: 8 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
              ) :
              // empty friends list
              friends.length == 0 ? (
                <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                  <Ghost className='size-6' />
                  You have no friends 
                </div> 
              ) : 
              <ul className='px-1'>
                {
                  // friends list
                  friends.map(friend => <ProfilePreview key={friend.userID} user={friend} onSelect={selectUser} isSelected={selectedUser?.userID === friend.userID}/>) 
                }
                {
                  // display skeletons while loading more
                  loadingMore && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                }
                {/* sentinal div for loading more friends */}
                <div ref={friendsLoaderRef}></div>
              </ul> 
            }
          </div>
        )
      }
      {/* ** friend requests tab ** */}
      {
        activeTab == "requests" && (
          <div className='w-full flex-1 px-2 overflow-y-auto scrollbar'> 
            {
              // display skeletons while loading requests 
              loading ? (
                Array.from({ length: 8 }).map((_, i) => <RequestPreviewSkeleton key={i} isSent={false} />)
              ) :
              friendRequests.length == 0 ? (
                // empty received friend requests list
                <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                  <Ghost className='size-6' />
                  You have no friend requests 
                </div> 
              ) : 
              <ul>
                {
                  // received friend requests list
                  friendRequests.map(req => (
                    <RequestPreview 
                      key={req.userID} 
                      request={req} 
                      isSent={false} 
                      isSelected={selectedUser?.userID === req.userID}
                      onSelect={selectUser}  
                      onAccept={onAccept}
                      onDecline={onDecline}
                    />
                  ))
                }
                {
                  // display skeletons while loading more
                  loadingMore && Array.from({ length: 2 }).map((_, i) => <RequestPreviewSkeleton key={i} isSent={false} />)
                }
                {/* sentinal div for loading more received friend requests */}
                <div ref={requestsLoaderRef}></div>
              </ul> 
            }
          </div>
        )
      }
      {/* sent requests tab */} 
      {
        activeTab == "sent" && (
          <div className='w-full flex-1 px-2 overflow-y-auto scrollbar'> 
            {
              // display skeletons while loading sent friend requests
              loading ? (
                 Array.from({ length: 8 }).map((_, i) => <RequestPreviewSkeleton key={i} isSent={true} />)
              ) :
              sentRequests.length == 0 ? (
                // empty sent freind requests list
                <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                  <Ghost className='size-6' />
                  You have no pending requests 
                </div> 
              ) : 
              <ul>
                {
                  // sent friend requests list
                  sentRequests.map(req => (
                    <RequestPreview 
                      key={req.userID} 
                      request={req} 
                      isSent={true} 
                      isSelected={selectedUser?.userID === req.userID}
                      onSelect={selectUser} 
                      onCancel={onCancel} 
                    />
                  ))
                }
                {
                  // display skeletons while loading more sent requests
                  loadingMore && Array.from({ length: 2 }).map((_, i) => <RequestPreviewSkeleton key={i} isSent={true} />)
                }
                {/* sentinal div for loading more sent friend requests */}
                <div ref={sentLoaderRef}></div>
              </ul> 
            }
          </div>
        )
      } 
    </div>
  )
}

/* 
 * Main component
 * Main panel that displays the user profile .
 * If nothing is selected, shows a placeholder illustration + message.
 * Displays MobileHeader with the title profile when main is open with a go back to aside button (only on mobile) 

 * params:
 * - user, setUser, mutualFriends: user profile display, passed down as props (Profile)
 * - loading: loading profile state, passed down to Profile
 * - updateFriends, updateFriendRequests, updateSentRequests: update lists in aside, passed down as props
*/
const Main = ({user,mutualFriends, setUser, loading, updateFriends, updateFriendRequests, updateSentRequests}) => {
  return (
      <div className='h-screen w-full overflow-y-auto scrollbar bg-light-100 dark:bg-dark-100'>
        {/* mobile header */}
        <MobileHeader title={user ? "Profile" : "Group"} />
        
        {
          // display user if selected
          user ? (
            <Profile 
              user={user} 
              mutualFriends={mutualFriends} 
              setUser={setUser} 
              loading={loading} 
              updateFriends={updateFriends}
              updateFriendRequests={updateFriendRequests}
              updateSentRequests={updateSentRequests}
            />
          ) : (
            // display placeholder if not
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

/* 
 * Friends Page
 * used to check friends, received/sent friend requests 
 * consists of an aside with three tabs and a main for displaying the profiles

 * Integrates with API functions:
 * - `getFriendRequests`, `getFriends`, `getMutualFriends`, `getSentFriendRequests`, `getUserDetails`
*/
function FriendsPage() {
  const { setMainActive } = useLayoutStore();
  
  /* -------- aside states -------- */
  const [activeTab, setActiveTab] = useState("friends"); // active tab control state: "friends" | "requests" | "sent"

  const [loading, setLoading] = useState(false); // initial loading state
  const [loadingMore, setLoadingMore] = useState(false); // loading more state

  // friends list states (pagination)
  const [friends, setFriends] = useState([]);
  const [friendsPage, setFriendsPage] = useState(1);
  const [hasMoreFriends, setHasMoreFriends] = useState(false);
  
  // received friend requests list states (pagination) 
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendRequestsPage, setFriendRequestsPage] = useState(1);
  const [hasMoreFriendRequests, setHasMoreFriendRequests] = useState(false);
  
  // sent friend requests list states (pagination)
  const [sentRequests, setSentRequests] = useState([]);
  const [sentRequestsPage, setSentRequestsPage] = useState(1);
  const [hasMoreSentRequests, setHasMoreSentRequests] = useState(false);

  const limit = 10; // items per page

  /* -------- main states -------- */

  const [loadingProfile, setLoadingProfile] = useState(false); // loading profile state
  const [selectedUser, setSelectedUser] = useState(null); // currently selected user 
  const [mutualFriends, setMutualFriends] = useState([]); // mutual friends of selected user and authenticated user

  /* -------- aside data fetching -------- */

  // get friends from backend
  const fetchFriends = async (reset) => {
    if(!reset && !hasMoreFriends) return; // exit early if there are no more friends
    
    try {
      const result = await getFriends(reset, friendsPage, limit);

      // handle friends result
      if(result?.friends) {
        const newFriends = result.friends;
        const totalPages = result.totalPages;

        setFriends(prev => reset ? newFriends : [...prev, ...newFriends]);
        setHasMoreFriends((reset ? 1 : friendsPage) < totalPages);
        setFriendsPage(reset ? 2 : friendsPage + 1);
      }  
    } catch (error) {
      console.log("error in fetching friends ", error)    
    } finally {
      if(reset) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }
    }
  }

  // get received friend requests from backend
  const fetchFriendRequests = async (reset) => {
    if(!reset && !hasMoreFriendRequests) return; // exit early if there are no more requests

    try {
      const result = await getFriendRequests(reset, friendRequestsPage, limit);

      // handle requests result
      if(result?.requests) {
        const newRequests = result.requests;
        const totalPages = result.totalPages;

        setFriendRequests(prev => reset ? newRequests : [...prev, ...newRequests]);
        setHasMoreFriendRequests((reset ? 1 : friendRequestsPage) < totalPages);
        setFriendRequestsPage(reset ? 2 : friendRequestsPage + 1);
      } 
    } catch (error) {
      console.log("error in fetching friend requests ", error)
    } finally {
      if(reset) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }
    }
  }

  // get sent friend requests from backend
  const fetchSentRequests = async (reset) => {
    if(!reset && !hasMoreSentRequests) return; // exit early if there no more requests

    try {
      const result = await getSentFriendRequests(reset, sentRequestsPage, limit);

      if(result?.requests) {
        const newRequests = result.requests;
        const totalPages = result.totalPages;

        setSentRequests(prev => reset ? newRequests : [...prev, ...newRequests]);
        setHasMoreSentRequests((reset ? 1 : sentRequestsPage) < totalPages);
        setSentRequestsPage(reset ? 2 : sentRequestsPage + 1);
      } 
    } catch (error) {
      console.log("error in fetchin sent requests", error);  
    } finally {
      if(reset) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }
    }
  }

  // load data based on active tab
  const fetchData = async (reset = false) => {
    if(activeTab == "friends") {
      await fetchFriends(reset);
    } else if (activeTab == "requests") {
      await fetchFriendRequests(reset);
    } else {
      await fetchSentRequests(reset);
    }
  }

  // initial load of data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchData(true);
    };

    loadInitialData();
  }, [activeTab]);

  // load more data
  const loadMore = async () => {
    if(!loading && !loadingMore) {
      setLoadingMore(true);
      fetchData();
    }
  }

  /* -------- main content fetching -------- */

  // handle display user profile
  const selectUser = async (userID) => {
    setLoadingProfile(true);
    setSelectedUser(userID); // save temporarily user ID
    setMainActive(true); // open main panel on mobile
    try {
      // fetch user details and mutual friends on parallel
      const [res, mut] = await Promise.all([
        getUserDetails(userID),
        getMutualFriends(userID)
      ]);
      
      // handle mutual friends response
      if(mut.mutualFriends) {
        setMutualFriends(mut.mutualFriends)
      }
      
      if(res) {
        setSelectedUser(res); // replace with full details
      } else {
        // reset if user not found
        setSelectedUser(null);
        setMainActive(false)
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoadingProfile(false);
    }
  }

  // layout rendering
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
          selectedUser={selectedUser}
          setUser={setSelectedUser}
          selectUser={selectUser}
          updateFriends={setFriends}
          updateFriendRequests={setFriendRequests}
          updateSentRequests={setSentRequests}
        />
      }
      main={
        <Main 
          user={selectedUser}
          setUser={setSelectedUser}
          mutualFriends={mutualFriends}
          loading={loadingProfile}    
          selectUser={selectUser}
          updateFriends={setFriends}
          updateFriendRequests={setFriendRequests}
          updateSentRequests={setSentRequests}
        />
      }
    />  
  )
}

export default FriendsPage