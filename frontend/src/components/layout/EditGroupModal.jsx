import { PenLine, TriangleAlert } from 'lucide-react';
import React, { useState } from 'react'
import PrimaryButton from '../PrimaryButton';
import { deleteGroup, updateGroup } from '../../lib/api/group.api';
import SecondaryButton from '../SecondaryButton';
import TertiaryButton from '../TertiaryButton';

const EditGroupModal = ({group, onClose, onUpdate, updateList}) => {

    const [activeSection, setActiveSection] = useState("edit");
    const [loading, setLoading] = useState(false);
    const [banner, setBanner] = useState(null);
    const [image, setImage] = useState(null);
    const [name, setName] = useState(group.name);
    const [error, setError] = useState("");
    const [description, setDescription] = useState(group.description || "");

    const [confirmName, setConfirmName] = useState("");

    const handleBannerUpload = (e) => {
        const file = e.target.files[0];
        if(!file) return;

        const reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64Image = reader.result;
            setBanner(base64Image)
        }
    }

    const handleGroupImageUpload = (e) => {
        const file = e.target.files[0];
        if(!file) return;

        const reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64Image = reader.result;
            setImage(base64Image)
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        if(loading) return;
        if(!name.trim()) {
            setError("Name cannot be empty");
            return;
        }
        try {
            setLoading(true);
            const res = await updateGroup(group.groupID, name, banner, image, description);

            if(res) {
                updateList(prev => prev.map(g => g.groupID == group.groupID ? res : g))
                onUpdate(res);
                onClose();
            }   
        } catch (error) {
            console.log("error in update group: ", error)
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (event) => {
        event.preventDefault();
        if(loading) return;
        setLoading(true);
        try {
            console.log("deleting group");
            await deleteGroup(group.groupID);
            updateList(prev => prev.filter(g => g.groupID !== group.groupID))
            onUpdate(null);
            onClose()
            console.log("group deleted");
        } catch (error) {
            console.log("error in delete group: ", error);
        } finally {
            setLoading(false);
        }
    }

  return (
    <div onClick={onClose} 
        className='bg-[#00000066] dark:bg-[#ffffff33] fixed inset-0 z-50 flex items-center justify-center'
    >
       {    activeSection == "edit" && (
         <form 
            onSubmit={handleSubmit} 
            onClick={(e) => e.stopPropagation()} 
            className='h-[90%] w-[80%] min-w-[350px] rounded-2xl overflow-y-scroll bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'>
            {/* pictures */}
            <div className='w-full h-[270px] relative'>
                {/* banner image */}
                {
                banner ? <img src={banner} className='w-full h-[200px] object-cover' /> :
                group.banner ? <img src={group.banner} className='w-full h-[200px] object-cover' /> :
                <div className='w-full h-[200px] bg-light-300 dark:bg-dark-300'></div> 
                }
                <label 
                htmlFor='banner-input'
                title='Change banner'
                className='size-10 flex items-center justify-center rounded-[50%] 
                absolute right-8 top-[180px] cursor-pointer border-2 border-light-txt dark:border-dark-txt
                bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt
                hover:bg-primary hover:text-inverted hover:border-inverted'
                >
                <PenLine className='size-6' />
                <input 
                    type="file"
                    id='banner-input'
                    className='hidden'
                    accept='image/*'
                    onChange={handleBannerUpload}
                    disabled={loading} 
                />
                </label>
                {/* group image */}
                <img src={image ? image : group.image ? group.image : "/assets/group-avatar.svg"} className='size-[150px] rounded-[50%] absolute left-8 bottom-0 border-4 border-light-100 dark:border-dark-100' />
                <label 
                htmlFor='image-input'
                title='Change group image'
                className='size-10 flex items-center justify-center rounded-[50%] 
                absolute left-[140px] bottom-2 cursor-pointer border-2 border-light-txt dark:border-dark-txt
                bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt
                hover:bg-primary hover:text-inverted hover:border-inverted'
                >
                <PenLine className='size-6' />
                <input 
                    type="file"
                    id='image-input'
                    className='hidden'
                    accept='image/*'
                    onChange={handleGroupImageUpload}
                    disabled={loading} 
                />
                </label>
            </div>

            {/* other infos */}
            <div className='w-full p-3 my-2 lg:pl-10 flex flex-col gap-3'>
                 {/* name input */}
                <div className='w-1/2 min-w-[300px]'>
                    <label htmlFor='name' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
                        Name
                    </label>                
                    <input 
                        id='name'
                        type="text"
                        className={`p-1 w-full outline-0 
                        ${ error ? 'border-b-2 border-danger text-danger' : 
                            'border-b-1 border-light-txt2 dark:border-dark-txt2 focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt text-light-txt dark:text-dark-txt'}  
                        `} 
                        placeholder='Group Name'
                        value={name}
                        onChange={(e) => {
                        setName(e.target.value)
                        if (error) setError("");
                        }}
                    />
                    <span className={`text-xs ${error ? 'text-danger' : 'text-transparent'}`}>
                        { error || "placeholder" }
                    </span>
                </div>
                
                {/* bio textarea */}
                <div className='w-1/2 min-w-[300px]'>
                    <label htmlFor='description' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
                        Description
                    </label>                
                    <textarea 
                        id='description'
                        rows={3}
                        maxLength={150}
                        className={`p-1 w-full resize-none outline-0 
                            border-b-1 border-light-txt2 dark:border-dark-txt2 
                            focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt 
                            text-light-txt dark:text-dark-txt`} 
                        placeholder='Tell us a little about your group...'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <span className='text-xs text-light-txt2 dark:text-dark-txt2 pl-1'>
                        {description.length}/150
                    </span>
                </div>
            </div>
            {/* buttons */}
            <div className='w-1/2 min-w-[300px] p-3 my-2 lg:pl-10 flex flex-col items-center gap-3'>
                <PrimaryButton 
                    text="Save" 
                    className='w-full p-2 m-2' 
                    type='submit'
                    loading={loading} 
                />
                <div className='flex items-center gap-4 w-full min-w-min-w-[300px]'>
                    <SecondaryButton
                        text="Delete"
                        className='p-2 flex-1'
                        type='button'
                        isColored={true}
                        disabled={loading}
                        onClick={() => setActiveSection("delete")}
                    />
                    <TertiaryButton
                        text="Cancel"
                        className='p-2 flex-1'
                        type='button'
                        disabled={loading}
                        onClick={onClose}
                    />
                </div>
            </div>
         </form>)
       } 
       { activeSection == "delete" && (
         <form 
            onSubmit={handleDelete}
            onClick={(e) => e.stopPropagation()} 
            className='h-[90%] w-[80%] min-w-[350px] rounded-2xl overflow-y-scroll bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'
         >
            {/* pictures */}
            <div className='w-full h-[270px] relative'>
            {/* banner image */}
            {
                group.banner ? <img src={group.banner} className='w-full h-[200px] object-cover' /> :
                <div className='w-full h-[200px] bg-light-300 dark:bg-dark-300'></div> 
            }
            {/* group image */}
            <img src={group.image ? group.image : "/assets/group-avatar.svg"} className='size-[150px] rounded-[50%] absolute left-8 bottom-0 border-4 border-light-100 dark:border-dark-100' />
            </div>
            {/* main infos */}
            <div className='w-full p-3 mb-2 lg:pl-10 relative'>
                <span className='text-2xl font-bold'>{group.name}</span>
            </div>
            {/* confirm input */}
            <div className='w-full p-3 mt-2 lg:pl-10 flex flex-col gap-3'>
                <h3 className='text-danger text-xl font-semibold flex items-center gap-2'>
                    <TriangleAlert className='size-5' />
                    <span>Warning: This action is irreversible.</span>
                    <TriangleAlert className='size-5' />
                </h3>
                <span className='text-sm text-danger'>
                    You are about to permanently delete this group. All associated data will be lost, and this cannot be undone.
                </span>
                <div className='w-1/2 min-w-[300px]'>
                    <label htmlFor='confirm-name' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
                        {`Type "${group.name}" to confirm deletion`}
                    </label>                
                    <input 
                        id='confirm-name'
                        type="text"
                        className='p-1 w-full outline-0 border-b-1 border-light-txt2 dark:border-dark-txt2 focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt text-light-txt dark:text-dark-txt'  
                        placeholder='Group Name'
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                    />
                </div>
            </div>
            {/* buttons */}
            <div className='px-8 py-4'>
                <SecondaryButton 
                    text="Delete" 
                    className='w-1/2 min-w-[300px] p-2 m-2' 
                    type='submit'
                    isColored={true}
                    loading={loading} 
                    disabled={confirmName !== group.name}
                />
                <TertiaryButton
                    text="Go Back"
                    className='w-1/2 min-w-[300px] p-2 m-2'
                    type='button'
                    disabled={loading}
                    onClick={() => setActiveSection("edit")}
                />
            </div>
         </form>)
       }
    </div>
  )
}

export default EditGroupModal