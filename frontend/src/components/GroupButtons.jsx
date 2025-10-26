import React, { useState } from 'react'
import { MessageSquareMore, X, PenLine, LogOut, CirclePlus, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';

import { useAuthStore } from '../store/auth.store'
import { useChatStore } from '../store/chat.store';

import { cancelJoinRequest, leaveGroup, sendJoinRequest } from '../lib/api/group.api';

import { formatDateWithSuffix } from '../lib/util/timeFormat';

import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import TertiaryButton from './TertiaryButton'
import AnimatedModal from './AnimatedModal';

/* 
 * GroupButtons Component
 
 * Displays the action buttons in a group profile
 * displays different buttons based on user role (visitor/ member/ admin)
 
 * Visitor: send or cancel join request
 * Member: open chat, leave group
 * Admin: open chat, edit group, leave group   

 * Integrates with API functions:
 * - `sendJoinRequest`, `cancelJoinRequest`, `leaveGroup`
 
 * Uses utility functions: `formatDateWithSuffix` 
 
 * params:
 * - group: group in which we display the buttons
 * - openEdit: function to open the edit group modal
 * - onJoin: callback function to update group and groups list after sending a join request
 * - onCancelRequest: callback function to update group and groups list after canceling a join request
 * - onLeave: callback function to update group and groups list after leaving group
*/
const GroupButtons = ({ group, openEdit, onJoin, onCancelRequest, onLeave }) => {
    const { selectChat, selectedChat, resetChat } = useChatStore();
    const navigate = useNavigate()
    const { authUser, setAuthUser } = useAuthStore();

    // get user role
    // check if user is an admin
    const isAdmin = group.admins.includes(authUser.userID);
    // check if user is a member
    const isMember = group.members.filter(m => m.user == authUser.userID)[0];
    // check if user has already sent a reaquest
    const sentRequest = group.joinRequests.filter(r => r.user == authUser.userID)[0];
    
    // states
    const [loading, setLoading] = useState(false); // loading state
    const [leaveModal, setLeaveModal] = useState(false); // leave group confirmation modal visibility

    // handle send join request
    const joinGroup = async () => {
        setLoading(true);
        try {
            const res = await sendJoinRequest(group.groupID);
            if(res?.group) {
                setAuthUser(res.user);
                onJoin(res.group, res.request);
            }   
        } catch (error) {
            console.log("error on send join request in group buttons", error);
        } finally {
            setLoading(false);
        }
    }

    // handle cancel request
    const cancelRequest = async () => {
        setLoading(true);
        try {
            const res = await cancelJoinRequest(group.groupID);
            if(res?.group) {
                setAuthUser(res.user);
                onCancelRequest(res.group)
            }   
        } catch (error) {
            console.log("error in cancel join request in group buttons", error);
        } finally {
            setLoading(false);
        }
    }

    // handle leave group
    const leave = async () => {
        setLoading(true);
        try {
            const res = await leaveGroup(group.groupID);
            if(res) {
                onLeave(res.group, group.groupID);
                // if selected chat is the group chat of which we left then clear the chat states
                if(selectedChat?.isGroup && selectedChat?.group?.groupID === group.groupID) {
                    resetChat();
                }
            }   
        } catch (error) {
            console.log("error in leave group in group buttons", error);
        } finally {
            setLeaveModal(false); // close modal
            setLoading(false);
        }
    } 

    // handle open group chat
    const openChat = async () => {
        await selectChat({
            groupID: group.groupID,
            navigate: navigate("/")
        });
    }

  return (
    <>
        <div className='flex flex-col gap-1 lg:items-end my-3 lg:absolute lg:top-[-50px] lg:right-8'>
            {/* text details */}
            <p className='text-xs lg:text-sm text-light-txt2 dark:text-dark-txt2'>
                {
                    isMember ? `Member since ${formatDateWithSuffix(isMember.joinedAt)}` : // if user is member
                    sentRequest ? `Your join request is pending since ${formatDateWithSuffix(sentRequest.requestedAt)}` : // if user already sent a request
                    "You are not a member of this group. Send a request to join" // if user is just visitor
                }
            </p>
            {/* buttons */}
            <div className='flex items-center gap-4'>
                {
                    // if user is admin
                    isAdmin ? (
                        <>
                            {/* open chat button */}
                            <PrimaryButton 
                                text='Message' 
                                className='py-2 px-4 mt-2 text-sm lg:text-[16px]' 
                                leftIcon={<MessageSquareMore className='size-5 lg:size-6' />} 
                                disabled={loading}       
                                onClick={openChat}
                            />
                            {/* edit group button (open edit modal) */}
                            <TertiaryButton 
                                text='Edit'
                                className='py-2 px-4 mt-2 text-sm lg:text-[16px]'
                                leftIcon={<PenLine className='size-5 lg:size-6' />}
                                disabled={loading}
                                onClick={openEdit}
                            />
                            {/* leave group button (open confirmation modal) */}
                            <SecondaryButton 
                                text='Leave' 
                                className='py-2 px-4 mt-2 text-sm lg:text-[16px]' 
                                leftIcon={<LogOut className='size-5 lg:size-6' />}
                                disabled={loading}
                                onClick={() => setLeaveModal(true)}
                            />
                        </>
                    ) : 
                    // if user is member
                    isMember ? (
                        <>
                            {/* open chat button */}
                            <PrimaryButton 
                                text='Message' 
                                className='py-2 px-4 mt-2 text-sm lg:text-[16px]' 
                                leftIcon={<MessageSquareMore className='size-5 lg:size-6' />} 
                                disabled={loading}       
                                onClick={openChat}
                            />
                            {/* leave group buttons (open confirmation modal) */}
                            <SecondaryButton 
                                text='Leave' 
                                className='py-2 px-4 mt-2 text-sm lg:text-[16px]' 
                                leftIcon={<LogOut className='size-5 lg:size-6' />}
                                disabled={loading}
                                onClick={() => setLeaveModal(true)}
                            />
                        </>
                    ) :
                    // if user is visitor and already sent a request
                    sentRequest ? (
                        /* cancel request button */
                        <SecondaryButton 
                            text='Cancel Request' 
                            isColored={false} 
                            className='py-2 px-4 mt-2 text-sm lg:text-[16px]' 
                            leftIcon={<X className='size-5 lg:size-6' />}
                            disabled={loading}
                            onClick={cancelRequest}
                        />
                    ) : (
                        // if user didn't send a request
                        /* send join request button */
                        <PrimaryButton 
                            text='Join' 
                            className='py-2 px-4 mt-2 text-sm lg:text-[16px]' 
                            leftIcon={<CirclePlus className='size-5 lg:size-6' />} 
                            disabled={loading}
                            onClick={joinGroup}
                        />
                    )

                }
            </div>
        </div>
        {/* leave group confirmation modal */}
        <AnimatePresence>
        {
            leaveModal && (
                <AnimatedModal 
                    onClose={() => setLeaveModal(false)}
                    className='h-fit max-h-[40%] w-[50%] min-w-[350px] rounded-2xl flex flex-col items-center justify-center p-10 gap-4 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'
                >   
                    <h3 className='text-danger lg:text-xl font-semibold flex items-center gap-2'>
                        <TriangleAlert className='size-5' />
                        <span> Confirm Leaving</span>
                        <TriangleAlert className='size-5' />
                    </h3>
                    <p className='text-sm text-light-txt dark:text-dark-txt text-center flex flex-col items-center'>
                        <span>
                            You are about to leave <strong>{group.name}</strong>.
                        </span>
                        <span>
                            You will no longer be able to participate in the group chat unless added again.
                        </span>
                    </p>
                        <div className='mt-2 flex items-center gap-4 w-[80%] min-w-min-w-[300px]'>
                        <TertiaryButton
                            text="Cancel"
                            className='p-2 flex-1 text-sm lg:text-[16px]'
                            type='button'
                            disabled={loading}
                            onClick={() => setLeaveModal(false)}
                        />
                        <SecondaryButton
                            text="Leave"
                            className='p-2 flex-1 text-sm lg:text-[16px]'
                            type='button'
                            isColored={true}
                            disabled={loading}
                            onClick={leave}
                        />
                    </div>
                </AnimatedModal>
            )
        }
        </AnimatePresence>
    </>
  )
}

export default GroupButtons