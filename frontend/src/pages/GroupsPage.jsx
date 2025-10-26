import React, { useRef, useState, useEffect } from 'react'
import { Ghost, Plus } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

import { useLayoutStore } from '../store/layout.store';

import { getAdminGroups, getFriendMembers, getGroupDetails, getJoinRequests, getMemberGroups, getMembers, getSentJoinRequests } from '../lib/api/group.api';

import ResponsiveLayout from '../components/layout/ResponsiveLayout'
import MobileHeader from '../components/layout/MobileHeader';
import GroupProfile from '../components/main/GroupProfile';
import ProfilePreviewSkeleton from '../components/skeleton/ProfilePreviewSkeleton';
import GroupPreview from '../components/previews/GroupPreview';
import RequestPreviewSkeleton from '../components/skeleton/RequestPreviewSkeleton';
import SentJoinRequestPreview from '../components/previews/SentJoinRequestPreview';
import TertiaryButton from '../components/TertiaryButton';
import CreateGroupModal from '../components/layout/CreateGroupModal';
import TabNavigation from '../components/TabNavigation';
import TabSections from '../components/TabSections';

/* 
 * Aside component
 * displays a sidebar with two tabs Groups, Sent join requests

 * - Groups: displays a button to create a new group, two lists (groups i'm admin of & groups i'm member of) both are expandable
 * - Sent requests: displays the list of sent join requests
 * - all lists have infinite scroll
 
 * params:
 * - activeTab: state controls which tab is currently active
 * - setActiveTab: setter to update the active tab
 * - view: state controls which view is open (admin groups, member groups, or both)
 * - setView: setter to update the open view
 * - setIsModalActive: setter to update the create group modal visibility
 * - memberGroups: list of groups i'm only member of to display
 * - adminGroups: list of groups i'm admin of to display
 * - requests: list of sent join requests to display
 * - setRequests: update sent join requests list (after caneling a request)
 * - loadMore: function to load more data (groups/requests) based on active tab
 * - loading: initial loading state
 * - loadingMore: loading more state
 * - selectedGroup: currently selected group
 * - setGroup: update group profile
 * - selectGroup: open a group profile to display on main
*/
const Aside = ({
  tabs, activeTab, onTabChange, direction, view, setView, setIsModalActive,
  memberGroups, adminGroups, requests, setRequests, loadMore, loading, loadingMore,
  selectedGroup, selectGroup, setGroup
}) => {
  // loader refs
  const memberLoaderRef = useRef(null);
  const adminLoaderRef = useRef(null);
  const requestLoaderRef = useRef(null);

  // setup IntersectionObserver for infinite scroll
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

    // select loader to which we attach the observer
    const target = activeTab == 2 ? requestLoaderRef.current : view == "member" ? memberLoaderRef.current : adminLoaderRef.current;
    if(target) observer.observe(target);

    return () => observer.disconnect();
  }, [view, activeTab, loading, loadingMore]);

  // update sent requests afetr canceling a request
  const onCancelRequest = (group) => {
    setRequests(prev => prev.filter(r => r.groupID !== group.groupID));
    if(selectedGroup?.groupID == group.groupID) setGroup(group);
  }

  return (
    <div className='w-full h-screen flex flex-col items-center
    bg-light-200 text-light-txt dark:bg-dark-200 dark:text-dark-txt'>
      {/* tabs */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* sections */}
      <TabSections activeTab={activeTab} direction={direction}>
        {/* groups section */}
        <div tabID={1} className='w-full flex-1 px-2 flex flex-col'>
          {/* create group button (opens modal) */}
          <TertiaryButton
            leftIcon={<Plus className='size-5 lg:size-6' />}
            text="Create Group"
            className='py-2 px-3 w-fit text-sm lg:text-[16px] my-2 self-end'
            onClick={() => setIsModalActive(true)}
          /> 
          {/* lists */}
          <div className='flex-1 w-full flex flex-col'>
            {/* member groups list */}
            <div className={`flex-col px-2 pb-2 transition-all ease-in-out overflow-hidden ${view == "admin" ? 'h-0 opacity-0' : view === "member" ? 'h-full' : 'h-1/2'}`}>
              <div className='flex items-center justify-between w-full mb-2'>
                {/* title */}
                <span className='text-lg font-outfit font-semibold' >Groups I'm member of</span>
                {/* view more/less button */}
                <button 
                  className='px-1 text-sm cursor-pointer text-primary hover:text-secondary hover:underline' 
                  onClick={() => view == "both" ? setView("member") : setView("both")}
                >
                  { view == "both" ? 'View More' : 'View Less' }
                </button>
              </div>
              {
                // display skeletons while loading groups
                loading ? (
                  Array.from({ length: 3 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                ) : memberGroups.length == 0 ? ( 
                  // empty member groups list
                  <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                    <Ghost className='size-6' />
                    No groups found 
                  </div> 
                ) : 
                <ul className='overflow-y-auto scrollbar'>
                  {
                    // display only 4, whole list if expanded
                    view == "both" ? 
                    memberGroups.slice(0,3).map(group => <GroupPreview key={group.groupID} group={group} onSelect={selectGroup} isSelected={selectedGroup?.groupID === group.groupID}/>) :
                    memberGroups.map(group => <GroupPreview key={group.groupID} group={group} onSelect={selectGroup} isSelected={selectedGroup?.groupID === group.groupID}/>) 
                  }
                  {
                    // display skeletons while loading more member groups
                    loadingMore && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                  }
                  {
                    // sentinal div for loading more member groups
                    view == "member" && <div ref={memberLoaderRef}></div>
                  }
                </ul>
              }
            </div>

            {/* admin groups list */}
            <div className={`flex-col px-2 pb-2 transition-all ease-in-out overflow-hidden ${view == "member" ? 'h-0 opacity-0' : view === "admin" ? 'h-full' : 'h-1/2'}`}>
              <div className='flex items-center justify-between w-full mb-2'>
                {/* title */}
                <span className='text-lg font-outfit font-semibold' >Groups I'm admin of</span>
                {/* view more/less button */}
                <button 
                  className='px-1 text-sm cursor-pointer text-primary hover:text-secondary hover:underline' 
                  onClick={() => view == "both" ? setView("admin") : setView("both")}
                >
                  { view == "both" ? 'View More' : 'View Less' }
                </button>
              </div>
              {
                // display skeletons while loading groups
                loading ? (
                  Array.from({ length: 3 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                ) : adminGroups.length == 0 ? ( 
                  // empty admin groups list
                  <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                    <Ghost className='size-6' />
                    No groups found 
                  </div> 
                ) : 
                <ul className='overflow-y-auto scrollbar'>
                  {
                    // display only 4, or whole list if expanded
                    view == "both" ? 
                    adminGroups.slice(0,3).map(group => <GroupPreview key={group.groupID} group={group} onSelect={selectGroup} isSelected={selectedGroup?.groupID === group.groupID}/>) :
                    adminGroups.map(group => <GroupPreview key={group.groupID} group={group} onSelect={selectGroup} isSelected={selectedGroup?.groupID === group.groupID}/>) 
                  }
                  {
                    // display skeletons while loading more admin groups
                    loadingMore && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                  }
                  {
                    //  sentinal div for loading more admin groups
                    view == "admin" && <div ref={adminLoaderRef}></div>
                  }
                </ul>
              }
            </div>
          </div>
        </div>

        {/* sent join requests section */}  
        <div tabID={2} className='w-full flex-1 px-2 overflow-y-auto scrollbar'>
            {
              // display skeletons while laoding requests
              loading ? (
                Array.from({ length: 7 }).map((_, i) => <RequestPreviewSkeleton key={i} isSent={true} />)
              ) : requests.length == 0 ? ( 
                // empty requests list
                <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                  <Ghost className='size-6' />
                  No pending requests 
                </div> 
              ) : 
              <ul>
                {
                  // display sent requests
                  requests.map(req => <SentJoinRequestPreview key={req.groupID} request={req} onSelect={selectGroup} onCancel={onCancelRequest} isSelected={selectedGroup?.groupID === req.groupID} />)
                }
                {
                  // display skeletons while loading more requests
                  loadingMore && Array.from({ length: 2 }).map((_, i) => <RequestPreviewSkeleton key={i} isSent={true} />)
                }
                {
                  //  sentinal div for loading more requests
                  <div ref={requestLoaderRef}></div>
                }
              </ul>
            }
          </div>
      </TabSections>
    </div>
  )
}

/* 
 * Main component
 * Main panel that displays the group profile .
 * If nothing is selected, shows a placeholder illustration + message.
 * Displays MobileHeader with the title group when main is open with a go back to aside button (only on mobile) 

 * params:
 * - group, setGroup, friendMembers: group profile display, passed down as props (GroupProfile)
 * - members, setMembers, loadMoreMembers, loadingMoreMembers: group members list, passed down as props (GroupProfile)
 * - joinRequests, setRequests, loadMoreRequests, loadingMoreRequests: group received join requests list, passed down as props (GroupProfile)
 * - loading: loading profile state, passed down to GroupProfile
 * - updateAdminGroups, updateMemberGroups, updateSentRequests: update lists in aside passed down as props
*/
const Main = ({
  group, setGroup, loading, friendMembers,
  members, setMembers, loadMoreMembers, loadingMoreMembers,
  joinRequests, setJoinRequests, loadMoreJoinRequests, loadingMoreJoinRequests,
  updateAdminGroups, updateMemberGroups, updateSentRequests 
}) => {
  return (
    <div className='h-screen w-full overflow-y-auto scrollbar bg-light-100 dark:bg-dark-100'>
      {/* mobile header */}
      <MobileHeader title="Group" />
      {
        // display group if selected
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
            setRequests={setJoinRequests}
            loadMoreRequests={loadMoreJoinRequests}  
            loadingMoreRequests={loadingMoreJoinRequests} 
            updateAdminGroups={updateAdminGroups}
            updateMemberGroups={updateMemberGroups}
            updateRequestList={updateSentRequests}
          />
        ) : (
          // display placeholder if not
          <div className='w-full h-screen flex flex-col items-center justify-center gap-2'>
            <img src="/assets/profile-interface.svg" className='w-[45%]' />
            <span className='text-xl font-outfit text-light-txt dark:text-dark-txt'> Select a group to view their profile!</span>
          </div>
        )
      }
    </div>
  )
}

/* 
 * Groups Page
 * used to check my groups (member/admin) and sent join requests 
 * consists of an aside with two tabs and a main for displaying the group profiles

 * Integrates with API functions:
 * - `getAdminGroups`, `getFriendMembers`, `getGroupDetails`, `getJoinRequests`, `getMemberGroups`, `getMembers`, `getSentJoinRequests`
*/
function GroupsPage() {
  const { setMainActive } = useLayoutStore();

  /* -------- aside states -------- */
  const [activeTab, setActiveTab] = useState(1); // active tab control state: 1:"groups" || 2:"sent join requests"
  const tabs = [
    { id: 1, label: "My Groups"},
    { id: 2, label: "Sent Requests"},
  ];
  const [view, setView] = useState("both"); // active view more control state: "both" || "member" || "admin"

  // create group modal visibility
  const [isModalActive, setIsModalActive] = useState(false); 

  const [loading, setLoading] = useState(false); // initial loading state
  const [loadingMore, setLoadingMore] = useState(false); // loading more state

  // member groups list states (pagination)
  const [memberGroups, setMemberGroups] = useState([]);
  const [memberPage, setMemberPage] = useState(1);
  const [hasMoreMember, setHasMoreMember] = useState(false);
  
  // admin groups list states (pagination)
  const [adminGroups, setAdminGroups] = useState([]);
  const [adminPage, setAdminPage] = useState(1);
  const [hasMoreAdmin, setHasMoreAdmin] = useState(false);
  
  // sent join requests list states (pagination)
  const [requests, setRequests] = useState([]);
  const [requestPage, setRequestPage] = useState(1);
  const [hasMoreRequests, setHasMoreRequests] = useState(false);

  const limit = 10; // items per page

  // framer motion animation states
  const [direction, setDirection] = useState(0);

  const handleTabChange = (newTab) => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    const newIndex = tabs.findIndex(t => t.id === newTab);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
  }

  /* -------- main states -------- */
  const [loadingProfile, setLoadingProfile] = useState(false); // laoding profile state
  const [selectedGroup, setSelectedGroup] = useState(null); // currently selected group 
  const [friendMembers, setFriendMembers] = useState([]); // list of members that are friends of auth user
  
  // group members list (pagination)
  const [members, setMembers] = useState([]);
  const [membersPage, setMembersPage] = useState(1);
  const [hasMoreMembers, setHasMoreMembers] = useState(false);
  const [loadingMoreMembers, setLoadingMoreMembers] = useState(false);
  
  // group received join requests list (pagination)
  const [joinRequests, setJoinRequests] = useState([]);
  const [joinRequestsPage, setJoinRequestsPage] = useState(1);
  const [hasMoreJoinRequests, setHasMoreJoinRequests] = useState(false);
  const [loadingMoreJoinRequests, setLoadingMoreJoinRequests] = useState(false);
  

  /* -------- aside data fetching -------- */

  // get groups or requests from backend 
  const fetchData = async (reset = false) => {
    try {
      let memberRes, adminRes, requestRes;

      // get groups if active tab is groups
      if(activeTab == 1) {
        if(reset) {
          // get both member groups and admin groups (on parallel) if resseting 
          [ memberRes, adminRes ] = await Promise.all([
            getMemberGroups(reset, memberPage, limit),
            getAdminGroups(reset, adminPage, limit)
          ]);
        } else {
          // get groups based on open view
          if(view == "member" && hasMoreMember) {
            memberRes = await getMemberGroups(reset, memberPage, limit);
          } else if (view == "admin" && hasMoreAdmin) {
            adminRes = await getAdminGroups(reset, adminPage, limit);
          }
        }
      } else if (activeTab == 2) {
        // get sent join requests if active tab is requests
        if(reset || hasMoreRequests) {
          requestRes = await getSentJoinRequests(reset, requestPage, limit);
        }
      }
      
      // handle member groups result
      if(memberRes?.groups) {
        const newGroups = memberRes.groups;
        const totalPages = memberRes.totalPages

        setMemberGroups(prev => reset ? newGroups : [...prev, ...newGroups]);
        setHasMoreMember((reset ? 1 : memberPage) < totalPages);
        setMemberPage(reset ? 2 : memberPage + 1);
      }

      // handle admin groups result
      if(adminRes?.groups) {
        const newGroups = adminRes.groups;
        const totalPages = adminRes.totalPages

        setAdminGroups(prev => reset ? newGroups : [...prev, ...newGroups]);
        setHasMoreAdmin((reset ? 1 : adminPage) < totalPages);
        setAdminPage(reset ? 2 : adminPage + 1);
      }

      // handle requests result
      if(requestRes?.requests) {
        const newRequests = requestRes.requests;
        const totalPages = requestRes.totalPages;

        setRequests(prev => reset ? newRequests : [...prev, ...newRequests]);
        setHasMoreRequests((reset ? 1 : requestPage) < totalPages);
        setRequestPage(reset ? 2 : requestPage + 1);
      }

    } catch (error) {
      console.log("error in fetching groups", error);      
    } finally {
      if(reset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }

  // initial load of data
  useEffect(() => {
    setLoading(true);
    fetchData(true);
  },[activeTab]);

  // load more data
  const loadMore = async () => {
    if(!loading && !loadingMore) {
      setLoadingMore(true);
      fetchData(false)
    }
  }

  /* -------- main content fetching -------- */

  // handle display group profile
  const selectGroup = async (groupID) => {
    setLoadingProfile(true);
    setSelectedGroup(groupID); // temporarily store group ID
    setMainActive(true); // open main panel on mobile
    try {
      // get group details, friend members, group members and received join requests on parallel
      const [res, mut, mem, req] = await Promise.all([
        getGroupDetails(groupID),
        getFriendMembers(groupID),
        getMembers(groupID, true, membersPage, limit),
        getJoinRequests(groupID, true, joinRequestsPage, limit),
      ]);
      
      // handle members response
      if(mem?.members) {
        const totalPages = mem.totalPages;

        setMembers(mem.members);
        setHasMoreMembers(membersPage < totalPages);
        setMembersPage(2);
      }

      // handle received requests response
      if(req?.requests) {
        const totalPages = req.totalPages;

        setJoinRequests(req.requests);
        setHasMoreJoinRequests(joinRequestsPage < totalPages);
        setJoinRequestsPage(2);
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

  // load more members of the group
  const loadMoreMembers = async (groupID) => {
    if(loadingMoreMembers || !hasMoreMembers) return; // exit early if there are no more members
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
      console.log("error getting more members", error);
    } finally {
      setLoadingMoreMembers(false);
    }
  }

  // load more received join requests
  const loadMoreJoinRequests = async (groupID) => {
    if(loadingMoreJoinRequests || !hasMoreJoinRequests) return; // exit early if there are no more requests
    setLoadingMoreJoinRequests(true);
    try {
      const res = await getJoinRequests(groupID, false, joinRequestsPage, limit);

      if(res?.requests) {
        const newRequests = res.requests;
        const totalPages = res.totalPages

        setJoinRequests(prev => [...prev, ...newRequests]);
        setHasMoreJoinRequests(joinRequestsPage < totalPages);
        setJoinRequestsPage(joinRequestsPage + 1);
      } 
    } catch (error) {
      console.log("error loading more receied join requests ", error);
    } finally {
      setLoadingMoreJoinRequests(false);
    }
  }

  // update groups list after creating a new group
  const onCreateGroup = (group) => {
    const groups = [...adminGroups]
    groups.push(group);
    setAdminGroups(groups) 
  }

  // layout rendering
  return (
    <>
      <ResponsiveLayout 
        aside={
          <Aside 
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            direction={direction}
            view={view}
            setView={setView}
            setIsModalActive={setIsModalActive}
            memberGroups={memberGroups}
            adminGroups={adminGroups}
            requests={requests}
            setRequests={setRequests}
            loadMore={loadMore}
            loading={loading}
            loadingMore={loadingMore}
            selectedGroup={selectedGroup}
            selectGroup={selectGroup}
            setGroup={setSelectedGroup}
          />
        }

        main={
          <Main 
            group={selectedGroup}
            setGroup={setSelectedGroup}
            loading={loadingProfile}
            friendMembers={friendMembers}
            members={members}
            setMembers={setMembers}
            loadMoreMembers={loadMoreMembers}
            loadingMoreMembers={loadingMoreMembers}
            joinRequests={joinRequests}
            setJoinRequests={setJoinRequests}
            loadMoreJoinRequests={loadMoreJoinRequests}
            loadingMoreJoinRequests={loadingMoreJoinRequests}
            updateMemberGroups={setMemberGroups}
            updateAdminGroups={setAdminGroups}
            updateSentRequests={setRequests}
          />
        }
      />
      <AnimatePresence>
        {isModalActive && <CreateGroupModal onClose={() => setIsModalActive(false)} onCreate={onCreateGroup} />}
      </AnimatePresence>
    </>
  )
}

export default GroupsPage