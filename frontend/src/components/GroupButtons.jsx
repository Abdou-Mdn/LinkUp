import React, { useState } from 'react'
import { useAuthStore } from '../store/auth.store'
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import TertiaryButton from './TertiaryButton'
import { MessageSquareMore, X, PenLine, LogOut, CirclePlus, TriangleAlert } from 'lucide-react';
import { formatDateWithSuffix } from '../lib/util/timeFormat';
import { cancelJoinRequest, leaveGroup, sendJoinRequest } from '../lib/api/group.api';


const GroupButtons = ({ group, openEdit, onJoin, onCancelRequest, onLeave }) => {

    const { authUser, setAuthUser } = useAuthStore();

    const isAdmin = group.admins.includes(authUser.userID);
    const isMember = group.members.filter(m => m.user == authUser.userID)[0];
    const sentRequest = group.joinRequests.filter(r => r.user == authUser.userID)[0];
    
    const [loading, setLoading] = useState(false);
    const [leaveModal, setLeaveModal] = useState(false);

    const joinGroup = async () => {
        setLoading(true);
        const res = await sendJoinRequest(group.groupID);
        if(res?.group) {
            setAuthUser(res.user);
            onJoin(res.group, res.request);
        }
        setLoading(false);
    }

    const cancelRequest = async () => {
        setLoading(true);
        const res = await cancelJoinRequest(group.groupID);
        if(res?.group) {
            setAuthUser(res.user);
            onCancelRequest(res.group)
        }
        setLoading(false);
    }

    const leave = async () => {
        setLoading(true);
        const res = await leaveGroup(group.groupID);
        if(res) {
            onLeave(res.group, group.groupID);
        }
        setLeaveModal(false)
        setLoading(false);
    } 

  return (
    <>
        <div className='flex flex-col gap-1 lg:items-end my-3 lg:absolute lg:top-[-50px] lg:right-8'>
            <p className='text-sm text-light-txt2 dark:text-dark-txt2'>
                {
                    isMember ? `Member since ${formatDateWithSuffix(isMember.joinedAt)}` :
                    sentRequest ? `Your join request is pending since ${formatDateWithSuffix(sentRequest.requestedAt)}` :
                    "You are not a member of this group. Send a request to join"
                }
            </p>
            <div className='flex items-center gap-4'>
                {
                    isAdmin ? (
                        <>
                            <PrimaryButton 
                                text='Message' 
                                className='py-2 px-4 mt-2' 
                                leftIcon={<MessageSquareMore className='size-6' />} 
                                disabled={loading}       
                                // open chat 
                            />
                            <TertiaryButton 
                                text='Edit'
                                className='py-2 px-4 mt-2'
                                leftIcon={<PenLine className='size-6' />}
                                disabled={loading}
                                onClick={openEdit}
                            />
                            <SecondaryButton 
                                text='Leave' 
                                className='py-2 px-4 mt-2' 
                                leftIcon={<LogOut className='size-6' />}
                                disabled={loading}
                                onClick={() => setLeaveModal(true)}
                            />
                        </>
                    ) : 
                    isMember ? (
                        <>
                            <PrimaryButton 
                                text='Message' 
                                className='py-2 px-4 mt-2' 
                                leftIcon={<MessageSquareMore className='size-6' />} 
                                disabled={loading}       
                                // open chat 
                            />
                            <SecondaryButton 
                                text='Leave' 
                                className='py-2 px-4 mt-2' 
                                leftIcon={<LogOut className='size-6' />}
                                disabled={loading}
                                onClick={() => setLeaveModal(true)}
                            />
                        </>
                    ) :
                    sentRequest ? (
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
                            text='Join' 
                            className='py-2 px-4 mt-2' 
                            leftIcon={<CirclePlus className='size-6' />} 
                            disabled={loading}
                            onClick={joinGroup}
                        />
                    )

                }
            </div>
        </div>
        {
            leaveModal && (
                <div onClick={() => setLeaveModal(false)} 
                    className='bg-[#00000066] dark:bg-[#ffffff33] fixed inset-0 z-50 flex items-center justify-center'
                >
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className='h-[40%] w-[50%] min-w-[350px] rounded-2xl flex flex-col items-center justify-center p-10 gap-4 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'
                    >
                        <h3 className='text-danger text-xl font-semibold flex items-center gap-2'>
                            <TriangleAlert className='size-5' />
                            <span> Confirm Leaving</span>
                            <TriangleAlert className='size-5' />
                        </h3>
                        <span className='text-sm text-light-txt dark:text-dark-txt text-center'>
                            You are about to leave <strong>{group.name}</strong>.
                            You will no longer be able to participate in the group chat unless added again.
                        </span>
                            <div className='mt-2 flex items-center gap-4 w-[80%] min-w-min-w-[300px]'>
                            <TertiaryButton
                                text="Cancel"
                                className='p-2 flex-1'
                                type='button'
                                disabled={loading}
                                onClick={() => setLeaveModal(false)}
                            />
                            <SecondaryButton
                                text="Leave Group"
                                className='p-2 flex-1'
                                type='button'
                                isColored={true}
                                disabled={loading}
                                onClick={leave}
                            />
                        </div>
                    </div>
                </div>
            )
        }
    </>
  )
}

export default GroupButtons