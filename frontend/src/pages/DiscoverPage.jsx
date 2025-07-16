import React, { useCallback, useEffect, useRef, useState } from 'react'
import ResponsiveLayout from '../components/layout/ResponsiveLayout'
import { Ghost, Search, X } from 'lucide-react'
import debounce from 'lodash.debounce'
import { getMutualFriends, getUserDetails, getUsers } from '../lib/api/user.api'
import ProfilePreview from '../components/previews/ProfilePreview'
import ProfilePreviewSkeleton from '../components/skeleton/ProfilePreviewSkeleton'
import Profile from '../components/main/Profile'
import MobileHeader from '../components/layout/MobileHeader'
import { useLayoutStore } from '../store/layout.store'
import { useAuthStore } from '../store/auth.store'


const Aside = ({ 
    search, setSearch, handleSearch, 
    loadMore, loading, loadingMore, 
    view, setView, users, groups,
    selectUser, selectGroup
  }) => {
    const usersLoaderRef = useRef(null);
    const groupsLoaderRef = useRef(null);

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
            className='p-2 pl-4 w-full rounded-3xl outline-0 focus:outline-2
            outline-secondary bg-light-300 text-light-txt dark:bg-dark-300 dark:text-dark-txt' 
          />
        </div>

        {/* search results */}
        {
          !search ? (
            <div className='flex-1 flex flex-col pt-15 justify-start items-center gap-2'>
              <Search className='size-6' /> 
              Start typing to search 
            </div> 
          ) : (
            <div className='flex-1 w-full flex flex-col overflow-y-scroll'>
                {/* users */}
                <div className={`flex-col px-2 ${view == "groups" ? 'hidden' : 'flex'}`}>
                  <div className='flex items-center justify-between w-full'>
                    <span className='text-lg font-outfit font-semibold' >Users</span>
                    <button className='px-1 text-sm cursor-pointer text-secondary hover:underline' 
                      onClick={() => {
                      view == "both" ? setView("users") : setView("both");
                      }}
                    >
                      { view == "both" ? 'View More' : 'View Less' }
                    </button>
                  </div>
                  {
                    loading ? (
                      Array.from({ length: 4 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                    ) : users.length == 0 ? ( 
                      <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                        <Ghost className='size-6' />
                        No users found 
                      </div> 
                    ) : 
                      <ul>
                        {
                          view == "both" ? 
                          users.slice(0,4).map(user => <ProfilePreview key={user.userID} user={user} onClick={selectUser} />) :
                          users.map(user => <ProfilePreview key={user.userID} user={user} onClick={selectUser}/>) 
                        }
                        {
                          loadingMore && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                        }
                        { 
                          view == "users" && <div ref={usersLoaderRef}></div>
                        }
                      </ul>
                  }
                </div>
                {/* groups */}
                <div className={`mt-4 flex-col px-2 ${view == "users" ? 'hidden' : 'flex'}`}>
                  <div className='flex items-center justify-between w-full'>
                    <span className='text-lg font-outfit font-semibold' >Groups</span>
                    <button className='px-1 text-sm cursor-pointer text-secondary hover:underline' 
                      onClick={() => {
                      view == "both" ? setView("groups") : setView("both");
                      }}
                    >
                      { view == "both" ? 'View More' : 'View Less' }
                    </button>
                  </div>
                  {
                    loading ? (
                      Array.from({ length: 3 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                    ) : groups.length == 0 ? ( 
                      <div className='flex-1 pt-10 flex flex-col items-center gap-2'> 
                        <Ghost className='size-6' />
                        No groups found 
                      </div> 
                    ) : 
                      <ul className='p-2 bg-danger'>
                        <li>group</li>
                        <li>group</li>
                        {
                          loadingMore && <div>Loading more groupss</div>
                        }
                        { 
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

const Main = ({ user, setUser, mutualFriends, group, loading, selectUser}) => {
    return (
      <div className='min-h-screen w-full'>
        <MobileHeader title={user ? "Profile" : "Group"} />
        {
          user ? <Profile user={user} mutualFriends={mutualFriends} setUser={setUser} loading={loading} onSelect={selectUser} /> : 
          group ? <div>{group}</div> :
          <div className='w-full h-screen flex flex-col items-center justify-center gap-2'>
            <img src="/assets/profile-interface.svg" className='w-[45%]' />
            <span className='text-xl font-outfit text-light-txt dark:text-dark-txt'> Select a user or group to view their profile!</span>
          </div>
        }
      </div>
    )
}

function DiscoverPage() {
  const { authUser } = useAuthStore()
  const { setMainActive } = useLayoutStore();

  /* fetching data and aside states */
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("both")

  const [usersPage, setUsersPage] = useState(1);
  const [groupsPage, setGroupsPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [hasMoreGroups, setHasMoreGroups] = useState(false);
  
  const limit = 7;

  /* main selected states */
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mutualFriends, setMutualFriends] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  /* aside fetching data functions */
  const fetchData = async (reset = false, name) => {
    try {
      let userRes, groupRes;

      if(reset) {
        userRes = await getUsers(name,reset, usersPage, limit);
        // group api call here
      } else {
        // separate api calls based on view
        if(view == "users" && hasMoreUsers) {
          userRes = await getUsers(name,reset, usersPage, limit);
        } else if(view == "groups" && hasMoreGroups) {
          // group api call here
        }
      }

      console.log(userRes)
      
      if(userRes?.users) {
        const newUsers = userRes.users;
        const usersTotalPages = userRes.totalPages

        setUsers(prev => reset ? newUsers : [...prev, ...newUsers]);
        setHasMoreUsers((reset ? 1 : usersPage) < usersTotalPages);
        setUsersPage(reset ? 2 : usersPage + 1);
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

  const handleSearch = (e) => {
    const value = e.target.value
    setSearch(value);
    setLoading(true);
    debouncedSearch(value)
  }

  const loadMore = async () => {
    if(!loading && !loadingMore) {
      setLoadingMore(true);
      fetchData(false, search)
    }
  }

  /* displaying main content functions */
  const selectUser = async (userID) => {
    setSelectedGroup(null);
    setLoadingProfile(true);
    setSelectedUser(userID)
    setMainActive(true); 
    try {
      const res = await getUserDetails(userID);
      if(userID !== authUser.userID) {
        const mut = await getMutualFriends(userID);
        
        if(mut?.mutualFriends) {
          setMutualFriends(mut.mutualFriends)
        }
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
        />
      } 
      main={
        <Main 
          user={selectedUser}
          mutualFriends={mutualFriends}
          setUser={setSelectedUser}
          group={selectedGroup}
          loading={loadingProfile}    
          selectUser={selectUser}
        />
      } 
    />
  )
}

export default DiscoverPage