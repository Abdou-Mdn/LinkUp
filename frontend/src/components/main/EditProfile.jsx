import React, { useEffect, useRef, useState } from 'react'
import { Check, ImageOff, PenLine, Plus, X } from 'lucide-react';
import { FaFacebook, FaInstagram, FaXTwitter, FaSnapchat, FaGithub, FaTiktok, FaRedditAlien } from 'react-icons/fa6';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import enUS from 'date-fns/locale/en-US';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

import { useAuthStore } from '../../store/auth.store'

import { updateProfile } from '../../lib/api/user.api';

import PrimaryButton from '../PrimaryButton';
import TertiaryButton from '../TertiaryButton';
import DynamicTextarea from '../DynamicTextarea';
import TextInput from '../TextInput';

import '../../custom-datepicker.css'

// Register English locale for the date picker
registerLocale('en-US', enUS);

// Supported social platforms for profile links
const platforms = [
  {
    name: "facebook",
    icon: <FaFacebook className='size-6' />,
    baseUrl: "https://facebook.com/"
  },
  {
    name: "instagram",
    icon: <FaInstagram className='size-6' />,
    baseUrl: "https://instagram.com/"
  },
  {
    name: "twitter",
    icon: <FaXTwitter className='size-6' />,
    baseUrl: "https://x.com/"
  },
  {
    name: "snapchat",
    icon: <FaSnapchat className='size-6' />,
    baseUrl: "https://snapchat.com/@"
  },
  {
    name: "github",
    icon: <FaGithub className='size-6' />,
    baseUrl: "https://github.com/"
  },
  {
    name: "tiktok",
    icon: <FaTiktok className='size-6' />,
    baseUrl: "https://tiktok.com/@"
  },
  {
    name: "reddit",
    icon: <FaRedditAlien className='size-6' />,
    baseUrl: "https://reddit.com/user/"
  }
]

