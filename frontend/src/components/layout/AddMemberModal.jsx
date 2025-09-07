import React, { useEffect, useRef } from 'react'
import { useState } from 'react'
import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton'
import TertiaryButton from '../TertiaryButton';
import ProfilePreviewSkeleton from '../skeleton/ProfilePreviewSkeleton';
import { Check, Ghost } from 'lucide-react';
import { getFriends } from '../../lib/api/user.api';
import ProfilePreview from '../previews/ProfilePreview';
import JoinRequestPreview from '../previews/JoinRequestPreview'
import { addMembers } from '../../lib/api/group.api';
import { sendGroupInvites, sendMessage } from '../../lib/api/chat.api';
import { useChatStore } from '../../store/chat.store';

const AddMemberModal = ({onClose, group, requests, isAdmin, onAddMembers, onAcceptRequest}) => {
    const { selectedChat, messages, updateMessages } = useChatStore();

    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [friends, setFriends] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false)

    const [users, setUsers] = useState(new Set());
    const [error, setError] = useState("");
    const [adding, setAdding] = useState(false);

    const loaderRef = useRef(null);

    let displayedFriends = []

    const fetchFriends = async (reset = false) => {
        if(!reset && !hasMore) return;
        const result = await getFriends(reset, page, 10);
    
        if(result?.friends) {
          const newFriends = result.friends;
          const totalPages = result.totalPages;
    
          setFriends(prev => reset ? newFriends : [...prev, ...newFriends]);
          setHasMore((reset ? 1 : page) < totalPages);
          setPage(reset ? 2 : page + 1);
        }

        setLoading(false);
        setLoadingMore(false);
    }

    useEffect(() => {
        const fetchData = async () => {
          setLoading(true);
          await fetchFriends(true);
        };
    
        fetchData();
    }, []);

    const loadMore = async () => {
        if(!loading && !loadingMore) {
            setLoadingMore(true);
            fetchFriends();
        }
    }

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
    
        const target = loaderRef.current

        if(target) {
            observer.observe(target);
        }
        
        return () => observer.disconnect();
    }, [loading, loadingMore]);

    const handleAdd = async (event) => {
        if(adding) return;
        event.preventDefault();
        if(users.size == 0) {
            setError("Select at least 1 friend to add")
            return;
        }

        const selectedUsers = Array.from(users);
        setAdding(true);
        try {
            const res = await addMembers(group.groupID, selectedUsers);

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

    const handleSend = async (event) => {
        if(adding) return;
        event.preventDefault();
        if(users.size == 0) {
            setError("Select at least 1 friend to invite")
            return;
        }

        const selectedUsers = Array.from(users);
        setAdding(true);
        try {
            const res = await sendGroupInvites({receiverIDs: selectedUsers, groupInvite: group.groupID});

            if(res?.invites && selectedChat.chatID) {
                const invites = res.invites 
                console.log(invites);
                invites.forEach(inv => {
                    if( inv.chatID == selectedChat.chatID) {
                        const newMessages = [...messages, inv];
                        updateMessages(newMessages);
                    }
                })
                onClose();
            }
        } catch (error) {
            console.log("error in invite friends", error);
        } finally {
            setAdding(false)
        }
    }

  return (
    <div onClick={onClose} 
        className='bg-[#00000066] dark:bg-[#ffffff33] fixed inset-0 z-50 flex items-center justify-center'
    >
        <form 
            onSubmit={isAdmin ? handleAdd : handleSend}
            onClick={(e) => e.stopPropagation()} 
            className='h-[80%] w-[50%] min-w-[350px] rounded-2xl flex items-center justify-center p-8 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'
        >
            <div className='size-full flex flex-col justify-center items-center gap-2'>
                <div className='text-center'>
                    <h2 className='text-xl font-bold font-outfit'>
                       { isAdmin ? 'Add Members' : 'Invite friends'} 
                    </h2>
                    <p className='text-light-txt2 dark:text-dark-txt2'>
                       {`Select friends to ${isAdmin ? 'add' : 'invite'} to ${group.name}`} 
                    </p>
                </div>
                <div className='w-[70%] min-w-[300px] text-sm flex items-center justify-between'>
                    <span className={`${error ? 'text-danger' : 'text-transparent'}`}>
                        { error || "placeholder" }
                    </span>
                    <span className={`${error ? 'text-danger' : 'text-light-txt2 dark:text-dark-txt2'}`}> 
                        Selected: {users.size}
                    </span>
                </div>
                <ul className='h-full w-[70%] min-w-[300px] px-4 pb-2 overflow-y-scroll bg-light-200 dark:bg-dark-200'>
                    {
                        loading ? (
                            Array.from({ length: 5 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                        ) : (
                            friends.length == 0 ? (
                                <div className='size-full flex flex-col items-center justify-center gap-2'> 
                                    <Ghost className='size-6' />
                                    You currently have no friends 
                                </div> 
                            ) : (
                                friends.map(friend => {
                                    const isMember = group.members.some(m => m.user == friend.userID)
                                    if(isMember) return;

                                    const req = requests.filter(r => r.userID == friend.userID)[0]

                                    displayedFriends.push(friend);

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


                                    return (
                                        <div key={friend.userID} 
                                            className='flex items-center justify-between mt-2 cursor-pointer pl-1 pr-3'
                                            onClick={() => toggleMember(friend.userID)}
                                        >
                                            <ProfilePreview user={friend} />
                                            <div className={`size-8 rounded-sm border-1 flex items-center justify-center border-light-txt2 dark:border-dark-txt2 ${users.has(friend.userID) ? 'bg-primary' : 'bg-transparent'}`}
                                            >   
                                                {
                                                    users.has(friend.userID) && (
                                                        <Check className='size-6 text-inverted' />
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
                        displayedFriends.length == 0 && (
                            <div className='size-full flex flex-col items-center justify-center gap-2'> 
                                <Ghost className='size-6' />
                                No friends available to add 
                            </div> 
                        )
                    }
                    <div ref={loaderRef}></div>
                </ul>
                <div className='flex items-center justify-center gap-8'>
                    <TertiaryButton
                        text="Cancel"
                        className='py-2 px-8'
                        onClick={onClose}
                        disabled={adding}
                    />
                    <PrimaryButton 
                        text={isAdmin ? "Add Members" : "Send Invite"}
                        className='py-2 px-6'
                        type='submit'
                        loading={adding}
                    />
                </div>
            </div>
        </form>
    </div>
  )
}

export default AddMemberModal