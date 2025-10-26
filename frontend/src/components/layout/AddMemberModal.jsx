import React, { useState, useEffect, useRef } from 'react'
import { Check, Ghost } from 'lucide-react';

import { useChatStore } from '../../store/chat.store';

import { getFriends } from '../../lib/api/user.api';
import { addMembers } from '../../lib/api/group.api';
import { sendGroupInvites } from '../../lib/api/chat.api';

import PrimaryButton from '../PrimaryButton';
import TertiaryButton from '../TertiaryButton';
import ProfilePreview from '../previews/ProfilePreview';
import JoinRequestPreview from '../previews/JoinRequestPreview'
import ProfilePreviewSkeleton from '../skeleton/ProfilePreviewSkeleton';
import AnimatedModal from '../AnimatedModal';


/* 
 * AddMemberModal Component
 
 * A modal dialog that handles adding members or inviting friends to a group:
  
 * Integrates with API functions:
 * - `getFriends`, `addMembers`, `sendGroupInvites`
 
 * params:
 * - group: the group to add members or invite friends to 
 * - requests: for friends who already requested to join (don't add just accept request)
 * - isAdmin: boolean controls wether it's add members (admin) or invite friends (member)
 * - onClose: callback function to close the modal
 * - onAddMembers: callback function to update the group and groups list after adding members
 * - onAcceptRequest: callback function to update the group and groups list after accepting a request
*/
const AddMemberModal = ({onClose, group, requests, isAdmin, onAddMembers, onAcceptRequest}) => {
    const { selectedChat, messages, updateMessages } = useChatStore();

    // loading friends states (with pagination)
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [friends, setFriends] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false)

    const loaderRef = useRef(null);

    // adding or inviting action states
    const [users, setUsers] = useState(new Set());
    const [error, setError] = useState("");
    const [adding, setAdding] = useState(false);

    // array to control displayed friends (friends who are already members are not displayed)
    let displayedFriends = []

    // function to fetch the friends list with pagination
    const fetchFriends = async (reset = false) => {
        if(!reset && !hasMore) return;
        try {
            const res = await getFriends(reset, page, 10);
    
            if(res?.friends) {
            const newFriends = res.friends;
            const totalPages = res.totalPages;
        
            setFriends(prev => reset ? newFriends : [...prev, ...newFriends]);
            setHasMore((reset ? 1 : page) < totalPages);
            setPage(reset ? 2 : page + 1);
            }   
        } catch (error) {
            console.log("error in fetching friends in add member modal", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    // useEffect load the first page of friends on mount
    useEffect(() => {
        const fetchData = async () => {
          setLoading(true);
          await fetchFriends(true);
        };
    
        fetchData();
    }, []);

    // load next page of friends
    const loadMore = async () => {
        if(!loading && !loadingMore) {
            setLoadingMore(true);
            fetchFriends();
        }
    }

    // toggle member selection
    const toggleMember = (userID) => {
        if(error) {
            setError("");
        }
        setUsers(prev => {
            const newSet = new Set(prev);
            if(newSet.has(userID)) {
                newSet.delete(userID);
            } else {
                newSet.add(userID);
            }
            return newSet;
        })
    }

    //useEffect hook for infinite scrolling in the friends list.
    useEffect(() => {
        // exit early if there are no more friends to load
        if(!hasMore) return;
        // uses an IntersectionObserver to detect when the `loaderRef` element enters the viewport.
        const observer = new IntersectionObserver(
          (entries) => {
            // If the loaderRef div is fully visible, load more items
            if(entries[0].isIntersecting) {
              loadMore();
            }
          }, 
          {
            threshold: 1.0 // Trigger only when element is fully in view
          }
        );
    
        // Start observing the loader element
        const target = loaderRef.current
        if(target) {
            observer.observe(target);
        }
        
        // Cleanup observer on unmount or dependency change
        return () => observer.disconnect();
    }, [loading, loadingMore]);

    // handle add members to group
    const handleAdd = async (event) => {
        event.preventDefault();
        if(adding) return;
        // validate selected users (at least 1 must be selected) 
        if(users.size == 0) {
            setError("Select at least 1 friend to add")
            return;
        }

        // transform users from set to array
        const selectedUsers = Array.from(users);
        setAdding(true);
        try {
            const res = await addMembers(group.groupID, selectedUsers);

            // if members added then update states and close modal
            if(res?.group) {
                const {group, addedUsers} = res;
                onAddMembers(group, addedUsers);
                onClose()
            }
        } catch (error) {
            console.log("error in add member", error);
        } finally {
            setAdding(false)
        }
    }

    // handle send group invites to friends
    const handleSend = async (event) => {
        event.preventDefault();
        if(adding) return;
        // validate selected users (at least 1 must be selected)
        if(users.size == 0) {
            setError("Select at least 1 friend to invite")
            return;
        }

        // transform users from set to array
        const selectedUsers = Array.from(users);
        setAdding(true);
        try {
            const res = await sendGroupInvites({receiverIDs: selectedUsers, groupInvite: group.groupID});

            // if sent invites and a chat is open then update chat's messages (if chat is with a user we sent an invite to) 
            if(res?.invites && selectedChat?.chatID) {
                const invites = res.invites 
                invites.forEach(inv => {
                    if( inv.chatID == selectedChat.chatID) {
                        const newMessages = [...messages, inv];
                        updateMessages(newMessages);
                    }
                })
                // close modal
                onClose();
            }
        } catch (error) {
            console.log("error in invite friends", error);
        } finally {
            setAdding(false)
        }
    }

  return (
    <AnimatedModal
        onClose={onClose}
        className='h-[60%] lg:h-[80%] w-[95%] lg:w-[50%] min-w-[350px] rounded-2xl flex items-center justify-center p-8 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'
    >
        <form
            onSubmit={isAdmin ? handleAdd : handleSend}
            className='size-full'
        >
            <div className='size-full flex flex-col justify-center items-center gap-2'>
                {/* title and text */}
                <div className='text-center'>
                    <h2 className='text-lg lg:text-xl font-bold font-outfit'>
                       { isAdmin ? 'Add Members' : 'Invite friends'} 
                    </h2>
                    <p className='text-sm lg:text- text-light-txt2 dark:text-dark-txt2'>
                       {`Select friends to ${isAdmin ? 'add' : 'invite'} to ${group.name}`} 
                    </p>
                </div>
                {/* infos section */}
                <div className='w-[70%] min-w-[340px] text-sm flex items-center justify-between'>
                    {/* error span */}
                    <span className="text-xs min-h-[1rem] block">
                        {error && <span className="text-danger">{error}</span>}
                    </span>
                    {/* selected counter */}
                    <span className={`${error ? 'text-danger' : 'text-light-txt2 dark:text-dark-txt2'}`}> 
                        Selected: {users.size}
                    </span>
                </div>
                {/* friends list */}
                <ul className='h-full w-[70%] min-w-[340px] px-1 lg:px-4 pb-2 overflow-y-auto scrollbar bg-light-200 dark:bg-dark-200'>
                    {
                        loading ? (
                            /* display skeletons while loading*/
                            Array.from({ length: 8 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                        ) : (
                            /* display placeholder for empty state */
                            friends.length == 0 ? (
                                <div className='size-full flex flex-col items-center justify-center gap-2'> 
                                    <Ghost className='size-6' />
                                    You currently have no friends 
                                </div> 
                            ) : (
                                /* display friends list */
                                friends.map(friend => {
                                    /* skip if friend is already a member */
                                    const isMember = group.members.some(m => m.user == friend.userID)
                                    if(isMember) return;

                                    // check if friend already sent a request to join
                                    const req = requests.filter(r => r.userID == friend.userID)[0]

                                    // count displayed friends
                                    displayedFriends.push(friend);

                                    // display request preview if user is admin and friends sent request
                                    if(isAdmin && req) {
                                        return (
                                            <JoinRequestPreview 
                                                key={req.userID}
                                                request={req} 
                                                groupID={group.groupID} 
                                                isAddingMember={true} 
                                                onAccept={onAcceptRequest}
                                            />
                                        )
                                    }

                                    // display friend preview and checkbox
                                    return (
                                        <div key={friend.userID} 
                                            className='flex items-center justify-between mt-2 cursor-pointer pl-1 pr-3'
                                            onClick={() => toggleMember(friend.userID)}
                                        >
                                            {/* friend profile preview */}
                                            <ProfilePreview user={friend} />
                                            {/* checkbox */}
                                            <div className={`size-6 lg:size-8 rounded-sm border-1 flex items-center justify-center border-light-txt2 dark:border-dark-txt2 ${users.has(friend.userID) ? 'bg-primary' : 'bg-transparent'}`}
                                            >   
                                                {
                                                    users.has(friend.userID) && (
                                                        <Check className='size-5 lg:size-6 text-inverted' />
                                                    )
                                                }
                                            </div>
                                        </div>
                                    )
                                }) 
                            )
                        )
                    }
                    {
                        /* display empty placeholder if no friends were displayed */
                        displayedFriends.length == 0 && (
                            <div className='size-full flex flex-col items-center justify-center gap-2'> 
                                <Ghost className='size-6' />
                                No friends available to add 
                            </div> 
                        )
                    }
                    {
                        /* display skeletons at the bottom while loading more */
                        loadingMore && hasMore && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                        
                    }
                    {/* div used to load more friends */}
                    <div ref={loaderRef}></div>
                </ul>
                {/* buttons */}
                <div className='flex items-center justify-center gap-8'>
                    {/* close modal */}
                    <TertiaryButton
                        text="Cancel"
                        className='py-2 px-8 text-sm lg:text-'
                        onClick={onClose}
                        disabled={adding}
                    />
                    {/* submit */}
                    <PrimaryButton 
                        text={isAdmin ? "Add Members" : "Send Invite"}
                        className={`text-sm lg:text- py-2 ${adding ? 'px-12' : 'px-6'}`}
                        type='submit'
                        loading={adding}
                    />
                </div>
            </div>
        </form>
    </AnimatedModal>
  )
}

export default AddMemberModal

const ikhti = () => (
    <div onClick={onClose} 
        className='bg-[#00000066] dark:bg-[#ffffff33] fixed inset-0 z-50 flex items-center justify-center'
    >
        <form 
            onSubmit={isAdmin ? handleAdd : handleSend}
            onClick={(e) => e.stopPropagation()} 
            className='h-[60%] lg:h-[80%] w-[95%] lg:w-[50%] min-w-[350px] rounded-2xl flex items-center justify-center p-8 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'
        >
            <div className='size-full flex flex-col justify-center items-center gap-2'>
                {/* title and text */}
                <div className='text-center'>
                    <h2 className='text-lg lg:text-xl font-bold font-outfit'>
                       { isAdmin ? 'Add Members' : 'Invite friends'} 
                    </h2>
                    <p className='text-sm lg:text- text-light-txt2 dark:text-dark-txt2'>
                       {`Select friends to ${isAdmin ? 'add' : 'invite'} to ${group.name}`} 
                    </p>
                </div>
                {/* infos section */}
                <div className='w-[70%] min-w-[340px] text-sm flex items-center justify-between'>
                    {/* error span */}
                    <span className="text-xs min-h-[1rem] block">
                        {error && <span className="text-danger">{error}</span>}
                    </span>
                    {/* selected counter */}
                    <span className={`${error ? 'text-danger' : 'text-light-txt2 dark:text-dark-txt2'}`}> 
                        Selected: {users.size}
                    </span>
                </div>
                {/* friends list */}
                <ul className='h-full w-[70%] min-w-[340px] px-1 lg:px-4 pb-2 overflow-y-scroll bg-light-200 dark:bg-dark-200'>
                    {
                        loading ? (
                            /* display skeletons while loading*/
                            Array.from({ length: 8 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                        ) : (
                            /* display placeholder for empty state */
                            friends.length == 0 ? (
                                <div className='size-full flex flex-col items-center justify-center gap-2'> 
                                    <Ghost className='size-6' />
                                    You currently have no friends 
                                </div> 
                            ) : (
                                /* display friends list */
                                friends.map(friend => {
                                    /* skip if friend is already a member */
                                    const isMember = group.members.some(m => m.user == friend.userID)
                                    if(isMember) return;

                                    // check if friend already sent a request to join
                                    const req = requests.filter(r => r.userID == friend.userID)[0]

                                    // count displayed friends
                                    displayedFriends.push(friend);

                                    // display request preview if user is admin and friends sent request
                                    if(isAdmin && req) {
                                        return (
                                            <JoinRequestPreview 
                                                key={req.userID}
                                                request={req} 
                                                groupID={group.groupID} 
                                                isAddingMember={true} 
                                                onAccept={onAcceptRequest}
                                            />
                                        )
                                    }

                                    // display friend preview and checkbox
                                    return (
                                        <div key={friend.userID} 
                                            className='flex items-center justify-between mt-2 cursor-pointer pl-1 pr-3'
                                            onClick={() => toggleMember(friend.userID)}
                                        >
                                            {/* friend profile preview */}
                                            <ProfilePreview user={friend} />
                                            {/* checkbox */}
                                            <div className={`size-6 lg:size-8 rounded-sm border-1 flex items-center justify-center border-light-txt2 dark:border-dark-txt2 ${users.has(friend.userID) ? 'bg-primary' : 'bg-transparent'}`}
                                            >   
                                                {
                                                    users.has(friend.userID) && (
                                                        <Check className='size-5 lg:size-6 text-inverted' />
                                                    )
                                                }
                                            </div>
                                        </div>
                                    )
                                }) 
                            )
                        )
                    }
                    {
                        /* display empty placeholder if no friends were displayed */
                        displayedFriends.length == 0 && (
                            <div className='size-full flex flex-col items-center justify-center gap-2'> 
                                <Ghost className='size-6' />
                                No friends available to add 
                            </div> 
                        )
                    }
                    {
                        /* display skeletons at the bottom while loading more */
                        loadingMore && hasMore && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                        
                    }
                    {/* div used to load more friends */}
                    <div ref={loaderRef}></div>
                </ul>
                {/* buttons */}
                <div className='flex items-center justify-center gap-8'>
                    {/* close modal */}
                    <TertiaryButton
                        text="Cancel"
                        className='py-2 px-8 text-sm lg:text-'
                        onClick={onClose}
                        disabled={adding}
                    />
                    {/* submit */}
                    <PrimaryButton 
                        text={isAdmin ? "Add Members" : "Send Invite"}
                        className={`text-sm lg:text- py-2 ${adding ? 'px-12' : 'px-6'}`}
                        type='submit'
                        loading={adding}
                    />
                </div>
            </div>
        </form>
    </div>
)