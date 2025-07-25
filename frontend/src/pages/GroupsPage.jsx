import React, { useState } from 'react'
import ResponsiveLayout from '../components/layout/ResponsiveLayout'
import { Ghost, Plus } from 'lucide-react';
import CreateGroupModal from '../components/layout/CreateGroupModal';
import { getAdminGroups, getMemberGroups, getSentJoinRequests } from '../lib/api/group.api';
import { useEffect } from 'react';
import ProfilePreviewSkeleton from '../components/skeleton/ProfilePreviewSkeleton';
import GroupPreview from '../components/previews/GroupPreview';

const Aside = ({
  activeTab, setActiveTab, view, setView, setIsModalActive,
  memberGroups, adminGroups, requests, loading, loadingMore
}) => {
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
                      memberGroups.slice(0,3).map(group => <GroupPreview key={group.groupID} group={group}/>) :
                      memberGroups.map(group => <GroupPreview key={group.groupID} group={group}/>) 
                    }
                    {
                      loadingMore && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
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
                      adminGroups.slice(0,3).map(group => <GroupPreview key={group.groupID} group={group}/>) :
                      adminGroups.map(group => <GroupPreview key={group.groupID} group={group}/>) 
                    }
                    {
                      loadingMore && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                    }
                  </ul>
              }
            </div>
          </div>
        )
      }
      {
        activeTab == "requests" && (
          <div className='bg-secondary w-full flex-1 px-2 overflow-y-scroll'> requests</div>
        )
      }
    </div>
  )
}

const Main = () => {
  return <div>Main</div>
}

function GroupsPage() {
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


  const fetchData = async (reset = false) => {
    try {
      let memberRes, adminRes, requestRes;

      if(activeTab == "groups") {
        if(reset) {
          memberRes = await getMemberGroups(reset, memberPage, limit);
          adminRes = await getAdminGroups(reset, adminPage, limit);
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

      console.log(memberRes);
      console.log(adminRes);
      console.log(requestRes);
      
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
            loading={loading}
            loadingMore={loadingMore}
          />
        }

        main={
          <Main />
        }
      />
      {isModalActive && <CreateGroupModal onClose={() => setIsModalActive(false)} />}
    </>
  )
}

export default GroupsPage