/* 
 * Input for managing one social platform entry (platform + username). 

 * params :
 * - social: existing social object {id, platform, label, link}.
 * - id: unique identifier for the input. 
 * - onSave: callback function to save the social
 * - onDelete: callback function to remove social
 * - setDisabled: setter to notify parent if social is unsaved
*/
const SocialInput = ({social,id, onSave, onDelete, setDisabled}) => {
  // states to manage social values
  const [platform, setPlatform] = useState(social.platform || "facebook"); 
  const [username, setUsername] = useState(social.label || "");
  const [error, setError] = useState("");
  
  // keep track of saved state for detecting changes
  const [savedState, setSavedState] = useState({
    platform: social.platform || "facebook",
    username: social.label || ""
  });

  // dropdown logic
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  // derived values
  const currentPlatform = platforms.filter(p => p.name === platform)[0];
  const generatedLink = currentPlatform.baseUrl + username.trim(); 
  const hasChanges = savedState.platform !== platform || savedState.username !== username.trim();

  // animation varaiants
    const variants = {
        initial: (position) => ({
            opacity: 0,
            y: position == 'top' ? 10 : -10
        }),
        animate: {
            opacity: 1,
            y: 0
        },
        exit: (position) => ({
            opacity: 0,
            y: position == 'top' ? 10 : -10
        })
    }

  // handle dropdown position (top/bottom based on available space)
  useEffect(() => {
    if (showDropdown && containerRef.current) {
      // get the bounding box of the container relative to the viewport
      const containerRec = containerRef.current.getBoundingClientRect();
      
      // get the total viewport height
      const viewportHeight = window.innerHeight;

      // calculate available vertical space (below and above the container)
      const spaceBelow = viewportHeight - containerRec.bottom;
      const spaceAbove = containerRec.top;

      // measure height of dropdown
      const dropdownHeight = dropdownRef.current.offsetHeight; 

      // decide whether the dropdown should open upwards or downwards:
      // - if there's not enough space below but enough space above, place it on top.
      // - otherwise, default to placing it below.
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
    // ensure the dropdown stays in view when it opens by smoothly scrolling it into the visible area if needed
    if (showDropdown && dropdownRef.current) {
      dropdownRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showDropdown]);

  // notify parent if there are unsaved changes
  useEffect(() => {
    setDisabled(id, !hasChanges);
  }, [hasChanges]);

  // select a new plateform and close drop down
  const handleSelectPlatform = (platform) => {
    setPlatform(platform);
    setShowDropdown(false);
  }

  // save current social
  const handleSave = () => {
    // validate username (cannot be empty)
    if(!username.trim()){
      setError("Username cannot be empty")
      return;
    }

    const result = {
      id,
      platform,
      link: generatedLink,
      label: username.trim()
    }
    // update saved changes
    setSavedState({platform, username})
    onSave(result, id);
  }

  return (
    <div ref={containerRef} className='relative w-full my-2'>
      {/* main input */}
      <div className="flex items-center">
        {/* platform dropdown button */}
        <button 
          type='button'
          title={showDropdown ? 'Close' : 'Change Plateform'}
          className={`hover:bg-light-300 hover:dark:bg-dark-300 p-2 rounded-lg cursor-pointer flex items-center justify-center ${showDropdown ? "text-secondary" : "text-light-txt2 dark:text-dark-txt2"}`} 
          onClick={() => setShowDropdown(prev => !prev)} // toggle dropdown visibility 
        >
          { showDropdown ? <X className='size-6' /> : currentPlatform.icon}    
        </button>
        
        {/* username input */}
        <div className='w-full'>                
          <input 
            id='name'
            type='text'
            autoComplete='off'
            className={`p-1 w-full outline-0 ${ error ? 'border-b-2 border-danger text-danger' : 
              'border-b-1 focus:border-b-2 border-light-txt2 dark:border-dark-txt2 focus:border-light-txt dark:focus:border-dark-txt text-light-txt dark:text-dark-txt'}  
            `} 
            placeholder='Enter your username'
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              if (error) setError("");
            }}
          />
        </div>

        {/* Action button (X or Check) */}
        <button
          title={hasChanges ? 'save' : 'remove'}
          type='button'
          onClick={hasChanges ? handleSave : () => onDelete(id)}
          className={`p-2 rounded-lg cursor-pointer flex items-center justify-center text-light-txt dark:text-dark-txt ${hasChanges ? 'hover:bg-accent' : 'hover:bg-danger'}`}
        >
          {hasChanges ? <Check className='size-5'/> : <X className='size-5' />}
        </button>
      </div>
      
      {/* error or link span */}
      <span className={`pl-10 text-xs ${error ? 'text-danger' : 'text-light-txt2 dark:text-dark-txt2'}`}>
        { error || generatedLink }
      </span>
      
      {/* dropdown menu */}
      <AnimatePresence>
      {showDropdown && 
        <motion.div
          ref={dropdownRef}
          className={`border-1 drop-shadow-lg rounded-lg w-[80%] min-w-[250px] py-2 px-1 flex flex-col gap-2 absolute z-10 left-0 ${dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-10'} bg-light-200 border-light-txt2 text-light-txt dark:bg-dark-200 dark:border-dark-txt2 dark:text-dark-txt`}
          variants={variants}
          custom={dropdownPosition}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {
            platforms.map((item, index) => (
              <button 
                key={index} 
                className='flex items-center gap-4 p-2 capitalize transition-all cursor-pointer hover:bg-light-300 hover:dark:bg-dark-300'
                onClick={() => handleSelectPlatform(item.name)}  
              >
                {item.icon}
                {item.name}
              </button>
            ))
          }
        </motion.div>
      }
      </AnimatePresence>
    </div>
  )
  
}


/* 
 * EditProfile component
 * Main container for editing profile option.

 * Allows editing: name, profile picture, cover image, bio, birthdate, social links
  
 * Integrates with API functions:
 * - `updateProfile`

 */
