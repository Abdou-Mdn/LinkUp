import React, { useEffect, useRef, useState } from 'react'
import { CalendarCheck, Clock, Ghost, Handshake, Hourglass, TriangleAlert, UserPlus, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { AnimatePresence } from 'motion/react'

import { useAuthStore } from '../../store/auth.store'

import { formatDateWithSuffix } from '../../lib/util/timeFormat'

import TertiaryButton from '../TertiaryButton'
import GroupButtons from '../GroupButtons'
import MemberPreview from '../previews/MemberPreview'
import JoinRequestPreview from '../previews/JoinRequestPreview'
import AddMemberModal from '../layout/AddMemberModal'
import EditGroupModal from '../layout/EditGroupModal'
import ProfileSkeleton from '../skeleton/ProfileSkeleton'
import ProfilePreviewSkeleton from '../skeleton/ProfilePreviewSkeleton'
import RequestPreviewSkeleton from '../skeleton/RequestPreviewSkeleton'

/* 
 * GroupProfile component
 * Main container for group profiles.

 * - Displays group infos: banner, image, name, description, date the group was created, members count.
 * - Displays action buttons based on user's role (visitor/ member/ admin).
 * - Visitor can see only group infos, connected members (friends), action button (send/cancel join request) .
 * - Member can see group infos, members list, action buttons (open chat, leave group), member can also invite friends to join the group
 * - Admin can see and edit group info, members list, requests list, action buttons (open chat, edit group, leave group), admin can add friends to group
 
 * Uses utility function: `formatDateWithSuffix

 * params:
 * - group: object infos to display
 * - setGroup: setter to update group
 * - loading: loading state
 * - friendMembers: connected members list
 * - members: members list
 * - setMembers: setter to update members list
 * - loadMoreMembers: infinite scroll in members list
 * - loadingMoreMembers: loading state for members list
 * - requests: join requests list
 * - setRequests: setter to update requests list
 * - loadMoreRequests: infinite scroll in requests list
 * - loadingMoreRequests: loading state in requests list
 * - updateList: function to update groups list in discover page
 * - updateAdminGroups: function to update admin groups list in groups page
 * - updateMemberGroups: function to update member groups list in groups page
 * - updateRequestsList: function to update sent join requests list in groups page
*/
const GroupProfile = ({ 
    group, setGroup, loading, friendMembers, 
    members, setMembers, loadMoreMembers, loadingMoreMembers, 
    requests, setRequests, loadMoreRequests, loadingMoreRequests,
    updateList, updateAdminGroups, updateMemberGroups, updateRequestList
  }) => {
  
  // render skeleton while still loading infos
  if(loading || !group) {
    return  <ProfileSkeleton />
  }

  const { authUser } = useAuthStore();

  // check if user is admin
  const isAdmin = group.admins.includes(authUser.userID);
  // check if user is member
  const isMember = group.members.some(m => m.user == authUser.userID);

  // modals visibility states
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);

  // loaders for infinit scroll
  const membersLoaderRef = useRef(null);
  const requestsLoaderRef = useRef(null);

  // set up IntersectionObserver to load more members when loader is vsible 
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

  // set up IntersectionObserver to load more requests when loader is vsible
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

  // handle updates on send join request
  const onJoin = (group, request) => {
    setGroup(group);
    if(updateRequestList) {
      updateRequestList(prev => [...prev, request]);
    }
  }

  // handle updates on cancel join request
  const onCancelRequest = (group) => {
    setGroup(group);
    if(updateRequestList) {
      updateRequestList(prev => prev.filter(r => r.groupID !== group.groupID));
    }
  }

  // handle updates on leave group
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

  // handle updates on add member
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

    setMembers(prev => {
      const newMembers = [...prev, addedUsers];
      return newMembers.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  // handle updates on remove member
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

  // handle updates on promote member to admin
  const onPromoteToAdmin = (group) => {
    setGroup(group)
  }

  // handle updates on demote admin to member
  const onDemoteFromAdmin = (group) => {
    setGroup(group)
  }

  // handle updates on accept join request
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
    setMembers(prev => {
      const newMembers = [...prev, addedUser];
      return newMembers.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  // handle updates on decline join request
  const onDeclineRequest = (group, userID) => {
    setGroup(group);
    setRequests(prev => prev.filter(r => r.userID !== userID));
  }

  // handle updates on update group
  const onUpdate = (group) => {
    setGroup(group);
    if(updateAdminGroups){
      updateAdminGroups(prev => prev.map(g => g.groupID == group.groupID ? group : g));
    }
    if(updateList){
      updateList(prev => prev.map(g => g.groupID == group.groupID ? group : g))
    }
  }

  // handle updates on delete group
  const onDelete = (groupID) => {
    setGroup(null);
    if(updateAdminGroups) {
      updateAdminGroups(prev => prev.filter(g => g.groupID !== groupID));
    }
    if(updateList) {
      updateList(prev => prev.filter(g => g.groupID !== groupID))
    }
  }

  return (
    <>
      <div className='size-full bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'>
        {/* pictures */}
        <div className='w-full h-[190px] lg:h-[270px] relative'>
          {/* banner image */}
          {
            group.banner ? <img src={group.banner} className='w-full h-[140px] lg:h-[200px] object-cover' /> :
            <div className='w-full h-[140px] lg:h-[200px] bg-light-300 dark:bg-dark-300'></div> 
          }
          {/* group image */}
          <img src={group.image ? group.image : "/assets/group-avatar.svg"} className='size-[100px] lg:size-[150px] rounded-full absolute left-4 lg:left-8 bottom-0 border-4 border-light-100 dark:border-dark-100' />
        </div>
        {/* main infos */}
        <div className='w-full p-3 mb-2 lg:pl-10 relative'>
          {/* name */}
          <span className='text-xl lg:text-2xl font-bold'>{group.name}</span>
          {/* action buttons */}
          <GroupButtons 
            group={group} 
            openEdit={() => setEditModal(true)}
            onJoin={onJoin}
            onCancelRequest={onCancelRequest}
            onLeave={onLeave}
          />
          {/* description */}
          <p className='mt-1 text-sm lg:text-normal text-light-txt2 dark:text-dark-txt2 w-[75%] min-w-[350px] whitespace-pre-wrap'>{group.description}</p>
        </div>
        {/* additional infos */}
        <div className='w-full p-2'>
          <div className='flex flex-col gap-2 w-full lg:w-1/2'>
            {/* informations */}
            <div className='w-full pl-3 lg:pl-8'>
              {/* created at */}
              <p className='flex gap-2 py-2'>
                <CalendarCheck className='size-6' />
                Created : {formatDateWithSuffix(group.createdAt)}
              </p>
              {/* members count */}
              { !isMember &&
                <p className='flex gap-2 py-2'>
                  <Users className='size-6' />
                  Members: {group.members.length}
                </p>
              }
            </div>
            {/* friend members (only visitor) */}
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
                      className='py-1 px-2 text-sm lg:text-normal'
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
                    {/* display skeletons while loading more members */}
                    {
                      loadingMoreMembers && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                    }
                    {/* sentinal div for loading more members */}
                    { 
                      <div ref={membersLoaderRef}></div>
                    }
                  </ul>
                </div>
              )
            }
            {/* join requests (admin only) */}
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
                    {/* placeholder for empty requests list */}
                    {
                      requests.length == 0 ? (
                        <div className='flex-1 py-10 flex flex-col items-center gap-2'> 
                          <Ghost className='size-6' />
                          No pending requests 
                        </div> 
                      ) : (
                        requests.map(r => (
                          <JoinRequestPreview 
                            key={r.userID} 
                            request={r} 
                            groupID={group.groupID} 
                            onAccept={onAcceptRequest} 
                            onDecline={onDeclineRequest} 
                          />
                        ))
                      )
                    }
                    {/* display skeletons while loading more members */}
                    {
                      loadingMoreRequests && Array.from({ length: 2 }).map((_, i) => <RequestPreviewSkeleton key={i} />)
                    }
                    {/* sentinal div for loading more requests */}
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
      {/* edit group modal */}
      <AnimatePresence>
      {
        editModal && 
        <EditGroupModal 
          group={group} 
          onClose={() => setEditModal(false)} 
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      }
      </AnimatePresence>
      {/* add members modal */}
      <AnimatePresence>
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
      </AnimatePresence>
    </>        
  )
}

export default GroupProfile