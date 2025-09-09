import React, { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../store/auth.store'
import { Check, PenLine, Plus, X } from 'lucide-react';
import { FaFacebook, FaInstagram, FaXTwitter, FaSnapchat, FaGithub, FaTiktok, FaRedditAlien } from 'react-icons/fa6';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import enUS from 'date-fns/locale/en-US';
import '../../custom-datepicker.css'
import PrimaryButton from '../PrimaryButton';
import toast from 'react-hot-toast';
import { updateProfile } from '../../lib/api/user.api';

registerLocale('en-US', enUS);

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

const SocialInput = ({social,id, onSave, onDelete, setDisabled}) => {
  const [platform, setPlatform] = useState(social.platform || "facebook");
  const [username, setUsername] = useState(social.label || "");
  const [error, setError] = useState("");
  const [savedState, setSavedState] = useState({
    platform: social.platform || "facebook",
    username: social.label || ""
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (showDropdown && containerRef.current) {
      const containerRec = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const spaceBelow = viewportHeight - containerRec.bottom;
      const spaceAbove = containerRec.top;

      const dropdownHeight = 300; 

      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
    if (showDropdown && dropdownRef.current) {
      dropdownRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showDropdown]);

  const currentPlatform = platforms.filter(p => p.name === platform)[0];
  const generatedLink = currentPlatform.baseUrl + username; 
  const hasChanges = savedState.platform !== platform || savedState.username !== username;

  useEffect(() => {
    setDisabled(id, !hasChanges);
  }, [hasChanges]);


  const handleSelectPlatform = (platform) => {
    setPlatform(platform);
    setShowDropdown(false);
  }

  const handleSave = () => {
    if(!username.trim()){
      setError("Username cannot be empty")
      return;
    }

    const result = {
      id,
      platform,
      link: generatedLink,
      label: username
    }
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
          onClick={() => setShowDropdown((prev) => !prev)}
          className="size-10 flex items-center justify-center cursor-pointer transition-all
          bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt 
            hover:scale-125"
        >
          {currentPlatform.icon}
        </button>

        {/* username input */}
        <div className='w-full'>                
          <input 
            id='name'
            type="text"
            autoComplete='off'
            className={`p-1 w-full outline-0 
              ${ error ? 'border-b-2 border-danger text-danger' : 
                'border-b-1 border-light-txt2 dark:border-dark-txt2 focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt text-light-txt dark:text-dark-txt'}  
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
          type='button'
          onClick={hasChanges ? handleSave : () => onDelete(id)}
          className={`h-8 w-10 rounded-sm flex items-center justify-center cursor-pointer text-light-txt dark:text-dark-txt  
            ${hasChanges ? 'hover:bg-accent' : 'hover:bg-danger'}`}
        >
          {hasChanges ? <Check className='size-6'/> : <X className='size-6' />}
        </button>
      </div>
      
      {/* error or link span */}
      <span className={`pl-10 text-xs ${error ? 'text-danger' : 'text-light-txt2 dark:text-dark-txt2'}`}>
        { error || generatedLink }
      </span>
      
      {/* dropdown menu */}
      {showDropdown && 
      <div
        ref={dropdownRef}
        className={`border-1 drop-shadow-lg rounded-lg absolute w-[250px] left-0 z-10
          ${dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-10'}
        bg-light-200 border-light-txt2 text-light-txt dark:bg-dark-200 dark:border-dark-txt2 dark:text-dark-txt`}>
        {
          platforms.map((item, index) => (
            <button 
              key={index} 
              className='w-full flex items-center gap-2 p-2 capitalize transition-all cursor-pointer border-b-1 border-light-txt2 hover:bg-primary hover:text-inverted'
              onClick={() => handleSelectPlatform(item.name)}  
            >
              {item.icon}
              {item.name}
            </button>
          ))
        }
      </div>}
    </div>
  )
  
}


const EditProfile = () => {
  const { authUser, setAuthUser } = useAuthStore();

  const [saveStatusMap, setSaveStatusMap] = useState({});

  const setDisabled = (id, isSaved) => {
    setSaveStatusMap(prev => ({ ...prev, [id]: isSaved }));
  };

  const disabled = Object.values(saveStatusMap).some(saved => !saved);

  const [cover, setCover] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [name, setName] = useState(authUser.name)
  const [error, setError] = useState("");
  const [bio, setBio] = useState(authUser.bio || "");
  const [birthdate, setBirthdate] = useState(authUser.birthdate || null);
  const [socials, setSocials] = useState( authUser.socials );

  const [loading, setLoading] = useState(false);

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if(!file) return;

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

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if(!file) return;

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

  const addSocial = () => { 
    const lastId = socials.length > 0 ? Math.max(...socials.map(s => s.id)) : 0;
    setSocials(prev => [...prev, { id: lastId+1, platform: "facebook", label: "username", link: "" }]);
  }

  const updateSocial = (social, id) => setSocials(prev => prev.map((item) => (item.id === id ? social : item)));

  const removeSocial = (id) => setSocials(prev => prev.filter(item => item.id !== id));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if(!name.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setLoading(true);
    try {
      const res = await updateProfile({name, bio, profilePic, cover, birthdate, socials});
      
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
      <div className='w-full h-[270px] relative'>
        {/* cover image */}
        {
          cover ? <img src={cover} className='w-full h-[200px] object-cover' /> :
          authUser.cover ? <img src={authUser.cover} className='w-full h-[200px] object-cover' /> :
          <div className='w-full h-[200px] bg-light-300 dark:bg-dark-300'></div> 
        }
        <label 
          htmlFor='cover-input'
          title='Change cover'
          className='size-10 flex items-center justify-center rounded-[50%] 
          absolute right-8 top-[180px] cursor-pointer border-2 border-light-txt dark:border-dark-txt
          bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt
          hover:bg-primary hover:text-inverted hover:border-inverted'
        >
          <PenLine className='size-6' />
          <input 
              type="file"
              id='cover-input'
              className='hidden'
              accept='image/*'
              onChange={handleCoverUpload}
              disabled={loading} 
          />
        </label>
        {/* profile picture */}
        <img src={profilePic ? profilePic : authUser.profilePic ? authUser.profilePic : "/assets/avatar.svg"} className='size-[150px] rounded-[50%] absolute left-8 bottom-0 border-4 border-light-100 dark:border-dark-100' />
        <label 
          htmlFor='profile-input'
          title='Change profile picture'
          className='size-10 flex items-center justify-center rounded-[50%] 
          absolute left-[140px] bottom-2 cursor-pointer border-2 border-light-txt dark:border-dark-txt
          bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt
          hover:bg-primary hover:text-inverted hover:border-inverted'
        >
          <PenLine className='size-6' />
          <input 
              type="file"
              id='profile-input'
              className='hidden'
              accept='image/*'
              onChange={handleProfilePicUpload}
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
            placeholder='John Doe'
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
          <label htmlFor='bio' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
              Bio
          </label>                
          <textarea 
              id='bio'
              rows={3}
              maxLength={150}
              className={`p-1 w-full resize-none outline-0 
                  border-b-1 border-light-txt2 dark:border-dark-txt2 
                  focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt 
                  text-light-txt dark:text-dark-txt`} 
              placeholder='Tell us a little about yourself...'
              value={bio}
              onChange={(e) => setBio(e.target.value)}
          />
          <span className='text-xs text-light-txt2 dark:text-dark-txt2 pl-1'>
              {bio.length}/150
          </span>
        </div>

        {/* birthdate datepicker */}
        <div className='w-1/2 min-w-[300px]'>
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
            className={`p-1 w-full outline-0 bg-transparent
              border-b-1 border-light-txt2 dark:border-dark-txt2 
              focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt 
              text-light-txt dark:text-dark-txt`}
            wrapperClassName='w-full'
          />
        </div>

        <div className='w-1/2 min-w-[300px] mt-2'>
          <div className='flex items-center justify-between'>
            <label htmlFor='birthdate' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
              Socials
            </label>
            <button 
              type='button'
              onClick={addSocial}
              className='size-8 flex items-center justify-center border-1 rounded-lg cursor-pointer
              border-primary text-primary hover:bg-primary hover:text-inverted'
            >
              <Plus className='size-6' />
            </button>
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
        <PrimaryButton 
          text="Save" 
          className='w-1/2 min-w-[300px] p-2 mt-2' 
          type='submit'
          loading={loading}
          disabled={disabled} 
        />
      </div>
    </form>
  )
}

export default EditProfile