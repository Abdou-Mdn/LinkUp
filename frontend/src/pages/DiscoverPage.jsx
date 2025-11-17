import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Ghost, Search, X } from 'lucide-react'
import debounce from 'lodash.debounce'

import { useLayoutStore } from '../store/layout.store'
import { useAuthStore } from '../store/auth.store'

import { getMutualFriends, getUserDetails, getUsers } from '../lib/api/user.api'
import { getFriendMembers, getGroupDetails, getGroups, getJoinRequests, getMembers } from '../lib/api/group.api'

import ProfilePreview from '../components/previews/ProfilePreview'
import ProfilePreviewSkeleton from '../components/skeleton/ProfilePreviewSkeleton'
import Profile from '../components/main/Profile'
import MobileHeader from '../components/layout/MobileHeader'
import ResponsiveLayout from '../components/layout/ResponsiveLayout'
import GroupPreview from '../components/previews/GroupPreview'
import GroupProfile from '../components/main/GroupProfile'


/* 
 * Aside component
 * displays a sidebar with a search input and two expandable sections for the users and groups lists

 * - Displays a search input with a debounced query when user types
 * - Displays part of users list with a button to expand the list.
 * - Displays part of groups list with a button to expand the list.
 * - Both lists have infinite scroll when expanded 
 
 * params:
 * - search: search input text state
 * - setSearch: setter to update search text
 * - handleSearch: function to make a query call when search changes (debounced)
 * - loadMore: function to load more users or groups based on which section is expanded
 * - loading: initial loading state
 * - loadingMore: infinite scroll loading state 
 * - view: state to control which section is visible ("both": none expanded, "users": users list expanded, "groups": groups list expanded)
 * - setView: setter to update view state
 * - users: list of users 
 * - groups: list of groups
 * - selectUser: display user profile on main
 * - selectGroup: display group profile on main
 * - selectedUser: user already displayed in main
 * - selectedGroup: group already displayed in main
*/
const Aside = ({ 
    search, setSearch, handleSearch, 
    loadMore, loading, loadingMore, 
    view, setView, users, groups,
    selectUser, selectGroup, selectedUser, selectedGroup
  }) => {
    // loader refs
    const usersLoaderRef = useRef(null); // for users list
    const groupsLoaderRef = useRef(null); // for groups list

    // set up IntersectionObserver to load more users/groups when loader is vsible
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

      // select which loader gets attached to the observer based on view
      const target = view == "users" ? usersLoaderRef.current : groupsLoaderRef.current;
      if(target) observer.observe(target);

      return () => observer.disconnect();
    }, [view, loading, loadingMore]);

    return (
      <div className='w-full h-screen flex flex-col items-center
       bg-light-200 text-light-txt dark:bg-dark-200 dark:text-dark-txt'>
        
        {/* search input */}
        <div className='relative py-2 w-[90%] min-w-[150px]'>
          <button 
            onClick={() => setSearch("")}
            className='size-8 absolute top-3 right-3 rounded-4xl flex items-center justify-center cursor-pointer'
          >
            {
              search ? <X className='size-6 text-light-txt dark:text-dark-txt'/> :
              <Search className='size-6 text-light-txt2 dark:text-dark-txt2'/>
            }
          </button>
          
          <input 
            type="text"
            placeholder='Search users or groups'
            value={search}
            onChange={handleSearch}
            className='p-2 pl-4 w-full rounded-xl outline-0 focus:outline-2
            outline-secondary bg-light-300 text-light-txt dark:bg-dark-300 dark:text-dark-txt' 
          />
        </div>

        {/* search results */}
        {
          // didn't type anything yet
          !search ? (
            <div className='flex-1 flex flex-col pt-15 justify-start items-center gap-2'>
              <Search className='size-6' /> 
              Start typing to search 
            </div> 
          ) : (
            <div className='flex-1 w-full flex flex-col'>
                {/* users list */}
                <div className={`flex-col px-2 transition-all ease-in-out overflow-hidden ${view == "groups" ? 'h-0 opacity-0' : view === "users" ? 'h-full' : 'h-1/2'}`}>
                  <div className='flex items-center justify-between w-full'>
                    {/* title */}
                    <span className='text-lg font-outfit font-semibold' >Users</span>
                    {/* view more/less button */}
                    <button 
                      className='px-1 text-sm cursor-pointer text-primary hover:text-secondary hover:underline' 
                      onClick={() => view == "both" ? setView("users") : setView("both")}
                    >
                      { view == "both" ? 'View More' : 'View Less' }
                    </button>
                  </div>
                  {
                    // display skeletons while loading
                    loading ? (
                      Array.from({ length: 3 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                    ) : users.length == 0 ? ( 
                      // users list is empty
                      <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                        <Ghost className='size-6' />
                        No users found 
                      </div> 
                    ) : 
                    <ul className='overflow-y-auto scrollbar'>
                      {
                        // display only 4 users, and the whole list if expanded
                        view == "both" ? 
                        users.slice(0,3).map(user => <ProfilePreview key={user.userID} user={user} onSelect={selectUser} isSelected={selectedUser?.userID === user.userID} />) :
                        users.map(user => <ProfilePreview key={user.userID} user={user} onSelect={selectUser} isSelected={selectedUser?.userID === user.userID} />) 
                      }
                      {
                        // display skeletons if loading more users
                        loadingMore && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                      }
                      { 
                        // sentinal div for loading more users
                        view == "users" && <div ref={usersLoaderRef}></div>
                      }
                    </ul>
                  }
                </div>
                {/* groups list */}
                <div className={`flex-col px-2 transition-all ease-in-out overflow-hidden ${view == "users" ? 'h-0 opacity-0' : view === "groups" ? 'h-full' : 'h-1/2'}`}>
                  <div className='flex items-center justify-between w-full'>
                    {/* title */}
                    <span className='text-lg font-outfit font-semibold' >Groups</span>
                    {/* view more/less button */}
                    <button 
                      className='px-1 text-sm cursor-pointer text-primary hover:text-secondary hover:underline' 
                      onClick={() => view == "both" ? setView("groups") : setView("both")}
                    >
                      { view == "both" ? 'View More' : 'View Less' }
                    </button>
                  </div>
                  {
                    // display skeletons while loading
                    loading ? (
                      Array.from({ length: 3 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                    ) : groups.length == 0 ? ( 
                      // groups list is empty
                      <div className='flex-1 pt-10 flex flex-col items-center gap-2'> 
                        <Ghost className='size-6' />
                        No groups found 
                      </div> 
                    ) : 
                    <ul className='overflow-y-auto scrollbar'>
                      {
                        // display only 4 groups, full list if expanded
                        view == "both" ? 
                        groups.slice(0,3).map(group => <GroupPreview key={group.groupID} group={group} onSelect={selectGroup} isSelected={selectedGroup?.groupID === group.groupID} />) :
                        groups.map(group => <GroupPreview key={group.groupID} group={group} onSelect={selectGroup} isSelected={selectedGroup?.groupID === group.groupID} />) 
                      }
                      {
                        // display skeletons while loading more groups
                        loadingMore && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                      }
                      { 
                        // sentinal div for loading more groups
                        view == "groups" && <div ref={groupsLoaderRef}></div>
                      }
                    </ul>
                  }
                </div>
            </div>
          )
        }
       </div>
    )
  }


/* 
 * Main component
 * Main panel that displays either a user profile or a group profile.
 * If nothing is selected, shows a placeholder illustration + message.
 * Displays MobileHeader with the title profile/group when main is open with a go back to aside button (only on mobile) 

 * params:
 * - user, setUser, mutualFriends: user profile display, passed down as props (Profile)
 * - group, setGroup, friendMembers: group profile display, passed down as props (GroupProfile)
 * - members, setMembers, loadMoreMembers, loadingMoreMembers: group members list, passed down as props (GroupProfile)
 * - joinRequests, setRequests, loadMoreRequests, loadingMoreRequests: group received join requests list, passed down as props (GroupProfile)
 * - loading: loading profile state, passed down to Profile and GroupProfile
 * - updateGroupList: update the groups list in aside (passed to GroupProfile)
 * - updateUserList: updateUserList in aside (passed to Profile)
*/
const Main = ({ 
  user, setUser, mutualFriends, group, setGroup, friendMembers, loading, 
  members, setMembers, loadMoreMembers, loadingMoreMembers,
  joinRequests,  setRequests,  loadMoreRequests, loadingMoreRequests, 
  updateGroupList, updateUserList}) => {
  return (
    <div className='h-screen w-full overflow-y-auto scrollbar bg-light-100 dark:bg-dark-100'>
      {/* mobile header */}
      <MobileHeader title={user ? "Profile" : "Group"} />
      {
        // display user profile if user is selected
        user ? (
          <Profile 
            user={user} 
            mutualFriends={mutualFriends} 
            setUser={setUser} 
            loading={loading} 
            updateList={updateUserList} 
          /> ) : 
        // display group profile if group is selected
        group ? (
          <GroupProfile 
            group={group} 
            setGroup={setGroup}
            loading={loading}
            friendMembers={friendMembers} 
            members={members}
            setMembers={setMembers} 
            loadMoreMembers={loadMoreMembers}
            loadingMoreMembers={loadingMoreMembers}
            requests={joinRequests}  
            setRequests={setRequests}  
            loadMoreRequests={loadMoreRequests}  
            loadingMoreRequests={loadingMoreRequests} 
            updateList={updateGroupList} 
          />) :
        // display placeholder of none is selected
        <div className='w-full h-screen flex flex-col items-center justify-center gap-2'>
          <img src="/assets/profile-interface.svg" className='w-[45%]' />
          <span className='text-xl font-outfit text-light-txt dark:text-dark-txt'> Select a user or group to view their profile!</span>
        </div>
      }
    </div>
  )
}

/* 
 * Discover Page
 * used to search for users or groups and see their profile details
 * consists of an aside with a search input and a main for displaying the profiles

 * Integrates with API functions:
 * - `getMutualFriends`, `getUserDetails`, `getUsers`, `getFriendMembers`, `getGroupDetails`, `getGroups`, `getJoinRequests`, `getMembers`
*/
function DiscoverPage() {
  const { authUser, socket } = useAuthStore()
  const { setMainActive } = useLayoutStore();

  /* -------- aside states -------- */
  const [loading, setLoading] = useState(false); // initial loading state
  const [loadingMore, setLoadingMore] = useState(false); // loading more state

  const [search, setSearch] = useState(""); // search text 
  const [view, setView] = useState("both") // view control state ("both" | "users" | "groups")

  // users list (pagination)
  const [users, setUsers] = useState([]); // users search result
  const [usersPage, setUsersPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  // groups list (pagination)
  const [groups, setGroups] = useState([]); // groups search result
  const [groupsPage, setGroupsPage] = useState(1);
  const [hasMoreGroups, setHasMoreGroups] = useState(false);
  
  const limit = 10; // items per page

  
  /* -------- main states -------- */
  const [loadingProfile, setLoadingProfile] = useState(false); // loading state
  
  // user profile states
  const [selectedUser, setSelectedUser] = useState(null); // currently selected user
  const [mutualFriends, setMutualFriends] = useState([]); // mutual friends of selected user and authenticated user
 
  // group profile states
  const [selectedGroup, setSelectedGroup] = useState(null); // currently selected group
  const [friendMembers, setFriendMembers] = useState([]); // members of selected group who are friends of authenticated user
  // selected group's members list (pagination)
  const [members, setMembers] = useState([]);
  const [membersPage, setMembersPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);
  const [hasMoreMembers, setHasMoreMembers] = useState(false);
  // selected group's join requests list (pagination)
  const [requests, setRequests] = useState([]);
  const [hasMoreRequests, setHasMoreRequests] = useState(false);
  const [loadingMoreMembers, setLoadingMoreMembers] = useState(false);
  const [loadingMoreRequests, setLoadingMoreRequests] = useState(false);
  

  /* -------- aside data fetching -------- */

  // get users or groups from backend
  const fetchData = async (reset = false, name) => {
    try {
      let userRes, groupRes;

      if(reset) {
        // get both users and groups (on parallel) if resetting search
        [userRes, groupRes] = await Promise.all([
          getUsers(name,reset, usersPage, limit),
          getGroups(name, reset, groupsPage, limit)
        ]);
      } else {
        // load more based on view
        if(view == "users" && hasMoreUsers) {
          userRes = await getUsers(name,reset, usersPage, limit);
        } else if(view == "groups" && hasMoreGroups) {
          groupRes = await getGroups(name, reset, groupsPage, limit)
        }
      }
      
      // handle users response
      if(userRes?.users) {
        const newUsers = userRes.users;
        const usersTotalPages = userRes.totalPages

        setUsers(prev => reset ? newUsers : [...prev, ...newUsers]);
        setHasMoreUsers((reset ? 1 : usersPage) < usersTotalPages);
        setUsersPage(reset ? 2 : usersPage + 1);
      }
      
      // handle groups response 
      if(groupRes?.groups) {
        const newGroups = groupRes.groups;
        const groupsTotalPages = groupRes.totalPages

        setGroups(prev => reset ? newGroups : [...prev, ...newGroups]);
        setHasMoreGroups((reset ? 1 : groupsPage) < groupsTotalPages);
        setGroupsPage(reset ? 2 : groupsPage + 1);
      }

    } catch (error) {
      console.log("error in fetching users and groups", error);
    } finally {
      if(reset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }

  // debounced search input handler (prevents API spam while typing)
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if(!query.trim()) {
        setUsers([]);
        setGroups([]);
        return;
      }

      await fetchData(true, query);
    }, 500),
    [view]
  );

  // handle text change in search input 
  const handleSearch = (e) => {
    const value = e.target.value
    setSearch(value);
    setLoading(true);
    debouncedSearch(value)
  }

  // load more results (users/groups) when infinite scroll triggers
  const loadMore = async () => {
    if(!loading && !loadingMore) {
      setLoadingMore(true);
      fetchData(false, search)
    }
  }

  // update lastSeen when user disconnects
  useEffect(() => {
    if(!socket) return;

    const handleUserOffline = ({ userID, lastSeen }) => {
      setUsers(prev =>
        prev.map(user => user.userID === Number(userID) ? { ...user, lastSeen } : user)
      );
    };

    socket.on("userOffline", handleUserOffline);

    return () => socket.off("userOffline", handleUserOffline);
  }, [socket]);

  /* -------- main content fetching -------- */

  // handle display user profile
  const selectUser = async (userID) => {
    setSelectedGroup(null); // clear selected group
    setLoadingProfile(true);
    setSelectedUser(userID) // temporary store user ID
    setMainActive(true); // open main panel in mobile
    try {
      const res = await getUserDetails(userID);
      
      // if user is not authUser then fetch mutual friends
      if(userID !== authUser.userID) {
        const mut = await getMutualFriends(userID);
        
        if(mut?.mutualFriends) {
          setMutualFriends(mut.mutualFriends)
        }
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

  // handle display group profile
  const selectGroup = async (groupID) => {
    setSelectedUser(null); // clear selected user
    setLoadingProfile(true);
    setSelectedGroup(groupID); // temporary store group ID
    setMainActive(true); // open main panel in mobile
    try {
      // fetch group details, friend members, members list, and join requests in parallel
      const [res, mut, mem, req] = await Promise.all([
        getGroupDetails(groupID),
        getFriendMembers(groupID),
        getMembers(groupID, true, membersPage, limit),
        getJoinRequests(groupID, true, requestsPage, limit),
      ]);
      
      // handle members response
      if(mem?.members) {
        const totalPages = mem.totalPages;

        setMembers(mem.members);
        setHasMoreMembers(membersPage < totalPages);
        setMembersPage(2);
      }

      // handle requests response
      if(req?.requests) {
        const totalPages = req.totalPages;

        setRequests(req.requests);
        setHasMoreRequests(requestsPage < totalPages);
        setRequestsPage(2);
      }

      // handle friend members response
      if(mut?.members) {
        setFriendMembers(mut.members);
      }

      // handle group details response
      if(res) {
        setSelectedGroup(res); // replace with full details
      } else {
        // reset if group not found
        setSelectedGroup(null);
        setMainActive(false)
      }

    } catch (error) {
      console.error("Error fetching group:", error);
    } finally {
      setLoadingProfile(false);
    }
  }

  // load more members when infinite scroll triggers
  const loadMoreMembers = async (groupID) => {
    if(loadingMoreMembers || !hasMoreMembers) return;
    setLoadingMoreMembers(true);
    try {
      const res = await getMembers(groupID, false, membersPage, limit);

      if(res?.members) {
        const newMembers = res.members;
        const totalPages = res.totalPages

        setMembers(prev => [...prev, ...newMembers]);
        setHasMoreMembers(membersPage < totalPages);
        setMembersPage(membersPage + 1);
      } 
    } catch (error) {
      console.log("error in loading more members ", error);
    } finally {
      setLoadingMoreMembers(false);
    }
  }

  // load more join requests when ininite scroll triggers
  const loadMoreRequests = async (groupID) => {
    if(loadingMoreRequests || !hasMoreRequests) return;
    setLoadingMoreRequests(true);
    try {
      const res = await getJoinRequests(groupID, false, requestsPage, limit);

      if(res?.requests) {
        const newRequests = res.requests;
        const totalPages = res.totalPages

        setRequests(prev => [...prev, ...newRequests]);
        setHasMoreRequests(requestsPage < totalPages);
        setRequestsPage(requestsPage + 1);
      }
    } catch (error) {
      console.log("error in loading more join requests ", error);
    } finally {
      setLoadingMoreRequests(false);
    }
  }

  // layout rendering 
  return (
    <ResponsiveLayout 
      aside={
        <Aside 
          search={search}
          setSearch={setSearch}
          handleSearch={handleSearch}
          loadMore={loadMore}
          view={view}
          setView={setView}
          loading={loading}
          loadingMore={loadingMore}
          users={users}
          groups={groups}
          selectUser={selectUser}
          selectGroup={selectGroup}
          selectedUser={selectedUser}
          selectedGroup={selectedGroup}
        />
      } 
      main={
        <Main 
          user={selectedUser}
          setUser={setSelectedUser}
          mutualFriends={mutualFriends}
          group={selectedGroup}
          setGroup={setSelectedGroup}
          loading={loadingProfile}
          friendMembers={friendMembers}
          members={members}
          setMembers={setMembers}
          loadMoreMembers={loadMoreMembers}
          loadingMoreMembers={loadingMoreMembers}
          joinRequests={requests}
          setRequests={setRequests}
          loadMoreRequests={loadMoreRequests}
          loadingMoreRequests={loadingMoreRequests}    
          selectUser={selectUser}
          updateUserList={setUsers}
          updateGroupList={setGroups}
        />
      } 
    />
  )
}

export default DiscoverPage