import React, { useState } from 'react'
import { BadgeCheck, BadgePlus, BadgeX, TriangleAlert, UserCheck, UserX } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuthStore } from '../../store/auth.store'

import { demoteFromAdmin, promoteToAdmin, removeMember } from '../../lib/api/group.api'

import { formatDateWithSuffix } from '../../lib/util/timeFormat'

import PrimaryButton from '../PrimaryButton'
import SecondaryButton from '../SecondaryButton'
import TertiaryButton from '../TertiaryButton'


/* 
 * MemberPreview component
 * Preview for members list in group's profile.

 * - Displays member infos: profile pic, name, online status.
 * - Displays joining date as additional infos.
 * - Displays action buttons (promote/demote, remove)
 
 * Integrates with API functions:
 * - `promoteToAdmin`, `demoteFromAdmin`, `removeMember`
 
 * Uses utility function: `formatDateWithSuffix`

 * params:
 * - member: object infos to display
 * - groupID: group targeted by member actions
 * - isFriend: boolean to control whether member is my friend or not
 * - isAdmin: boolean to control whether member is an admin of this group or not
 * - displayControls: boolean to control action buttons visibility (only admin can use them) 
 * - onRemove: callback function to update group and groups list after removing the member
 * - onPromote: callback function to update group after promoting the member 
 * - onDemote: callback function to update group after demoting the member
*/
const MemberPreview = ({member, groupID = null, isFriend = false, isAdmin = false, displayControls = false, onRemove, onPromote, onDemote}) => {
    const { authUser } = useAuthStore();
    // check if member is me
    const isMe = authUser.userID === member.userID;
    // check if member is currently online
    const isOnline = true;

    // member removal confirmation modal visibility
    const [removeModal, setRemoveModal] = useState(false); 
    // loading states
    const [removing, setRemoving] = useState(false);
    const [promoting, setPromoting] = useState(false); 

    // handle remove member
    const handleRemove = async () => {
        setRemoving(true);
        try {
            const res = await removeMember(groupID, member.userID);
            if(res?.group) {
                if(onRemove) {
                    onRemove(res.group, member.userID);
                }
                // close modal after removing member
                setRemoveModal(false);
            }
        } catch (error) {
            console.log("error in remove member", error);
        } finally {
            setRemoving(false)
        }
    }

    // handle undo action from promotion/demotion success toast
    const handleUndo = async (toastID, fromPromote = true) => {
        // dismiss current toast
        toast.dismiss(toastID);
        setPromoting(true);
        try {
            let promise;
            // call demote or promote action
            if(fromPromote) {
                promise = demoteFromAdmin(groupID, member.userID, true);
            } else {
                promise = promoteToAdmin(groupID, member.userID, true);
            }
            
            // display new promise toast
            toast.promise(
                promise,
                {
                    loading: fromPromote ? 'Removing from admins' : 'Promoting to admin',
                    success: fromPromote ? <b>{member.name} is no longer an admin.</b> : <b>{member.name} has been promoted to admin.</b>,
                    error: <b>An error has occured, please try again!</b>
                }
            );
            const res = await promise;
            if (res?.group) {
                if(fromPromote && onDemote) {
                    onDemote(res.group);
                } else if (onPromote) {
                    onPromote(res.group)
                }
            }   
        } catch (error) {
            console.log("error in undo promote ", error);
        } finally {
            setPromoting(false)
        }
    }

    // handle promote member to admin
    const handlePromote = async () => {
        setPromoting(true);
        try {
            const res = await promoteToAdmin(groupID, member.userID, false);
            if(res?.group) {
                // display success toast with undo button
                toast.success(
                    (t) => (
                        <span className="flex items-center gap-2">
                            {res.message}
                            {/* undo button */}
                            <button
                                onClick={() => handleUndo(t.id, true)}
                                className="text-primary cursor-pointer hover:underline"
                            >
                                Undo
                            </button>
                        </span>
                    )
                );
                if (onPromote) onPromote(res.group);
            }
        } catch (error) {
            console.log("error promoting :", error);
        } finally {
            setPromoting(false);
        }
    }

    // handle demote admin to member
    const handleDemote = async () => {
        setPromoting(true);
        try {
            const res = await demoteFromAdmin(groupID, member.userID, false);
            if(res?.group) {
                // display success toast with undo button
                toast.success(
                    (t) => (
                        <span className="flex items-center gap-2">
                            {res.message}
                            {/* undo button */}
                            <button
                                onClick={() => handleUndo(t.id, false)}
                                className="text-primary cursor-pointer hover:underline"
                            >
                                Undo
                            </button>
                        </span>
                    )
                );
                if (onDemote) onDemote(res.group)
            }
        } catch (error) {
            console.log("error promoting :", error);
        } finally {
            setPromoting(false);
        }
    }
  
  return (
    <>
        <div
            title={member.name} 
            className='w-full flex items-center gap-3 p-2 bg-light-200 dark:bg-dark-200 hover:bg-light-100 dark:hover:bg-dark-100 text-light-txt dark:text-dark-txt'
        >
            {/* profile picture */}
            <div className='flex-shrink-0 relative size-fit'>
                <img src={member.profilePic ? member.profilePic : '/assets/avatar.svg'} className='size-12 rounded-[50%]'/>
                {/* online status */}
                { isOnline && <div className='bg-accent border-3 border-light-200 dark:border-dark-200 size-4.25 rounded-full absolute -right-0.75 -bottom-0.75'></div> }
            </div>
            {/* informations */}
            <div className='flex flex-col min-w-0 flex-1'>
                    {/* name */}
                    <div className='font-semibold flex flex-row items-center gap-2'>
                        <span className='truncate'>{member.name}</span>
                        {/* add (You) if the member is me */}
                        { isMe && <span className='text-xs font-medium text-light-txt2 dark:text-dark-txt2'>{'(You)'}</span>}
                        {/* add admin/friend icon to display member role and friendship status */}
                        <div className='flex flex-row items-center gap-1'>
                            { isFriend && <span title='You are already friends'><UserCheck className='size-5 fill-light-txt dark:fill-dark-txt hover:fill-primary text-light-txt dark:text-dark-txt hover:text-primary'/></span> }
                            { isAdmin && <span title='Administrator'><BadgeCheck className='size-5 hover:fill-primary text-light-txt dark:text-dark-txt'/></span> }
                        </div>
                    </div>
                    {/* join date */}
                    <p className='text-xs truncate text-light-txt2 dark:text-dark-txt2'>
                        <span>{`Member since ${formatDateWithSuffix(member.joinedAt)}`}</span>
                    </p>
            </div>
            {/* action buttons */}
            {
                !isMe && displayControls && (
                    <div className='flex items-center gap-2'>
                        {/* if member is already admin display demote button else display promote button */}
                        {
                            isAdmin ? (
                                <TertiaryButton 
                                    leftIcon={<BadgeX className='size-5 lg:size-6' />} 
                                    toolip="Demote from admin" 
                                    className='p-1 rounded-lg'
                                    onClick={handleDemote} 
                                    loading={promoting}
                                    disabled={removing}
                                    loaderSize='size-5 lg:size-6'
                                />
                            ) : (
                                <PrimaryButton 
                                    leftIcon={<BadgePlus className='size-5 lg:size-6' />} 
                                    toolip="Promote to admin" 
                                    className='p-1 rounded-lg'
                                    onClick={handlePromote}
                                    loading={promoting}
                                    disabled={removing} 
                                    loaderSize='size-5 lg:size-6'
                                />
                            )
                        }
                        {/* remove member button (opens confirmation modal) */}
                        <SecondaryButton 
                            leftIcon={<UserX className='size-5 lg:size-6' />} 
                            toolip="Remove member" 
                            className='p-1 rounded-lg'
                            isColored={true}
                            onClick={() => setRemoveModal(true)}
                            disabled={promoting}
                            loading={removing}
                            loaderSize='size-5 lg:size-6'
                        />
                    </div>
                )
            }
        </div>
        {/* member removal confirmation button */}
        {
            removeModal && (
                <div onClick={() => setRemoveModal(false)} 
                    className='bg-[#00000066] dark:bg-[#ffffff33] fixed inset-0 z-50 flex items-center justify-center'
                >
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className='h-fit max-h-[40%] w-[50%] min-w-[350px] rounded-2xl flex flex-col items-center justify-center p-10 gap-4 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'
                    >
                        {/* warning title and text */}
                        <h3 className='text-danger lg:text-xl font-semibold flex items-center gap-2'>
                            <TriangleAlert className='size-5' />
                            <span> Confirm Member Removal</span>
                            <TriangleAlert className='size-5' />
                        </h3>
                        <p className='text-sm text-light-txt dark:text-dark-txt text-center flex flex-col items-center'>
                            <span>
                                You are about to remove <strong>{member.name}</strong> from this group.
                            </span>
                            <span>
                                They will no longer be able to participate in the group chat unless added again.
                            </span>
                        </p>
                        <div className='mt-2 flex items-center gap-4 w-[80%] min-w-min-w-[300px]'>
                            {/* cancel button (close modal) */}
                            <TertiaryButton
                                text="Cancel"
                                className='p-2 flex-1 text-sm lg:text-[16px]'
                                type='button'
                                disabled={removing}
                                onClick={() => setRemoveModal(false)}
                            />
                            {/* confirm button (remove member) */}
                            <SecondaryButton
                                text="Remove"
                                className='p-2 flex-1 text-sm lg:text-[16px]'
                                type='button'
                                isColored={true}
                                disabled={removing}
                                onClick={handleRemove}
                            />
                        </div>
                    </div>
                </div>
            )
        }
    </>
  )
}

export default MemberPreview