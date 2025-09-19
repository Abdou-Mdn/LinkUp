import React, { useState, useEffect, useRef } from 'react'
import { Check, Ghost } from 'lucide-react';

import { getFriends } from '../../lib/api/user.api';
import { createGroup } from '../../lib/api/group.api';

import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton'
import TertiaryButton from '../TertiaryButton';
import ProfilePreviewSkeleton from '../skeleton/ProfilePreviewSkeleton';
import ProfilePreview from '../previews/ProfilePreview';
import TextInput from '../TextInput';


/* 
 * CreateGroupModal Component
 
 * A modal dialog that handles creating a group:
  
 * Features: 
 * -Name section** → select a name for the group.
 * -Add members section** → select a list of friends to add as members of the group.
  
 * Integrates with API functions:
 * - `getFriends`, `createGroup`
 
 * params:
 * - onClose: callback function to close the modal
 * - onCreate: callback function to update the groups list after creating the group
*/
const CreateGroupModal = ({onClose, onCreate}) => {

    // Ui states
    const [activeSection, setActiveSection] = useState("name");

    // loading friends states (with pagination)
    const [friends, setFriends] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const loaderRef = useRef(null);
    
    // creation states
    const [members, setMembers] = useState(new Set());
    const [name, setName] = useState("");
    const [errors, setErrors] = useState({ name: "", members: ""});
    const [creating, setCreating] = useState(false);

    // function to fetch the friends list with pagination
    const fetchFriends = async (reset = false) => {
        if(!reset && !hasMore) return;
        try {
            const res = await getFriends(reset, page, 10);
    
            if(res?.friends) {
                const newFriends = res.friends;
                const totalPages = res.totalPages;
            
                setFriends(prev => reset ? newFriends : [...prev, ...newFriends]);
                setHasMore((reset ? 1 : page) < totalPages);
                setPage(reset ? 2 : page + 1);
            }   
        } catch (error) {
            console.log("error in fetching friends in create group modal", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    // useEffect load the first page of friends on mount
    useEffect(() => {
        const fetchData = async () => {
          setLoading(true);
          await fetchFriends(true);
        };
    
        fetchData();
    }, []);

    // load next page of friends
    const loadMore = async () => {
        if (loading || loadingMore || !hasMore) return;
        setLoadingMore(true);
        await fetchFriends();
    }

    // toggle member selection
    const toggleMember = (userID) => {
        if(errors.members) {
            setErrors({...errors, members: ""})
        }
        setMembers(prev => {
            const newSet = new Set(prev);
            if(newSet.has(userID)) {
                newSet.delete(userID);
            } else {
                newSet.add(userID);
            }
            return newSet;
        })
    }

    //useEffect hook for infinite scrolling in the "members" section.
    useEffect(() => {
        // exit early if activeSection is not members and there are no more friends
        if (activeSection !== "members" || !hasMore) return;
        
        // uses an IntersectionObserver to detect when the `loaderRef` element enters the viewport.
        const observer = new IntersectionObserver(
          (entries) => {
            // If the loaderRef div is fully visible, load more items
            if(entries[0].isIntersecting) {
              loadMore();
            }
          }, 
          {
            threshold: 1.0 // Trigger only when element is fully in view
          }
        );
    
        // Start observing the loader element
        const target = loaderRef.current
        if(target) {
            observer.observe(target);
        }
        
        // Cleanup observer on unmount or dependency change
        return () => observer.disconnect();
    }, [activeSection, loading, loadingMore]);

    // validate name and advance to next section
    const advance = (event) => {
        event.preventDefault();
        // validate name
        if(!name.trim()) {
            setErrors({...errors, name: "Group name is required"});
            return;
        }
        // move to members section
        setActiveSection("members");
    }

    // handle create group
    const handleSubmit = async (event) => {
        if(creating) return;
        event.preventDefault();
        // validate members (must be at least 2)
        if(members.size < 2) {
            setErrors({...errors, members: "Minimum 2 members required."})
            return;
        }

        // transform members set into an array
        const selectedMembers = Array.from(members);
        setCreating(true);
        try {
            const res = await createGroup({ name, members: selectedMembers});

            if(res?.group) {
                // if group is created update list, reset inputs, && close modal
                onCreate(res.group);
                setName("");
                setMembers(new Set());
                setErrors({name: "", members: ""});
                setActiveSection("name");
                onClose();
            }   
        } catch (error) {
            console.log("error in create group", error);
        } finally {
            setCreating(false)
        }
    }


  return (
    <div onClick={onClose} 
        className='bg-[#00000066] dark:bg-[#ffffff33] fixed inset-0 z-50 flex items-center justify-center'
    >
        <div 
            onClick={(e) => e.stopPropagation()} 
            className={`${activeSection == "name" ? 'h-fit' : 'h-[60%] lg:h-[80%]'} w-[95%] lg:w-[50%] min-w-[350px] rounded-2xl flex items-center justify-center p-8 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt`}
        >
            {/* name section */}
            {
                activeSection == "name" && (
                    <form 
                        onSubmit={advance}
                        className='size-full flex flex-col justify-center items-center gap-8'
                    >
                        {/* title and text */}
                        <div className='text-center'>
                            <h2 className='text-lg lg:text-xl font-bold font-outfit'>Create New Group</h2>
                            <p className='text-sm lg:text-normal text-light-txt2 dark:text-dark-txt2'>Please provide a name for your group</p>
                        </div>
                        {/* name input */}
                        <TextInput 
                            label='Name'
                            placeholder='Group Name'
                            isPassword={false}
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value)
                                if (errors) setErrors({...errors, name: ""});
                            }}
                            error={errors.name}
                        />

                        {/* buttons */}
                        <div className='flex items-center justify-center gap-8'>
                            <SecondaryButton
                                type='button' 
                                text='Cancel' 
                                isColored={false} 
                                className='py-2 px-6 text-sm lg:text-normal' 
                                onClick={onClose}
                            />
                            <PrimaryButton 
                                type='submit'
                                text='Next' 
                                className='py-2 px-8 text-sm lg:text-normal' 
                                onClick={advance}
                            />
                        </div>
                    </form>
                )
            }
            {/* members section */}
            {
                activeSection == "members" && (
                    <form
                        onSubmit={handleSubmit} 
                        className='size-full flex flex-col justify-center items-center gap-2'
                    >
                        {/* title and text */}
                        <div className='text-center'>
                            <h2 className='text-lg lg:text-xl font-bold font-outfit'>Add Members</h2>
                            <p className='text-sm lg:text-normal text-light-txt2 dark:text-dark-txt2'>Select at least 2 friends to add to your group</p>
                        </div>
                        {/* infos section */}
                        <div className='w-[70%] min-w-[340px] text-xs lg:text-sm flex items-center justify-between'>
                            {/* error span */}
                            <span className="text-xs min-h-[1rem] block">
                                {errors.members && <span className="text-danger">{errors.members}</span>}
                            </span>
                            {/* selected counter */}
                            <span className={`${errors.members ? 'text-danger' : 'text-light-txt2 dark:text-dark-txt2'}`}> 
                                Selected: {members.size}
                            </span>
                        </div>
                        {/* friends list */}
                        <ul className='h-full w-[70%] min-w-[340px] px-2 lg:px-4 pb-2 overflow-y-auto scrollbar bg-light-200 dark:bg-dark-200'>
                            {
                                /* display skeletons while loading */
                                loading ? (
                                    Array.from({ length: 8 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                                ) : (
                                    /* display placeholder for empty state */
                                    friends.length == 0 ? (
                                        <div className='size-full flex flex-col items-center justify-center gap-2'> 
                                            <Ghost className='size-6' />
                                            You currently have no friends 
                                        </div> 
                                    ) : (
                                        /* display friends list */
                                        friends.map(friend => (
                                            <div key={friend.userID} 
                                                className='flex items-center justify-between mt-2 cursor-pointer'
                                                onClick={() => toggleMember(friend.userID)}
                                            >
                                                {/* friend profile preview */}
                                                <ProfilePreview user={friend} />
                                                {/* checkbox */}
                                                <div className={`size-6 lg:size-8 rounded-sm border-1 flex items-center justify-center shrink-0 border-light-txt2 dark:border-dark-txt2 ${members.has(friend.userID) ? 'bg-primary' : 'bg-transparent'}`}>   
                                                    {
                                                        members.has(friend.userID) && <Check className='size-5 lg:size-6 text-inverted' />
                                                    }
                                                </div>
                                            </div>
                                        )) 
                                    )
                                )
                            }
                            {
                                /* display skeletons at the bottom while loading more */
                                loadingMore && hasMore && Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                                
                            }
                            {/* div used to load more friends */}
                            <div ref={loaderRef}></div>
                        </ul>
                        {/* buttons */}
                        <div className='mt-2 flex items-center justify-center gap-8'>
                            {/* close modal */}
                            <TertiaryButton
                                type='button'
                                text="Back"
                                className='py-2 px-8 text-sm lg:text-normal'
                                onClick={() => setActiveSection("name")}
                                disabled={creating}
                            />
                            {/* submit */}
                            <PrimaryButton 
                                type='submit'
                                text="Create"
                                className={`text-sm lg:text-normal py-2 ${loading ? 'px-9' : 'px-6'}`}
                                loading={loading}
                            />
                        </div>
                    </form>
                )
            }
        </div>
    </div>
  )
}

export default CreateGroupModal