import React, { useState } from 'react'
import { useAuthStore } from '../store/auth.store'
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import { MessageSquareMore, UserX, UserCheck, X, UserPlus } from 'lucide-react';
import { formatDateWithSuffix } from '../lib/util/timeFormat';
import { acceptFriendRequest, cancelFriendRequest, declineFriendRequest, removeFriend, sendFriendRequest } from '../lib/api/user.api';

const ProfileButtons = ({user, setUser, updateRequestList = null}) => {

    const { authUser, setAuthUser } = useAuthStore();
    const { friends, friendRequests, sentFriendRequests } = authUser;

    const isMe = authUser.userID === user.userID; 

    const friend = friends.filter(f => f.user === user.userID)[0] ;
    const friendRequest = friendRequests.filter(f => f.user === user.userID)[0];
    const sentFriendRequest = sentFriendRequests.filter(f => f.user === user.userID)[0];

    const [loading, setLoading] = useState(false);

    const addFriend = async () => {
        setLoading(true);
        const res = await sendFriendRequest(user.userID);
        if(res?.user) {
            setAuthUser(res.user);
            if(updateRequestList) {
                updateRequestList(user.userID, res.profile);
            } else {
                setUser(res.profile);
            } 
        }
        setLoading(false);
    }

    const cancelRequest = async () => {
        setLoading(true);
        const res = await cancelFriendRequest(user.userID);
        if(res?.user) {
            setAuthUser(res.user);
            if(updateRequestList) {
                updateRequestList(user.userID, res.profile);
            } else {
                setUser(res.profile);
            }
            
        }
        setLoading(false);
    }

    const acceptRequest = async () => {
        setLoading(true);
        const res = await acceptFriendRequest(user.userID);
        if(res?.user) {
            setAuthUser(res.user);
            if(updateRequestList) {
                updateRequestList(user.userID, res.profile);
            } else {
                setUser(res.profile);
            }
            
        }
        setLoading(false);
    }

    const declineRequest = async () => {
        setLoading(true);
        const res = await declineFriendRequest(user.userID);
        if(res?.user) {
            setAuthUser(res.user);
            if(updateRequestList) {
                updateRequestList(user.userID, res.profile);
            } else {
                setUser(res.profile);
            }
            
        }
        setLoading(false);
    }

    const unfriend = async () => {
        setLoading(true);
        const res = await removeFriend(user.userID);
        if(res?.user) {
            setAuthUser(res.user);
            if(updateRequestList) {
                updateRequestList(user.userID, res.profile);
            } else {
                setUser(res.profile);
            }
            
        }
        setLoading(false);
    }

  return (
    !isMe &&
    <div className='flex flex-col gap-1 lg:items-end my-3 lg:absolute lg:top-[-50px] lg:right-8'>
        <p className='text-sm text-light-txt2 dark:text-dark-txt2'>
            {
                friend ? `Friends since ${formatDateWithSuffix(friend.friendsSince)}` :
                friendRequest ? `Sent you a friend request since ${formatDateWithSuffix(friendRequest.requestedAt)}` :
                sentFriendRequest ? `Your friend request is pending since ${formatDateWithSuffix(sentFriendRequest.requestedAt)}` :
                "You are not friends. Send a friend request to start talking"
            }
        </p>
        <div className='flex items-center gap-4'>
            {
                friend ? (
                    <>
                        <PrimaryButton 
                            text='Message' 
                            className='py-2 px-4 mt-2' 
                            leftIcon={<MessageSquareMore className='size-6' />} 
                            disabled={loading}       
                            // open chat 
                        />
                        <SecondaryButton 
                            text='Unfriend' 
                            className='py-2 px-4 mt-2' 
                            leftIcon={<UserX className='size-6' />}
                            disabled={loading}
                            onClick={unfriend}
                        />
                    </>
                ) : 
                friendRequest ? (
                    <>
                        <PrimaryButton 
                            text='Accept' 
                            className='py-2 px-4 mt-2' 
                            leftIcon={<UserCheck className='size-6' />} 
                            disabled={loading}
                            onClick={acceptRequest}
                        />
                        <SecondaryButton 
                            text='Decline' 
                            className='py-2 px-4 mt-2' 
                            leftIcon={<UserX className='size-6' />}
                            disabled={loading}
                            onClick={declineRequest}
                        />
                    </>
                ) :
                sentFriendRequest ? (
                    <SecondaryButton 
                        text='Cancel Request' 
                        isColored={false} 
                        className='py-2 px-4 mt-2' 
                        leftIcon={<X className='size-6' />}
                        disabled={loading}
                        onClick={cancelRequest}
                    />
                ) : (
                    <PrimaryButton 
                        text='Add' 
                        className='py-2 px-4 mt-2' 
                        leftIcon={<UserPlus className='size-6' />} 
                        disabled={loading}
                        onClick={addFriend}
                    />
                )

            }
        </div>
    </div>
  )
}

export default ProfileButtons