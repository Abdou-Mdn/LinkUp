import React, { useRef, useState, useEffect } from 'react'
import ResponsiveLayout from '../components/layout/ResponsiveLayout'
import { Ghost, Plus } from 'lucide-react';
import CreateGroupModal from '../components/layout/CreateGroupModal';
import { getAdminGroups, getFriendMembers, getGroupDetails, getJoinRequests, getMemberGroups, getMembers, getSentJoinRequests } from '../lib/api/group.api';
import ProfilePreviewSkeleton from '../components/skeleton/ProfilePreviewSkeleton';
import GroupPreview from '../components/previews/GroupPreview';
import { useLayoutStore } from '../store/layout.store';
import MobileHeader from '../components/layout/MobileHeader';
import GroupProfile from '../components/main/GroupProfile';
import RequestPreviewSkeleton from '../components/skeleton/RequestPreviewSkeleton';
import SentJoinRequestPreview from '../components/previews/SentJoinRequestPreview';

const Aside = ({
  activeTab, setActiveTab, view, setView, setIsModalActive,
  memberGroups, adminGroups, requests, setRequests, loadMore, loading, loadingMore,
  selectGroup, setGroup
}) => {

  const memberLoaderRef = useRef(null);
  const adminLoaderRef = useRef(null);
  const requestLoaderRef = useRef(null);

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

    const target = activeTab == "requests" ? requestLoaderRef.current : view == "member" ? memberLoaderRef.current : adminLoaderRef.current;
    if(target) observer.observe(target);

    return () => observer.disconnect();
  }, [view, activeTab, loading, loadingMore]);

  const onCancelRequest = (group) => {
    setGroup(group);
    setRequests(prev => prev.filter(r => r.groupID !== group.groupID));
  }

  return (
    <div className='w-full h-screen flex flex-col items-center
    bg-light-200 text-light-txt dark:bg-dark-200 dark:text-dark-txt'>
      {/* tabs */}
      <div className='flex items-center justify-between w-full gap-1'>
        <div title='Groups' className={`flex-1 py-3 text-sm font-outfit font-medium text-center cursor-pointer border-b-2
          ${activeTab == "groups" ? 'text-primary border-primary border-b-4' : 
            'text-light-txt dark:text-dark-txt border-light-txt dark:border-dark-txt hover:text-light-txt2 dark:hover:text-dark-txt2 hover:border-light-txt2 dark:hover:border-dark-txt2'
          }`}
          onClick={() => setActiveTab("groups")}
        >
          Groups
        </div>
        <div title='Sent Requests' className={`flex-1 py-3 text-sm font-outfit font-medium text-center cursor-pointer border-b-2 truncate
          ${activeTab == "requests" ? 'text-primary border-primary border-b-4' : 
            'text-light-txt dark:text-dark-txt border-light-txt dark:border-dark-txt hover:text-light-txt2 dark:hover:text-dark-txt2 hover:border-light-txt2 dark:hover:border-dark-txt2'
          }`}
          onClick={() => setActiveTab("requests")}
        >
          Sent Requests
        </div>
      </div>

      {/* content */}
      {/* Groups tab */}
      {
        activeTab == "groups" && (
          <div className='w-full flex-1 px-2 flex flex-col overflow-y-scroll'> 
            <button onClick={() => setIsModalActive(true)}
              className='flex items-center justify-center gap-2 p-2 w-fit self-end border-b-2 mb-2 cursor-pointer border-transparent hover:text-secondary hover:border-secondary
            '>
              <Plus className='size-6' />
              Create New Group
            </button>
            <div className={`flex-col px-2 pb-2 ${view == "admin" ? 'hidden' : 'flex'}`}>
              <div className='flex items-center justify-between w-full mb-2'>
                <span className='text-lg font-outfit font-semibold' >Groups I'm member of</span>
                <button className='px-1 text-sm cursor-pointer text-secondary hover:underline' 
                  onClick={() => {
                  view == "both" ? setView("member") : setView("both");
                  }}
                >
                  { view == "both" ? 'View More' : 'View Less' }
                </button>
              </div>
              {
                loading ? (
                  Array.from({ length: 3 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                ) : memberGroups.length == 0 ? ( 
                  <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                    <Ghost className='size-6' />
                    No groups found 
                  </div> 
                ) : 
                  <ul>
                    {
                      view == "both" ? 
                      memberGroups.slice(0,3).map(group => <GroupPreview key={group.groupID} group={group} onClick={selectGroup}/>) :
                      memberGroups.map(group => <GroupPreview key={group.groupID} group={group} onClick={selectGroup}/>) 
                    }
                    {
                      loadingMore && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                    }
                    {
                      view == "member" && <div ref={memberLoaderRef}></div>
                    }
                  </ul>
              }
            </div>

            <div className={`flex-col px-2 pb-2 ${view == "member" ? 'hidden' : 'flex'}`}>
              <div className='flex items-center justify-between w-full mb-2'>
                <span className='text-lg font-outfit font-semibold' >Groups I'm admin of</span>
                <button className='px-1 text-sm cursor-pointer text-secondary hover:underline' 
                  onClick={() => {
                  view == "both" ? setView("admin") : setView("both");
                  }}
                >
                  { view == "both" ? 'View More' : 'View Less' }
                </button>
              </div>
              {
                loading ? (
                  Array.from({ length: 3 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                ) : adminGroups.length == 0 ? ( 
                  <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                    <Ghost className='size-6' />
                    No groups found 
                  </div> 
                ) : 
                  <ul>
                    {
                      view == "both" ? 
                      adminGroups.slice(0,3).map(group => <GroupPreview key={group.groupID} group={group} onClick={selectGroup}/>) :
                      adminGroups.map(group => <GroupPreview key={group.groupID} group={group} onClick={selectGroup}/>) 
                    }
                    {
                      loadingMore && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                    }
                    {
                      view == "admin" && <div ref={adminLoaderRef}></div>
                    }
                  </ul>
              }
            </div>
          </div>
        )
      }
      {
        activeTab == "requests" && (
          <div className='w-full flex-1 px-2 overflow-y-scroll'>
            {
              loading ? (
                  Array.from({ length: 7 }).map((_, i) => <RequestPreviewSkeleton key={i} isSent={true} />)
                ) : requests.length == 0 ? ( 
                  <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                    <Ghost className='size-6' />
                    No pending requests 
                  </div> 
                ) : 
                  <ul>
                    {
                      requests.map(r => <SentJoinRequestPreview key={r.groupID} request={r} onClick={selectGroup} onCancel={onCancelRequest} />)
                    }
                    {
                      loadingMore && Array.from({ length: 2 }).map((_, i) => <RequestPreviewSkeleton key={i} isSent={true} />)
                    }
                    {
                      <div ref={requestLoaderRef}></div>
                    }
                  </ul>
            }
          </div>
        )
      }
    </div>
  )
}

const Main = ({
  group, setGroup, loading, friendMembers,
  members, setMembers, loadMoreMembers, loadingMoreMembers,
  joinRequests, setJoinRequests, loadMoreJoinRequests, loadingMoreJoinRequests,
  updateAdminGroups, updateMemberGroups, updateSentRequests 
}) => {
  return (
    <div className='min-h-screen w-full'>
      <MobileHeader title="Group" />
      {
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
          <div className='w-full h-screen flex flex-col items-center justify-center gap-2'>
            <img src="/assets/profile-interface.svg" className='w-[45%]' />
            <span className='text-xl font-outfit text-light-txt dark:text-dark-txt'> Select a group to view their profile!</span>
          </div>
        )
      }
    </div>
  )
}

function GroupsPage() {
  const { setMainActive } = useLayoutStore();

  const [activeTab, setActiveTab] = useState("groups");
  const [view, setView] = useState("both");

  const [isModalActive, setIsModalActive] = useState(false); 

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [memberGroups, setMemberGroups] = useState([]);
  const [adminGroups, setAdminGroups] = useState([]);
  const [requests, setRequests] = useState([]);

  const [memberPage, setMemberPage] = useState(1);
  const [adminPage, setAdminPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const [hasMoreMember, setHasMoreMember] = useState(false);
  const [hasMoreAdmin, setHasMoreAdmin] = useState(false);
  const [hasMoreRequests, setHasMoreRequests] = useState(false);

  const limit = 10;


  const [loadingProfile, setLoadingProfile] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [friendMembers, setFriendMembers] = useState([]);
  const [members, setMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);

  const [membersPage, setMembersPage] = useState(1);
  const [joinRequestsPage, setJoinRequestsPage] = useState(1);
  const [hasMoreMembers, setHasMoreMembers] = useState(false);
  const [hasMoreJoinRequests, setHasMoreJoinRequests] = useState(false);
  const [loadingMoreMembers, setLoadingMoreMembers] = useState(false);
  const [loadingMoreJoinRequests, setLoadingMoreJoinRequests] = useState(false);
  

  const fetchData = async (reset = false) => {
    try {
      let memberRes, adminRes, requestRes;

      if(activeTab == "groups") {
        if(reset) {
          [ memberRes, adminRes ] = await Promise.all([
            getMemberGroups(reset, memberPage, limit),
            getAdminGroups(reset, adminPage, limit)
          ]);
        } else {
          if(view == "member" && hasMoreMember) {
            memberRes = await getMemberGroups(reset, memberPage, limit);
          } else if (view == "admin" && hasMoreAdmin) {
            adminRes = await getAdminGroups(reset, adminPage, limit);
          }
        }
      } else if (activeTab == "requests") {
        if(reset || hasMoreRequests) {
          requestRes = await getSentJoinRequests(reset, requestPage, limit);
        }
      }
      
      if(memberRes?.groups) {
        const newGroups = memberRes.groups;
        const totalPages = memberRes.totalPages

        setMemberGroups(prev => reset ? newGroups : [...prev, ...newGroups]);
        setHasMoreMember((reset ? 1 : memberPage) < totalPages);
        setMemberPage(reset ? 2 : memberPage + 1);
      }

      if(adminRes?.groups) {
        const newGroups = adminRes.groups;
        const totalPages = adminRes.totalPages

        setAdminGroups(prev => reset ? newGroups : [...prev, ...newGroups]);
        setHasMoreAdmin((reset ? 1 : adminPage) < totalPages);
        setAdminPage(reset ? 2 : adminPage + 1);
      }

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

  useEffect(() => {
    setLoading(true);
    fetchData(true);
  },[view, activeTab]);

  const loadMore = async () => {
    if(!loading && !loadingMore) {
      setLoadingMore(true);
      fetchData(false)
    }
  }

  const selectGroup = async (groupID) => {
    setLoadingProfile(true);
    setSelectedGroup(groupID);
    setMainActive(true); 
    try {
      const [res, mut, mem, req] = await Promise.all([
        getGroupDetails(groupID),
        getFriendMembers(groupID),
        getMembers(groupID, true, membersPage, limit),
        getJoinRequests(groupID, true, joinRequestsPage, limit),
      ]);
      
      if(mem?.members) {
        const totalPages = mem.totalPages;

        setMembers(mem.members);
        setHasMoreMembers(membersPage < totalPages);
        setMembersPage(2);
      }

      if(req?.requests) {
        const totalPages = req.totalPages;

        setJoinRequests(req.requests);
        setHasMoreJoinRequests(joinRequestsPage < totalPages);
        setJoinRequestsPage(2);
      }

      if(mut?.members) {
        setFriendMembers(mut.members);
      }

      if(res) {
        setSelectedGroup(res);
      } else {
        setSelectedGroup(null);
        setMainActive(false)
      }
    } catch (error) {
      console.error("Error fetching group:", error);
    } finally {
      setLoadingProfile(false);
    }
  }

  const loadMoreMembers = async (groupID) => {
    if(loadingMoreMembers || !hasMoreMembers) return;
    setLoadingMoreMembers(true);
    const res = await getMembers(groupID, false, membersPage, limit);

    if(res?.members) {
      const newMembers = res.members;
      const totalPages = res.totalPages

      setMembers(prev => [...prev, ...newMembers]);
      setHasMoreMembers(membersPage < totalPages);
      setMembersPage(membersPage + 1);
    }

    setLoadingMoreMembers(false);
  }

  const loadMoreJoinRequests = async (groupID) => {
    if(loadingMoreJoinRequests || !hasMoreJoinRequests) return;
    setLoadingMoreJoinRequests(true);
    const res = await getJoinRequests(groupID, false, joinRequestsPage, limit);

    if(res?.requests) {
      const newRequests = res.requests;
      const totalPages = res.totalPages

      setJoinRequests(prev => [...prev, ...newRequests]);
      setHasMoreJoinRequests(joinRequestsPage < totalPages);
      setJoinRequestsPage(joinRequestsPage + 1);
    }

    setLoadingMoreJoinRequests(false);
  }

  return (
    <>
      <ResponsiveLayout 
        aside={
          <Aside 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
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
      {isModalActive && <CreateGroupModal onClose={() => setIsModalActive(false)} />}
    </>
  )
}

export default GroupsPage