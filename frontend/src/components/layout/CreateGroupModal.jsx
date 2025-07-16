import React, { useEffect, useRef } from 'react'
import { useState } from 'react'
import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton'
import TertiaryButton from '../TertiaryButton';
import ProfilePreviewSkeleton from '../skeleton/ProfilePreviewSkeleton';
import { Check, Ghost } from 'lucide-react';
import { getFriends } from '../../lib/api/user.api';
import ProfilePreview from '../previews/ProfilePreview';
import { createGroup } from '../../lib/api/group.api';

const CreateGroupModal = ({onClose}) => {

    const [activeSection, setActiveSection] = useState("name");

    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [friends, setFriends] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false)

    const [members, setMembers] = useState(new Set());
    const [name, setName] = useState("");
    const [errors, setErrors] = useState({ name: "", members: ""});
    const [creating, setCreating] = useState(false);

    const loaderRef = useRef(null);

    const fetchFriends = async (reset = false) => {
        if(!reset && !hasMore) return;
        const result = await getFriends(reset, page, 10);
    
        if(result?.friends) {
          const newFriends = result.friends;
          const totalPages = result.totalPages;
    
          setFriends(prev => reset ? newFriends : [...prev, ...newFriends]);
          setHasMore((reset ? 1 : page) < totalPages);
          setPage(reset ? 2 : page + 1);
        }

        setLoading(false);
        setLoadingMore(false);
    }

    useEffect(() => {
        const fetchData = async () => {
          setLoading(true);
          await fetchFriends(true);
        };
    
        fetchData();
    }, []);

    const loadMore = async () => {
        if(!loading && !loadingMore) {
            setLoadingMore(true);
            fetchFriends();
        }
    }

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

    useEffect(() => {
        if(activeSection != "members") return;
        const observer = new IntersectionObserver(
          (entries) => {
            if(entries[0].isIntersecting) {
              loadMore();
            }
          }, 
          {
            threshold: 1.0
          }
        );
    
        const target = loaderRef.current

        if(target) {
            observer.observe(target);
        }
        
        return () => observer.disconnect();
    }, [activeSection, loading, loadingMore]);

    const advance = () => {
        if(!name.trim()) {
            setErrors({...errors, name: "Group name is required"});
            return;
        }
        setActiveSection("members");
    }

    const handleSubmit = async (event) => {
        if(creating) return;
        event.preventDefault();
        if(members.size < 2) {
            setErrors({...errors, members: "Minimum 2 members required."})
            return;
        }

        const selectedMembers = Array.from(members);
        setCreating(true);
        
        const result = await createGroup({ name, members: selectedMembers});
        console.log(result);

        if(result.group) {
            setName("");
            setMembers(new Set());
            setErrors({name: "", members: ""});
            setActiveSection("name");
            onClose();
        }
    }


  return (
    <div onClick={onClose} 
        className='bg-[#00000066] dark:bg-[#ffffff33] absolute inset-0 z-50 flex items-center justify-center'
    >
        <form 
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()} 
            className={`${activeSection == "name" ? 'h-[60%]' : 'h-[80%]'} w-[50%] min-w-[350px] rounded-2xl flex items-center justify-center p-8 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt`}
        >
            {
                activeSection == "name" && (
                    <div className='size-full flex flex-col justify-center items-center gap-8'>
                        <div className='text-center'>
                            <h2 className='text-xl font-bold font-outfit'>Create New Group</h2>
                            <p className='text-light-txt2 dark:text-dark-txt2'>Please provide a name for your group</p>
                        </div>
                        {/* name input */}
                        <div className='w-1/2 min-w-[300px]'>
                        <label htmlFor='name' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
                            Name
                        </label>                
                        <input 
                            id='name'
                            type="text"
                            className={`p-1 w-full outline-0 
                            ${ errors.name ? 'border-b-2 border-danger text-danger' : 
                                'border-b-1 border-light-txt2 dark:border-dark-txt2 focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt text-light-txt dark:text-dark-txt'}  
                            `} 
                            placeholder='Group Name'
                            value={name}
                            onChange={(e) => {
                            setName(e.target.value)
                            if (errors) setErrors({...errors, name: ""});
                            }}
                        />
                        <span className={`text-sm ${errors.name ? 'text-danger' : 'text-transparent'}`}>
                            { errors.name || "placeholder" }
                        </span>
                        </div>
                        <div className='flex items-center justify-center gap-8'>
                            <SecondaryButton 
                                text='Cancel' 
                                isColored={false} 
                                className='py-2 px-6' 
                                onClick={onClose}
                            />
                            <PrimaryButton 
                                text='Next' 
                                className='py-2 px-8' 
                                onClick={advance}
                            />
                        </div>
                        
                    </div>
                )
            }
            {
                activeSection == "members" && (
                    <div className='size-full flex flex-col justify-center items-center gap-2'>
                        <div className='text-center'>
                            <h2 className='text-xl font-bold font-outfit'>Add Members</h2>
                            <p className='text-light-txt2 dark:text-dark-txt2'>Select at least 2 friends to add to your group</p>
                        </div>
                        <div className='w-[70%] min-w-[300px] text-sm flex items-center justify-between'>
                            <span className={`${errors.members ? 'text-danger' : 'text-transparent'}`}>
                                { errors.members || "placeholder" }
                            </span>
                            <span className={`${errors.members ? 'text-danger' : 'text-light-txt2 dark:text-dark-txt2'}`}> 
                                Selected: {members.size}
                            </span>
                        </div>
                        <ul className='h-full w-[70%] min-w-[300px] px-4 pb-2 overflow-y-scroll bg-light-200 dark:bg-dark-200'>
                            {
                                loading ? (
                                    Array.from({ length: 5 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
                                ) : (
                                    friends.length == 0 ? (
                                        <div className='size-full flex flex-col items-center justify-center gap-2'> 
                                            <Ghost className='size-6' />
                                            You currently have no friends 
                                        </div> 
                                    ) : (
                                        friends.map(friend => (
                                            <div key={friend.userID} 
                                                className='flex items-center justify-between mt-2 cursor-pointer'
                                                onClick={() => toggleMember(friend.userID)}
                                            >
                                                <ProfilePreview user={friend} />
                                                <div className={`size-8 rounded-sm border-1 flex items-center justify-center border-light-txt2 dark:border-dark-txt2 ${members.has(friend.userID) ? 'bg-primary' : 'bg-transparent'}`}
                                                >   
                                                    {
                                                        members.has(friend.userID) && (
                                                            <Check className='size-6 text-inverted' />
                                                        )
                                                    }
                                                </div>
                                            </div>
                                        )) 
                                    )
                                )
                            }
                            <div ref={loaderRef}></div>
                        </ul>
                        <div className='flex items-center justify-center gap-8'>
                            <TertiaryButton
                                text="Back"
                                className='py-2 px-8'
                                onClick={() => setActiveSection("name")}
                                disabled={creating}
                            />
                            <PrimaryButton 
                                text="Create"
                                className='py-2 px-6'
                                type='submit'
                                loading={creating}
                            />
                        </div>
                    </div>
                )
            }
        </form>
    </div>
  )
}

export default CreateGroupModal