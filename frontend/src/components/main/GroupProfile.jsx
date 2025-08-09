import React, { useEffect, useRef, useState } from 'react'
import ProfileSkeleton from '../skeleton/ProfileSkeleton'
import { useAuthStore } from '../../store/auth.store'
import { CalendarCheck, Clock, Ghost, Handshake, Hourglass, TriangleAlert, UserPlus, Users } from 'lucide-react'
import { formatDateWithSuffix } from '../../lib/util/timeFormat'
import GroupButtons from '../GroupButtons'
import MemberPreview from '../previews/MemberPreview'
import JoinRequestPreview from '../previews/JoinRequestPreview'
import TertiaryButton from '../TertiaryButton'
import EditGroupModal from '../layout/EditGroupModal'
import ProfilePreviewSkeleton from '../skeleton/ProfilePreviewSkeleton'
import RequestPreviewSkeleton from '../skeleton/RequestPreviewSkeleton'
import AddMemberModal from '../layout/AddMemberModal'
import toast from 'react-hot-toast'

const GroupProfile = ({ 
    group, setGroup, loading, friendMembers, 
    members, setMembers, loadMoreMembers, loadingMoreMembers, 
    requests, setRequests, loadMoreRequests, loadingMoreRequests,
    updateList, updateAdminGroups, updateMemberGroups, updateRequestList
  }) => {
  if(loading || !group) {
    return  <ProfileSkeleton />
  }

  const { authUser } = useAuthStore();

  const isAdmin = group.admins.includes(authUser.userID);
  const isMember = group.members.some(m => m.user == authUser.userID);

  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);

  const membersLoaderRef = useRef(null);
  const requestsLoaderRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if(entries[0].isIntersecting) {
          loadMoreMembers();
        }
      }, 
      {
        threshold: 1.0
      }
    );

    const target = membersLoaderRef.current;
    if(target) observer.observe(target);

    return () => observer.disconnect();
  }, [membersLoaderRef.current]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if(entries[0].isIntersecting) {
          loadMoreRequests();
        }
      }, 
      {
        threshold: 1.0
      }
    );

    const target = requestsLoaderRef.current;
    if(target) observer.observe(target);

    return () => observer.disconnect();
  }, [requestsLoaderRef.current]);

  const onJoin = (group, request) => {
    setGroup(group);
    if(updateRequestList) {
      updateRequestList(prev => [...prev, request]);
    }
  }

  const onCancelRequest = (group) => {
    setGroup(group);
    if(updateRequestList) {
      updateRequestList(prev => prev.filter(r => r.groupID !== group.groupID));
    }
  }

  const onLeave = (group, groupID) => {
    setGroup(group);
    if(!group) toast('Group and all related data are deleted', { icon: <TriangleAlert className='size-6 text-danger' />});
    if(updateList) {
      if(group) {
        updateList(prev => prev.map(g => g.groupID == groupID ? group : g))
      } else {
        updateList(prev => prev.filter(g => g.groupID !== groupID))
      }
    }
    if(isAdmin && updateAdminGroups) {
      updateAdminGroups(prev => prev.filter(g => g.groupID !== groupID));
    }
    if(isMember && updateMemberGroups) {
      updateMemberGroups(prev => prev.filter(g => g.groupID !== groupID));
    }
  }

  const onAddMembers = (group, addedUsers) => {
    setGroup(group);
    if(updateList) {
      updateList(prev => prev.map(g => g.groupID == group.groupID ? group : g));
    }
    if(updateAdminGroups) {
      updateAdminGroups(prev => prev.map(g => g.groupID == group.groupID ? group : g));
    }
    if(updateMemberGroups) {
      updateMemberGroups(prev => prev.map(g => g.groupID == group.groupID ? group : g));
    }

    setMembers(prev => [...prev, ...addedUsers]);
  }

  const onRemoveMember = (group, userID) => {
    setGroup(group);
    if(updateList) {
      updateList(prev => prev.map(g => g.groupID == group.groupID ? group : g));
    }
    if(updateAdminGroups) {
      updateAdminGroups(prev => prev.map(g => g.groupID == group.groupID ? group : g));
    }
    if(updateMemberGroups) {
      updateMemberGroups(prev => prev.map(g => g.groupID == group.groupID ? group : g));
    }

    setMembers(prev => prev.filter(m => m.userID !== userID));
  }

  const onPromoteToAdmin = (group) => {
    setGroup(group)
  }

  const onDemoteFromAdmin = (group) => {
    setGroup(group)
  }

  
  const onAcceptRequest = (group, addedUser) => {
    setGroup(group);
    if(updateList) {
      updateList(prev => prev.map(g => g.groupID == group.groupID ? group : g));
    }
    if(updateAdminGroups) {
      updateAdminGroups(prev => prev.map(g => g.groupID == group.groupID ? group : g));
    }
    if(updateMemberGroups) {
      updateMemberGroups(prev => prev.map(g => g.groupID == group.groupID ? group : g));
    }

    setRequests(prev => prev.filter(r => r.userID !== addedUser.userID));
    setMembers(prev => [...prev, addedUser]);
  }

  const onDeclineRequest = (group, userID) => {
    setGroup(group);
    setRequests(prev => prev.filter(r => r.userID !== userID));
  }

  return (
    <>
      <div className='size-full bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'>
        {/* pictures */}
        <div className='w-full h-[270px] relative'>
          {/* banner image */}
          {
            group.banner ? <img src={group.banner} className='w-full h-[200px] object-cover' /> :
            <div className='w-full h-[200px] bg-light-300 dark:bg-dark-300'></div> 
          }
          {/* group image */}
          <img src={group.image ? group.image : "/assets/group-avatar.svg"} className='size-[150px] rounded-[50%] absolute left-8 bottom-0 border-4 border-light-100 dark:border-dark-100' />
        </div>
        {/* main infos */}
        <div className='w-full p-3 mb-2 lg:pl-10 relative'>
          <span className='text-2xl font-bold'>{group.name}</span>
          {/* action buttons */}
          <GroupButtons 
            group={group} 
            openEdit={() => setEditModal(true)}
            onJoin={onJoin}
            onCancelRequest={onCancelRequest}
            onLeave={onLeave}
          />
          <p className='mt-1 text-light-txt2 dark:text-dark-txt2 w-[75%] min-w-[350px]'>{group.description}</p>
        </div>
        {/* additional infos */}
        <div className='w-full p-2'>
          <div className='flex flex-col gap-2 w-full lg:w-1/2'>
            {/* informations */}
            <div className='w-full pl-3 lg:pl-8'>
              <p className='flex gap-2 py-2'>
                <CalendarCheck className='size-6' />
                Created : {formatDateWithSuffix(group.createdAt)}
              </p>
              { !isMember &&
                <p className='flex gap-2 py-2'>
                  <Users className='size-6' />
                  Members: {group.members.length}
                </p>
              }
            </div>
            {/* friend members */}
            {
              !isMember && !isAdmin && friendMembers?.length > 0 && (
                <div className='w-full flex flex-col px-3 lg:px-8 max-h-[450px]'>
                  <div className='flex gap-2 items-center justify-between py-2'>
                    <p className='flex gap-2 items-center'>
                      <Handshake className='size-6' />
                      Connected members
                    </p>
                    <span>
                      {friendMembers.length}
                    </span>
                  </div>
                  <ul className='bg-light-200 dark:bg-dark-200 h-full overflow-y-scroll'>
                    {
                      friendMembers.map(m => {
                        const admin = group.admins.includes(m.userID);

                        return (
                          <MemberPreview 
                            key={m.userID}
                            member={m}
                            isAdmin={admin}
                            displayControls={false}
                          />
                        )
                      })
                    }
                  </ul>
                </div>
              )
            }
          </div>
          {/* lists */}
          <div className='w-full flex flex-col lg:flex-row gap-2'>
            {/* members */}
            {
              (isMember || isAdmin) && members?.length > 0 && (
                <div className='w-full flex flex-col px-3 lg:pl-8 lg:pr-2 max-h-[450px] lg:w-1/2'>
                  <div className='flex gap-2 items-center justify-between py-2'>
                    <p className='flex gap-2 items-center'>
                      <Users className='size-6' />
                      Members :
                      <span>
                        {members.length}
                      </span>
                    </p>
                    <TertiaryButton 
                      text={isAdmin ? "Add Member" : "Invite friend"} 
                      leftIcon={<UserPlus className='size-5' />} 
                      className='py-1 px-2'
                      onClick={() => setAddModal(true)} 
                    />
                  </div>
                  <ul className='bg-light-200 dark:bg-dark-200 h-full overflow-y-scroll'>
                    {
                      members.map(m => {
                        const admin = group.admins.includes(m.userID);
                        const friend = authUser.friends.some(f => f.user == m.userID)
                        return (
                          <MemberPreview 
                            key={m.userID}
                            member={m}
                            groupID={group.groupID}
                            isAdmin={admin}
                            isFriend={friend}
                            displayControls={isAdmin}
                            onRemove={onRemoveMember}
                            onPromote={onPromoteToAdmin}
                            onDemote={onDemoteFromAdmin}
                          />
                        )
                      })
                    }
                    {
                      loadingMoreMembers && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                    }
                    { 
                      <div ref={membersLoaderRef}></div>
                    }
                  </ul>
                </div>
              )
            }
            {/* join requests */}
            {
              isAdmin && (
                <div className='w-full flex flex-col px-3 lg:px-8 max-h-[450px] lg:w-1/2'>
                  <div className='flex gap-2 items-center justify-between py-3'>
                    <p className='flex gap-2 items-center'>
                      <Hourglass className='size-6' />
                      Pending Requests
                    </p>
                    <span>
                      {requests.length}
                    </span>
                  </div>
                  <ul className='bg-light-200 dark:bg-dark-200 h-full overflow-y-scroll'>
                    {
                      requests.length == 0 ? (
                        <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                          <Ghost className='size-6' />
                          No pending requests 
                        </div> 
                      ) : (
                        requests.map(r => <JoinRequestPreview key={r.userID} request={r} groupID={group.groupID} onAccept={onAcceptRequest} onDecline={onDeclineRequest} />)
                      )
                    }
                    {
                      loadingMoreRequests && Array.from({ length: 2 }).map((_, i) => <RequestPreviewSkeleton key={i} />)
                    }
                    { 
                      <div ref={requestsLoaderRef}></div>
                    }
                  </ul>
                </div>
              )
            }
          </div>  
        </div>
      </div>
      {
        editModal && 
        <EditGroupModal 
          group={group} 
          onClose={() => setEditModal(false)} 
          onUpdate={setGroup} 
          updateList={updateList}
        />
      }
      {
        addModal && 
        <AddMemberModal 
          group={group} 
          requests={requests} 
          isAdmin={isAdmin} 
          onClose={() => setAddModal(false)}
          onAddMembers={onAddMembers}
          onAcceptRequest={onAcceptRequest}
        />
      }
    </>        
  )
}

export default GroupProfile