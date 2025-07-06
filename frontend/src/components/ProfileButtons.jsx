import React from 'react'
import { useAuthStore } from '../store/auth.store'
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import { MessageSquareMore, UserX, UserCheck, X, UserPlus } from 'lucide-react';

const ProfileButtons = ({user}) => {

    const { authUser } = useAuthStore();
    const { friends, friendRequests, sentFriendRequests } = authUser;

    const isMe = authUser.userID === user.userID; 
  return (
    !isMe &&
    <div className='flex items-center my-3 gap-4 lg:absolute lg:top-[-50px] lg:right-8'>
        {
            friends.some(f => f.user === user.userID) ? (
                <>
                    <PrimaryButton text='Message' className='py-2 px-4' leftIcon={<MessageSquareMore className='size-6' />} />
                    <SecondaryButton text='Unfriend' className='py-2 px-4' leftIcon={<UserX className='size-6' />}/>
                </>
            ) : 
            friendRequests.some(f => f.user === user.userID) ? (
                <>
                    <PrimaryButton text='Accept' className='py-2 px-4' leftIcon={<UserCheck className='size-6' />} />
                    <SecondaryButton text='Decline' className='py-2 px-4' leftIcon={<UserX className='size-6' />}/>
                </>
            ) :
            sentFriendRequests.some(f => f.user === user.userID) ? (
                <SecondaryButton text='Cancel Request' isColored={false} className='py-2 px-4' leftIcon={<X className='size-6' />}/>
            ) : <PrimaryButton text='Add' className='py-2 px-4' leftIcon={<UserPlus className='size-6' />} />

        }
    </div>
  )
}

export default ProfileButtons