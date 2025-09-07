import React, { useState } from 'react'
import { useAuthStore } from '../store/auth.store'
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import { MessageSquareMore, UserX, UserCheck, X, UserPlus, TriangleAlert } from 'lucide-react';
import { formatDateWithSuffix } from '../lib/util/timeFormat';
import { acceptFriendRequest, cancelFriendRequest, declineFriendRequest, removeFriend, sendFriendRequest } from '../lib/api/user.api';
import TertiaryButton from './TertiaryButton';
import { useChatStore } from '../store/chat.store';
import { useNavigate } from 'react-router-dom';

const ProfileButtons = ({user, onAdd, onCancel, onAccept, onDecline, onUnfriend}) => {

    const { selectChat } = useChatStore();
    const navigate = useNavigate()

    const { authUser} = useAuthStore();
    const { friends, friendRequests, sentFriendRequests } = authUser;

    const isMe = authUser.userID === user.userID; 

    const friend = friends.filter(f => f.user === user.userID)[0] ;
    const friendRequest = friendRequests.filter(f => f.user === user.userID)[0];
    const sentFriendRequest = sentFriendRequests.filter(f => f.user === user.userID)[0];

    const [loading, setLoading] = useState(false);
    const [unfriendModel, setUnfriendModel] = useState(false);

    const addFriend = async () => {
        setLoading(true);
        const res = await sendFriendRequest(user.userID);
        if(res?.user) {
            onAdd(res.user, res.profile); 
        }
        setLoading(false);
    }

    const cancelRequest = async () => {
        setLoading(true);
        const res = await cancelFriendRequest(user.userID);
        if(res?.user) {
            onCancel(res.user, res.profile);
        }
        setLoading(false);
    }

    const acceptRequest = async () => {
        setLoading(true);
        const res = await acceptFriendRequest(user.userID);
        if(res?.user) {
            onAccept(res.user, res.profile);
        }
        setLoading(false);
    }

    const declineRequest = async () => {
        setLoading(true);
        const res = await declineFriendRequest(user.userID);
        if(res?.user) {
            onDecline(res.user, res.profile);
        }
        setLoading(false);
    }

    const unfriend = async () => {
        setLoading(true);
        const res = await removeFriend(user.userID);
        if(res?.user) {
            onUnfriend(res.user, res.profile);
        }
        setUnfriendModel(false);
        setLoading(false);
    }

    const openChat = async () => {
        await selectChat({
            userID: user.userID,
            navigate: navigate("/")
        });
    }

  return (
    !isMe && (
        <>
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
                                    onClick={openChat} 
                                />
                                <SecondaryButton 
                                    text='Unfriend' 
                                    className='py-2 px-4 mt-2' 
                                    leftIcon={<UserX className='size-6' />}
                                    disabled={loading}
                                    onClick={() => setUnfriendModel(true)}
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
            {
                unfriendModel && (
                    <div onClick={() => setUnfriendModel(false)} 
                        className='bg-[#00000066] dark:bg-[#ffffff33] fixed inset-0 z-50 flex items-center justify-center'
                    >
                        <div 
                            onClick={(e) => e.stopPropagation()} 
                            className='h-[40%] w-[50%] min-w-[350px] rounded-2xl flex flex-col items-center justify-center p-10 gap-4 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'
                        >
                            <h3 className='text-danger text-xl font-semibold flex items-center gap-2'>
                                <TriangleAlert className='size-5' />
                                <span> Confirm Removing Friend</span>
                                <TriangleAlert className='size-5' />
                            </h3>
                            <span className='text-sm text-light-txt dark:text-dark-txt text-center'>
                                You are about to remove <strong>{user.name}</strong> from your friends list.
                                This will delete all of your messages and you will no longer be able to communicate.
                            </span>
                                <div className='mt-2 flex items-center gap-4 w-[80%] min-w-min-w-[300px]'>
                                <TertiaryButton
                                    text="Cancel"
                                    className='p-2 flex-1'
                                    type='button'
                                    disabled={loading}
                                    onClick={() => setUnfriendModel(false)}
                                />
                                <SecondaryButton
                                    text="Remove Friend"
                                    className='p-2 flex-1'
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