const EditProfile = () => {
  const { authUser, setAuthUser } = useAuthStore();

  // form states
  const [cover, setCover] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [name, setName] = useState(authUser.name)
  const [error, setError] = useState("");
  const [bio, setBio] = useState(authUser.bio || "");
  const [birthdate, setBirthdate] = useState(authUser.birthdate || null);
  const [socials, setSocials] = useState( authUser.socials );
  // loading state
  const [loading, setLoading] = useState(false);

  // file input refs
  const coverInputRef = useRef(null);
  const profilePicInputRef = useRef(null);

  // disable save button if there are no changes or unsaved socials
  const [saveStatusMap, setSaveStatusMap] = useState({});
  const setDisabled = (id, isSaved) => {
    setSaveStatusMap(prev => ({ ...prev, [id]: isSaved }));
  };
  const disabled = Object.values(saveStatusMap).some(saved => !saved);
  const unchanged = (!cover && !profilePic) && (name.trim() === authUser.name) && (bio.trim() === authUser.bio) && (birthdate === authUser.birthdate) && (socials === authUser.socials)

  // handle cover image upload
  const handleCoverUpload = async (e) => {
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
      setCover(base64Image)
    }
  }

  // handle remove uploaded cover image
  const handleCoverRemove = () => {
    setCover(null);
    if(coverInputRef.current) coverInputRef.current.value = ''
  }

  // handle profile picture upload
  const handleProfilePicUpload = async (e) => {
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
      setProfilePic(base64Image)
    }
  }

  // handle remove uploaded profile pic image
  const handleProfilePicRemove = () => {
    setProfilePic(null);
    if(profilePicInputRef.current) profilePicInputRef.current.value = ''
  }

  // add a new social input
  const addSocial = () => { 
    const lastId = socials.length > 0 ? Math.max(...socials.map(s => s.id)) : 0;
    setSocials(prev => [...prev, { id: lastId+1, platform: "facebook", label: "username", link: "" }]);
  }

  // update un existing social input
  const updateSocial = (social, id) => setSocials(prev => prev.map((item) => (item.id === id ? social : item)));

  // remove a social input
  const removeSocial = (id) => setSocials(prev => prev.filter(item => item.id !== id));

  // handle update profile
  const handleSubmit = async (event) => {
    event.preventDefault();
    // validate name (cannot be empty)
    if(!name.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setLoading(true);
    try {
      const res = await updateProfile({name, bio, profilePic, cover, birthdate, socials});
      
      // if update is successful then update authUser state
      if(res?.user) {
        setAuthUser(res.user);
      }
    } catch (error) {
      console.log("error in updating profile ", error);
    } finally {
      setLoading(false);
    }
  }

  return (
  <form onSubmit={handleSubmit} className='size-full bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'>
      {/* pictures */}
      <div className='w-full h-[190px] lg:h-[270px] relative'>
        {/* cover image */}
        {
          cover ? <img src={cover} className='w-full h-[140px] lg:h-[200px] object-cover' /> :
          authUser.cover ? <img src={authUser.cover} className='w-full h-[140px] lg:h-[200px] object-cover' /> :
          <div className='w-full h-[140px] lg:h-[200px] bg-light-300 dark:bg-dark-300'></div> 
        }
        {/* edit cover button (file uploader) */}
        <div
          title={ cover ? 'Reset cover' : 'Change cover'}
          className='size-8 lg:size-10 flex items-center justify-center rounded-full absolute right-8 top-[125px] lg:top-[180px] border-2 border-light-txt dark:border-dark-txt bg-light-100 dark:bg-dark-100 hover:bg-light-300 hover:dark:bg-dark-300 text-light-txt  dark:text-dark-txt'
        >
          <button
            type='button'
            onClick={cover ? handleCoverRemove : () => coverInputRef.current?.click()}
            className='size-full rounded-full flex items-center justify-center cursor-pointer'
          >
            {
              cover ? <ImageOff className='size-5 lg:size-6' /> : <PenLine className='size-5 lg:size-6' />
            }
          </button>
          <input 
            ref={coverInputRef}
            type="file"
            id='cover-input'
            className='hidden'
            accept='image/*'
            onChange={handleCoverUpload}
            disabled={loading} 
          />
        </div>
              
        {/* profile picture */}
        <img src={profilePic ? profilePic : authUser.profilePic ? authUser.profilePic : "/assets/avatar.svg"} className='size-[100px] lg:size-[150px] rounded-full absolute left-4 lg:left-8 bottom-0 border-4 border-light-100 dark:border-dark-100' />
        {/* edit profile pic button (file uploader) */}
        <div
          title={ profilePic ? 'Reset image' : 'Change image'}
          className='size-8 lg:size-10 flex items-center justify-center rounded-full absolute left-[90px] lg:left-[140px] bottom-1 lg:bottom-2 border-2 border-light-txt dark:border-dark-txt bg-light-100 dark:bg-dark-100 hover:bg-light-300 hover:dark:bg-dark-300 text-light-txt  dark:text-dark-txt'
        >
          <button
            type='button'
            onClick={profilePic ? handleProfilePicRemove : () => profilePicInputRef.current?.click()}
            className='size-full rounded-full flex items-center justify-center cursor-pointer'
          >
            {
              profilePic ? <ImageOff className='size-5 lg:size-6' /> : <PenLine className='size-5 lg:size-6' />
            }
          </button>
          <input 
            ref={profilePicInputRef}
            type="file"
            id='banner-input'
            className='hidden'
            accept='image/*'
            onChange={handleProfilePicUpload}
            disabled={loading} 
          />
        </div>
      </div>

      {/* other infos */}
      <div className='w-full p-3 my-2 lg:pl-10 flex flex-col items-center lg:items-start gap-3'>
        {/* name input */}
        <TextInput
          label='Name'
          placeholder='John Doe'
          isPassword={false}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (error) setError("");
          }}
          error={error}
        />
        
        {/* bio textarea */}
        <DynamicTextarea
          label='Bio'
          placeholder='Tell us a little about yourself...'
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        {/* birthdate datepicker */}
        <div className='lg:w-1/2 min-w-[300px]'>
          <label htmlFor='birthdate' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
            Birthdate
          </label>
          <DatePicker
            id='birthdate'
            selected={birthdate}
            onChange={(date) => setBirthdate(date)}
            maxDate={new Date()}
            dateFormat="MMMM d, yyyy"
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={100}
            placeholderText='Select your birthdate'
            className={`p-1 w-full outline-0 bg-transparent border-b-1 focus:border-b-2 border-light-txt2 dark:border-dark-txt2 focus:border-light-txt dark:focus:border-dark-txt text-light-txt dark:text-dark-txt`}
            wrapperClassName='w-full'
          />
        </div>

        {/* social inputs */}
        <div className='lg:w-1/2 min-w-[300px] mt-2'>
          <div className='flex items-center justify-between'>
            <label htmlFor='birthdate' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
              Socials
            </label>
            {/* add social button */}
            <TertiaryButton
              type='button'
              toolip={"Add Social"}
              onClick={addSocial}
              leftIcon={<Plus className='size-6' />}
              className='rounded-lg size-8'
            />
          </div>
          {
            socials.map(social => (
              <SocialInput
                key={social.id}
                social={social}
                id={social.id}
                onSave={updateSocial}
                onDelete={removeSocial}
                setDisabled={setDisabled}
              />
            ))
          }
        </div>
        {/* submit button */}
        <PrimaryButton 
          text="Save" 
          className='lg:w-1/2 min-w-[300px] p-2 mt-2' 
          type='submit'
          loading={loading}
          disabled={disabled || unchanged} 
        />
      </div>
    </form>
  )
}

export default EditProfile