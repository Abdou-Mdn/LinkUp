import React, { useRef, useState } from 'react'
import { ImageOff, PenLine, TriangleAlert, X } from 'lucide-react';
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'motion/react';;

import { useChatStore } from '../../store/chat.store';

import { deleteGroup, updateGroup } from '../../lib/api/group.api';

import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton';
import TertiaryButton from '../TertiaryButton';
import TextInput from '../TextInput';
import DynamicTextarea from '../DynamicTextarea';
import AnimatedModal from '../AnimatedModal';



/* 
 * EditGroupModal Component
 
 * A modal dialog that handles editing & deleting a group:
  
 * Features: 
 * -Edit section** → edit group's name, image, banner, description.
 * -Delete section** → delete the group and all related data (destructive action).
  
 * Integrates with API functions:
 * - `editGroup`, `deleteGroup`
 
 * params:
 * - group: group infos to display and edit in the modal 
 * - onClose: callback function to close the modal
 * - onUpdate: callback function to update the group and groups list after editing the group
 * - onDelete: callback function to update the group and groups list after deleting the group
*/
const EditGroupModal = ({group, onClose, onUpdate, onDelete}) => {
    const { selectedChat, resetChat } = useChatStore()

    // UI states
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState("edit");

    // edit form states
    const [banner, setBanner] = useState(null);
    const [image, setImage] = useState(null);
    const [name, setName] = useState(group.name);
    const [error, setError] = useState("");
    const [description, setDescription] = useState(group.description || "");

    // file input refs
    const bannerInputRef = useRef(null);
    const imageInputRef = useRef(null);


    const isDisabled = (!banner && !image) && (name == group.name) && (description == group.description);

    // delete form state
    const [confirmName, setConfirmName] = useState("");

    // states for framer motion animation
    const [direction, setDirection] = useState(0)
    const sectionVariants = {
        initial: (direction) => ({
            x: direction > 0 ? 500 : direction < 0 ? -500 : 0,
            opacity: direction === 0 ? 1 : 0,
        }),
        animate: {
            x: 0,
            opacity: 1,
        },
        exit: (direction) => ({
            x: direction > 0 ? -500 : direction < 0 ? 500 : 0,
            opacity: 0
        })
    }

    // handle go to delete section
    const handleOpenDelete = () => {
        setDirection(1);
        setActiveSection("delete");
    }

    // handle go to edit section
    const handleOpenEdit = () => {
        setDirection(-1);
        setActiveSection("edit");
    }

    // handle banner image upload
    const handleBannerUpload = (e) => {
        const file = e.target.files[0];
        if(!file) return;

        // accept image only
        if(!file.type.startsWith("image/")){
            toast.error("Please select an image file");
            return;
        }

        const reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64Image = reader.result;
            setBanner(base64Image)
        }
    }

    // handle remove uploaded banner image
    const handleBannerRemove = () => {
        setBanner(null);
        if(bannerInputRef.current) bannerInputRef.current.value = ''
    }

    // handle avatar image upload
    const handleGroupImageUpload = (e) => {
        const file = e.target.files[0];
        if(!file) return;

        // accept image only
        if(!file.type.startsWith("image/")){
            toast.error("Please select an image file");
            return;
        }

        const reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64Image = reader.result;
            setImage(base64Image)
        }
    }

    // handle remove uploaded group image
    const handleGroupImageRemove = () => {
        setImage(null);
        if(imageInputRef.current) imageInputRef.current.value = ''
    }
    // handle edit group
    const handleSubmit = async (event) => {
        event.preventDefault();
        if(loading) return;
        // validate name
        if(!name.trim()) {
            setError("Name cannot be empty");
            return;
        }
        try {
            setLoading(true);
            const res = await updateGroup(group.groupID, name, banner, image, description);

            if(res?.group) {
                // update group and groups list with the new updated group returned by backend & close modal
                onUpdate(res.group);
                onClose();
            }   
        } catch (error) {
            console.log("error in update group: ", error)
        } finally {
            setLoading(false);
        }
    }

    // handle delete group
    const handleDelete = async (event) => {
        event.preventDefault();
        if(loading) return;
        setLoading(true);
        try {
            await deleteGroup(group.groupID);
            // update group and groups list after deleting group & close modal
            onDelete(group.groupID);
            onClose()
            // reset chat states if related group chat was open
            if(selectedChat?.isGroup && selectedChat?.group?.groupID === group.groupID) {
                resetChat();
            }
        } catch (error) {
            console.log("error in delete group: ", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatedModal
            onClose={onClose}
            className={`h-fit max-h-[90%] w-[95%] ${activeSection == "edit" ? 'lg:w-[80%]' : 'lg:w-[60%]'} min-w-[350px] border-1 rounded-2xl overflow-y-auto scrollbar border-light-txt2 dark:border-dark-txt2 bg-light-100 dark:bg-dark-100 text-light-txt dark:text-dark-txt`}
        >
            <div className='size-full overflow-x-hidden'>
                <AnimatePresence initial={false} custom={direction} mode='wait'>
                    {/* ** Edit section */}
                    {   activeSection == "edit" && (
                            <motion.form
                                key="edit"
                                onSubmit={handleSubmit} 
                                className='size-full'
                                custom={direction}
                                variants={sectionVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ 
                                    x: { type: 'tween', ease: 'linear', duration: 0.2 },
                                    opacity: { duration: 0.2, ease: 'linear' }
                                }}
                            >
                                {/* pictures */}
                                <div className='w-full h-[190px] lg:h-[270px] relative'>
                                    {/* banner image */}
                                    { banner ? <img src={banner} className='w-full h-[140px] lg:h-[200px] object-cover' /> :
                                        group.banner ? <img src={group.banner} className='w-full h-[140px] lg:h-[200px] object-cover' /> :
                                        <div className='w-full h-[140px] lg:h-[200px] bg-light-300 dark:bg-dark-300'></div> 
                                    }
                                    {/* edit banner button (file uploader) */}
                                    <div
                                        title={ banner ? 'Reset banner' : 'Change banner'}
                                        className='size-8 lg:size-10 flex items-center justify-center rounded-full absolute right-8 top-[125px] lg:top-[180px] border-2 border-light-txt dark:border-dark-txt bg-light-100 dark:bg-dark-100 hover:bg-light-300 hover:dark:bg-dark-300 text-light-txt  dark:text-dark-txt'
                                    >
                                        <button
                                            type='button'
                                            onClick={banner ? handleBannerRemove : () => bannerInputRef.current?.click()}
                                            className='size-full rounded-full flex items-center justify-center cursor-pointer'
                                        >
                                            {
                                                banner ? <ImageOff className='size-5 lg:size-6' /> : <PenLine className='size-5 lg:size-6' />
                                            }
                                        </button>
                                        <input 
                                            ref={bannerInputRef}
                                            type="file"
                                            id='banner-input'
                                            className='hidden'
                                            accept='image/*'
                                            onChange={handleBannerUpload}
                                            disabled={loading} 
                                        />
                                    </div>
                                    {/* group image */}
                                    <img src={image ? image : group.image ? group.image : "/assets/group-avatar.svg"} className='size-[100px] lg:size-[150px] rounded-full absolute left-4 lg:left-8 bottom-0 border-4 border-light-100 dark:border-dark-100' />
                                    {/* edit image button (file uploader) */}
                                    <div
                                        title={ image ? 'Reset image' : 'Change image'}
                                        className='size-8 lg:size-10 flex items-center justify-center rounded-full absolute left-[90px] lg:left-[140px] bottom-1 lg:bottom-2 border-2 border-light-txt dark:border-dark-txt bg-light-100 dark:bg-dark-100 hover:bg-light-300 hover:dark:bg-dark-300 text-light-txt  dark:text-dark-txt'
                                    >
                                        <button
                                            type='button'
                                            onClick={image ? handleGroupImageRemove : () => imageInputRef.current?.click()}
                                            className='size-full rounded-full flex items-center justify-center cursor-pointer'
                                        >
                                            {
                                                image ? <ImageOff className='size-5 lg:size-6' /> : <PenLine className='size-5 lg:size-6' />
                                            }
                                        </button>
                                        <input 
                                            ref={imageInputRef}
                                            type="file"
                                            id='banner-input'
                                            className='hidden'
                                            accept='image/*'
                                            onChange={handleGroupImageUpload}
                                            disabled={loading} 
                                        />
                                    </div>
                                </div>

                                {/* other infos */}
                                <div className='w-full p-3 my-2 lg:pl-10 flex flex-col gap-3'>
                                    {/* name input */}
                                    <TextInput
                                        label='Name'
                                        placeholder='Group Name'
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value)
                                            if (error) setError("");
                                        }}
                                        isPassword={false}
                                        error={error}
                                    />
                                    
                                    {/* description textarea */}
                                    <DynamicTextarea
                                        label='Description'
                                        placeholder='Tell us a little about your group...'
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                {/* buttons */}
                                <div className='lg:w-1/2 min-w-[300px] p-3 my-2 lg:pl-10 flex flex-col items-center gap-3'>
                                    {/* submit button (edit) */}
                                    <PrimaryButton 
                                        text="Save" 
                                        className='w-full p-2 m-2' 
                                        type='submit'
                                        loading={loading} 
                                        disabled={isDisabled}
                                    />
                                    <div className='flex items-center gap-4 w-full min-w-min-w-[300px]'>
                                        {/* open delete section */}
                                        <SecondaryButton
                                            text="Delete"
                                            className='p-2 flex-1'
                                            type='button'
                                            isColored={true}
                                            disabled={loading}
                                            onClick={handleOpenDelete}
                                        />
                                        {/* close modal */}
                                        <TertiaryButton
                                            text="Cancel"
                                            className='p-2 flex-1'
                                            type='button'
                                            disabled={loading}
                                            onClick={onClose}
                                        />
                                    </div>
                                </div>
                            </motion.form>
                        )
                    }
                    {/* ** Delete section */}
                    {   activeSection == "delete" && (
                            <motion.form
                                key="delete"
                                onSubmit={handleDelete}
                                className='size-full'
                                custom={direction}
                                variants={sectionVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ 
                                    x: { type: 'tween', ease: 'linear', duration: 0.2 },
                                    opacity: { duration: 0.2, ease: 'linear' }
                                }}
                            >
                                {/* pictures */}
                                <div className='w-full h-[190px] lg:h-[270px] relative'>
                                {/* banner image */}
                                {
                                    group.banner ? <img src={group.banner} className='w-full h-[140px] lg:h-[200px] object-cover' /> :
                                    <div className='w-full h-[140px] lg:h-[200px] bg-light-300 dark:bg-dark-300'></div> 
                                }
                                {/* group image */}
                                <img src={group.image ? group.image : "/assets/group-avatar.svg"} className='size-[100px] lg:size-[150px] rounded-full absolute left-4 lg:left-8 bottom-0 border-4 border-light-100 dark:border-dark-100' />
                                </div>
                                {/* main infos */}
                                <div className='w-full p-3 mb-2 lg:pl-10 relative'>
                                    <span className='text-xl lg:text-2xl font-bold'>{group.name}</span>
                                </div>
                                {/* confirm input */}
                                <div className='w-full p-3 mt-2 lg:pl-10 flex flex-col gap-3'>
                                    {/* warning text */}
                                    <h3 className='lg:text-xl font-semibold flex items-center gap-2 text-danger'>
                                        <TriangleAlert className='size-5' />
                                        <span>Warning: This action is irreversible.</span>
                                        <TriangleAlert className='size-5' />
                                    </h3>
                                    <span className='text-sm text-danger'>
                                        You are about to permanently delete this group. All associated data will be lost, and this cannot be undone.
                                    </span>
                                    {/* group name input */}
                                    <TextInput
                                        label={`Type "${group.name}" to confirm deletion`}
                                        placeholder='Group Name'
                                        isPassword={false}
                                        value={confirmName}
                                        onChange={(e) => setConfirmName(e.target.value)}
                                    />
                                </div>
                                {/* buttons */}
                                <div className='lg:w-1/2 py-4 flex flex-col items-center'>
                                    {/* submit button (delete) */}
                                    <SecondaryButton 
                                        text="Delete" 
                                        className='min-w-[300px] p-2 m-2' 
                                        type='submit'
                                        isColored={true}
                                        loading={loading} 
                                        disabled={confirmName !== group.name}
                                    />
                                    {/* go back to edit section */}
                                    <TertiaryButton
                                        text="Go Back"
                                        className='min-w-[300px] p-2 m-2'
                                        type='button'
                                        disabled={loading}
                                        onClick={handleOpenEdit}
                                    />
                                </div>
                            </motion.form>
                        )
                    }
                </AnimatePresence>
            </div>
        </AnimatedModal>
    )
}

export default EditGroupModal