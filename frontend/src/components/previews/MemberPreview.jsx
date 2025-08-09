import React from 'react'
import { useAuthStore } from '../../store/auth.store'
import { formatDateWithSuffix } from '../../lib/util/timeFormat'
import { BadgeCheck, BadgePlus, BadgeX, TriangleAlert, UserCheck, UserX, X } from 'lucide-react'
import PrimaryButton from '../PrimaryButton'
import SecondaryButton from '../SecondaryButton'
import TertiaryButton from '../TertiaryButton'
import { useState } from 'react'
import { demoteFromAdmin, promoteToAdmin, removeMember } from '../../lib/api/group.api'
import toast from 'react-hot-toast'

const displayToast = () => {
    return toast.success(
        (t) => (
            <span className="flex items-center gap-2">
                Ikhti has been promoted to admin.
                <button
                    onClick={() => {
                    toast.dismiss(t.id);
                    }}
                    className="text-blue-600 hover:underline"
                >
                    Undo
                </button>
            </span>
        )
    );
}


const MemberPreview = ({member, groupID = null, isFriend = false, isAdmin = false, displayControls = false, onRemove, onPromote, onDemote}) => {
    const { authUser } = useAuthStore();
    const isMe = authUser.userID === member.userID;

    const [removeModal, setRemoveModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRemove = async () => {
        if (loading) return;
        try {
            setLoading(true);
            const res = await removeMember(groupID, member.userID);
            if(res?.group) {
                if(onRemove) {
                    onRemove(res.group, member.userID);
                }
                setRemoveModal(false);
            }
        } catch (error) {
            console.log("error in remove member", error);
        } finally {
            setLoading(false)
        }
    }

    const handlePromote = async () => {
        if (loading) return;
        try {
            setLoading(true);
            const res = await promoteToAdmin(groupID, member.userID, false);
            if(res?.group) {
                toast.success(
                    (t) => (
                        <span className="flex items-center gap-2">
                            {res.message}
                            <button
                                onClick={async () => {
                                    toast.dismiss(t.id);
                                    const promise = demoteFromAdmin(groupID, member.userID, true)
                                    toast.promise(
                                        promise,
                                        {
                                            loading: 'Removing from admins',
                                            success: <b>{member.name} is no longer an admin.</b>,
                                            error: <b>An error has occured, please try again!</b>
                                        }
                                    );
                                    const result = await promise;
                                    if (result?.group && onDemote) onDemote(result.group);
                                }}
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
            setLoading(false);
        }
    }

    const handleDemote = async () => {
        if (loading) return;
        try {
            setLoading(true);
            const res = await demoteFromAdmin(groupID, member.userID, false);
            if(res?.group) {
                toast.success(
                    (t) => (
                        <span className="flex items-center gap-2">
                            {res.message}
                            <button
                                onClick={async () => {
                                    toast.dismiss(t.id);
                                    const promise = promoteToAdmin(groupID, member.userID, true);
                                    toast.promise(
                                       promise,
                                        {
                                            loading: 'Promoting to admin',
                                            success: <b>{member.name} has been promoted to admin.</b>,
                                            error: <b>An error has occured, please try again!</b>
                                        }
                                    )
                                    const result = await promise;
                                    if (result?.group && onPromote) onPromote(result.group);
                                }}
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
            setLoading(false);
        }
    }
  
  return (
    <>
        <div
            title={member.name} 
            className='w-full flex items-center gap-3 p-2
            bg-light-200 dark:bg-dark-200 text-light-txt dark:text-dark-txt hover:bg-light-100 dark:hover:bg-dark-100'
        >
            <img src={member.profilePic ? member.profilePic : '/assets/avatar.svg'} className='size-12 rounded-[50%]'/>
            <div className='flex-1'>
                    <div className='font-semibold flex flex-row items-center gap-2'>
                        <span className='truncate'>{member.name}</span>
                        { isMe && <span className='text-xs font-medium text-light-txt2 dark:text-dark-txt2'>{'(You)'}</span>}
                        <div className='flex flex-row items-center gap-1'>
                            { isFriend && <span title='You are already friends'><UserCheck className='size-5 fill-primary text-primary'/></span> }
                            { isAdmin && <span title='Administrator'><BadgeCheck className='size-5 fill-primary text-light-txt dark:text-dark-txt'/></span> }
                        </div>
                    </div>
                    <p className='text-xs truncate text-light-txt2 dark:text-dark-txt2'>
                        <span>{`Member since ${formatDateWithSuffix(member.joinedAt)}`}</span>
                        
                    </p>
            </div>
            {
                !isMe && displayControls && (
                    <div className='flex items-center gap-2'>
                        {
                            isAdmin ? (
                                <TertiaryButton 
                                    leftIcon={<BadgeX className='size-6' />} 
                                    toolip="Demote from admin" 
                                    className='p-1 rounded-lg'
                                    loading={loading}
                                    onClick={handleDemote} 
                                />
                            ) : (
                                <TertiaryButton 
                                    leftIcon={<BadgePlus className='size-6' />} 
                                    toolip="Promote to admin" 
                                    className='p-1 rounded-lg'
                                    loading={loading}
                                    onClick={handlePromote} 
                                />
                            )
                        }
                        <SecondaryButton 
                            leftIcon={<UserX className='size-6' />} 
                            toolip="Remove member" 
                            className='p-1 rounded-lg'
                            isColored={false}
                            onClick={() => setRemoveModal(true)}
                            disabled={loading}
                        />
                    </div>
                )
            }
        </div>
        {
            removeModal && (
                <div onClick={() => setRemoveModal(false)} 
                    className='bg-[#00000066] dark:bg-[#ffffff33] fixed inset-0 z-50 flex items-center justify-center'
                >
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className='h-[40%] w-[50%] min-w-[350px] rounded-2xl flex flex-col items-center justify-center p-10 gap-4 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'
                    >
                        <h3 className='text-danger text-xl font-semibold flex items-center gap-2'>
                            <TriangleAlert className='size-5' />
                            <span> Confirm Member Removal</span>
                            <TriangleAlert className='size-5' />
                        </h3>
                        <span className='text-sm text-light-txt dark:text-dark-txt text-center'>
                            You are about to remove <strong>{member.name}</strong> from this group.
                            They will no longer be able to participate in the group chat unless added again.
                        </span>
                         <div className='mt-2 flex items-center gap-4 w-[80%] min-w-min-w-[300px]'>
                            <TertiaryButton
                                text="Cancel"
                                className='p-2 flex-1'
                                type='button'
                                disabled={loading}
                                onClick={() => setRemoveModal(false)}
                            />
                            <SecondaryButton
                                text="Delete"
                                className='p-2 flex-1'
                                type='button'
                                isColored={true}
                                disabled={loading}
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