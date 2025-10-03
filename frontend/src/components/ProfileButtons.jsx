import React, { useState } from 'react'
import { MessageSquareMore, UserX, UserCheck, X, UserPlus, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../store/auth.store'
import { useChatStore } from '../store/chat.store';

import { acceptFriendRequest, cancelFriendRequest, declineFriendRequest, removeFriend, sendFriendRequest } from '../lib/api/user.api';

import { formatDateWithSuffix } from '../lib/util/timeFormat';

import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import TertiaryButton from './TertiaryButton';

/* 
 * ProfileButtons Component
 
 * Displays the action buttons in a user profile
 * displays different buttons based on user's friendship state (friends/ sent request/ received request/ not friends)
 
 * Not friends: send friend request
 * Sent friend request : cancel friend request
 * Received friend request: accept, decline friend request
 * Friends: open chat, remove friend   

 * Integrates with API functions:
 * - `sendFriendRequest`, `cancelFriendRequest`, `acceptFriendRequest`, `declineFriendRequest`, `removeFriend`
 
 * Uses utility functions: `formatDateWithSuffix` 
 
 * params:
 * - user: user profile in which we display the buttons
 * - onAdd: callback function to update user and users list after sending a friend request
 * - onCancel: callback function to update user and users list after canceling a friend request
 * - onAccept: callback function to update user and users list after accepting a friend request
 * - onDecline: callback function to update user and users list after declining a friend request
 * - onUnfriend: callback function to update user and users list after removing friend
*/
const ProfileButtons = ({user, onAdd, onCancel, onAccept, onDecline, onUnfriend}) => {
    const { selectChat, selectedChat, resetChat } = useChatStore();
    const navigate = useNavigate()
    const { authUser} = useAuthStore();
    const { friends, friendRequests, sentFriendRequests } = authUser;

    // check if profile is mine
    const isMe = authUser.userID === user.userID; 

    // check if user is my friend
    const friend = friends.filter(f => f.user === user.userID)[0] ;
    // check if user sent me a friend request
    const friendRequest = friendRequests.filter(f => f.user === user.userID)[0];
    // check if i sent the user a friend request
    const sentFriendRequest = sentFriendRequests.filter(f => f.user === user.userID)[0];

    // states
    const [loading, setLoading] = useState(false); // loading state
    const [unfriendModel, setUnfriendModel] = useState(false); // remove friend confirmation modal

    // handle send friend request
    const addFriend = async () => {
        setLoading(true);
        try {
            const res = await sendFriendRequest(user.userID);
            if(res?.user) {
                onAdd(res.user, res.profile); 
            }    
        } catch (error) {
            console.log("error in send friend request in profile buttons", error);
        } finally {
            setLoading(false);
        }
    }

    // handle cancel friend request
    const cancelRequest = async () => {
        setLoading(true);
        try {
            const res = await cancelFriendRequest(user.userID);
            if(res?.user) {
                onCancel(res.user, res.profile);
            }    
        } catch (error) {
            console.log("error in cancel friend request in profile buttons", error);
        } finally {
            setLoading(false);
        }
    }

    // handle accept friend request
    const acceptRequest = async () => {
        setLoading(true);
        try {
            const res = await acceptFriendRequest(user.userID);
            if(res?.user) {
                onAccept(res.user, res.profile);
            }    
        } catch (error) {
            console.log("error in accept friend request in profile buttons", error);
        } finally {
            setLoading(false);
        }
    }

    // handle decline friend request
    const declineRequest = async () => {
        setLoading(true);
        try {
            const res = await declineFriendRequest(user.userID);
            if(res?.user) {
                onDecline(res.user, res.profile);
            }    
        } catch (error) {
            console.log("error in decline friend request in profile buttons", error);
        } finally {
            setLoading(false);
        }
    }

    // handle remove friend
    const unfriend = async () => {
        setLoading(true);
        try {
            const res = await removeFriend(user.userID);
            if(res?.user) {
                onUnfriend(res.user, res.profile);
                // if selected chat is a private chat with the user we unfriended then clear chat states
                if(!selectedChat?.isGroup && selectedChat?.participants?.some(u => u.userID === user.userID)) {
                    resetChat();
                }
                setUnfriendModel(false); // close modal
            }   
        } catch (error) {
           setLoading(false);   
        }
    }

    // handle open chat
    const openChat = async () => {
        await selectChat({
            userID: user.userID,
            navigate: navigate("/")
        });
    }

  return (
    // if profile is mine don't display any buttons
    !isMe && (
        <>
            {/* text details */}
            <div className='flex flex-col gap-1 lg:items-end my-3 lg:absolute lg:top-[-50px] lg:right-8'>
                <p className='text-xs lg:text-sm text-light-txt2 dark:text-dark-txt2'>
                    {
                        friend ? `Friends since ${formatDateWithSuffix(friend.friendsSince)}` : // friends
                        friendRequest ? `Sent you a friend request since ${formatDateWithSuffix(friendRequest.requestedAt)}` : // received request
                        sentFriendRequest ? `Your friend request is pending since ${formatDateWithSuffix(sentFriendRequest.requestedAt)}` : // sent request
                        "You are not friends. Send a friend request to start talking" // not friends && didn't send a request
                    }
                </p>
                {/* buttons */}
                <div className='flex items-center gap-4'>
                    {
                        // if user is my friend
                        friend ? (
                            <>
                                {/* open chat button */}
                                <PrimaryButton 
                                    text='Message' 
                                    className='py-2 px-4 mt-2 text-sm lg:text-[16px]' 
                                    leftIcon={<MessageSquareMore className='size-5 lg:size-6' />} 
                                    disabled={loading}       
                                    onClick={openChat} 
                                />
                                {/* remove friend button (open confirmation modal) */}
                                <SecondaryButton 
                                    text='Unfriend' 
                                    className='py-2 px-4 mt-2 text-sm lg:text-[16px]' 
                                    leftIcon={<UserX className='size-5 lg:size-6' />}
                                    disabled={loading}
                                    onClick={() => setUnfriendModel(true)}
                                />
                            </>
                        ) : 
                        // if user sent me a request
                        friendRequest ? (
                            <>
                                {/* accept friend request button */}
                                <PrimaryButton 
                                    text='Accept' 
                                    className='py-2 px-4 mt-2 text-sm lg:text-[16px]' 
                                    leftIcon={<UserCheck className='size-5 lg:size-6' />} 
                                    disabled={loading}
                                    onClick={acceptRequest}
                                />
                                {/* decline friend request */}
                                <SecondaryButton 
                                    text='Decline' 
                                    className='py-2 px-4 mt-2 text-sm lg:text-[16px]' 
                                    leftIcon={<UserX className='size-5 lg:size-6' />}
                                    disabled={loading}
                                    onClick={declineRequest}
                                />
                            </>
                        ) :
                        // if i sent a friend request
                        sentFriendRequest ? (
                            /* cancel friend request */
                            <SecondaryButton 
                                text='Cancel Request' 
                                isColored={false} 
                                className='py-2 px-4 mt-2 text-sm lg:text-[16px]' 
                                leftIcon={<X className='size-5 lg:size-6' />}
                                disabled={loading}
                                onClick={cancelRequest}
                            />
                        ) : (
                            /* send friend request button */
                            <PrimaryButton 
                                text='Add' 
                                className='py-2 px-4 mt-2 text-sm lg:text-[16px]' 
                                leftIcon={<UserPlus className='size-5 lg:size-6' />} 
                                disabled={loading}
                                onClick={addFriend}
                            />
                        )

                    }
                </div>
            </div>  
            {/* remove friend confirmation modal */}      
            {
                unfriendModel && (
                    <div onClick={() => setUnfriendModel(false)} 
                        className='bg-[#00000066] dark:bg-[#ffffff33] fixed inset-0 z-50 flex items-center justify-center'
                    >
                        <div 
                            onClick={(e) => e.stopPropagation()} 
                            className='h-fit max-h-[40%] w-[50%] min-w-[350px] rounded-2xl flex flex-col items-center justify-center p-10 gap-4 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'
                        >
                            <h3 className='text-danger text-center lg:text-xl font-semibold flex items-center gap-2'>
                                <TriangleAlert className='size-5' />
                                <span> Confirm Removing Friend</span>
                                <TriangleAlert className='size-5' />
                            </h3>
                            <p className='text-sm text-light-txt dark:text-dark-txt text-center flex flex-col items-center'>
                                <span>
                                    You are about to remove <strong>{user.name}</strong> from your friends list.
                                </span>
                                <span>
                                    This will delete all of your messages and you will not be able to communicate unless added again.
                                </span>
                            </p>
                                <div className='mt-2 flex items-center gap-4 w-[80%] min-w-min-w-[300px]'>
                                <TertiaryButton
                                    text="Cancel"
                                    className='p-2 flex-1 text-sm lg:text-[16px]'
                                    type='button'
                                    disabled={loading}
                                    onClick={() => setUnfriendModel(false)}
                                />
                                <SecondaryButton
                                    text="Remove"
                                    className='p-2 flex-1 text-sm lg:text-[16px]'
                                    type='button'
                                    isColored={true}
                                    disabled={loading}
                                    onClick={unfriend}
                                />
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    )
  )
}

export default ProfileButtons