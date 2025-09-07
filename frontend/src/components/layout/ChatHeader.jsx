import React, { useState } from 'react'
import { useLayoutStore } from '../../store/layout.store'
import { ArrowLeft, Phone, Video } from 'lucide-react';
import TertiaryButton from '../TertiaryButton';
import { useAuthStore } from '../../store/auth.store';

const ChatHeader = ({chat}) => {
    const {isMobile, isMainActive, setMainActive} = useLayoutStore();
    const { authUser } = useAuthStore();

    const [activeModal, setActiveModal] = useState(false);

    const isGroup = chat.isGroup;

    let otherUser, isOnline = null;
    if(!isGroup) {
        otherUser = chat.participants.filter(p => p.userID !== authUser.userID)[0];
    }


  return (
    <>
        <div className='bg-light-200 dark:bg-dark-200 text-light-txt dark:text-dark-txt p-2 flex items-center justify-between capitalize z-10'>
            <div className='flex items-center gap-4'>
                {/* go back button  */}
                {isMobile && isMainActive && <button onClick={() => setMainActive(false)} className='size-8 flex items-center justify-center'>
                    <ArrowLeft className='size-6' />
                </button>}
                <div className='flex-shrink-0 relative size-fit ml-4'>
                    {
                        isGroup ? (
                            <img src={chat.group.image ? chat.group.image : '/assets/group-avatar.svg'} className='size-12 rounded-[50%]'/>
                        ) : (
                            <img src={otherUser.profilePic ? otherUser.profilePic : '/assets/avatar.svg'} className='size-12 rounded-[50%]'/>
                        )
                    }
                    { isOnline && <div className='bg-accent border-3 border-light-200 dark:border-dark-200 size-4.25 rounded-[50%] absolute -right-0.75 -bottom-0.75'></div> }
                </div>
                <div className='w-full flex flex-col min-w-0'>
                    <p>
                        { isGroup ? chat.group.name : otherUser.name }
                    </p>    
                    <p className='text-accent text-sm'>
                        { isGroup ? "3 Members Online" : "Online"}
                    </p>
                </div>
            </div>
            <div className='flex items-center px-4 gap-4 lg:gap-10 lg:mr-8'>
                <button 
                    title='Voice call'
                    className={`hover:bg-light-300 hover:dark:bg-dark-300 p-3 rounded-full cursor-pointer ${activeModal ? "text-secondary" : "text-light-txt2 dark:text-dark-txt2"}`} 
                    onClick={() => setActiveModal(true)}
                >
                    <Phone className='size-6' />    
                </button>
                <button 
                    title='Video call'
                    className={`hover:bg-light-300 hover:dark:bg-dark-300 p-3 rounded-full cursor-pointer ${activeModal ? "text-secondary" : "text-light-txt2 dark:text-dark-txt2"}`} 
                    onClick={() => setActiveModal(true)}
                >
                    <Video className='size-6' />    
                </button>
            </div>
        </div>
        {
            activeModal && 
            <div onClick={() => setActiveModal(false)} 
                className='bg-[#00000066] dark:bg-[#ffffff33] fixed inset-0 z-50 flex items-center justify-center'
            >
                <div 
                    onClick={(e) => e.stopPropagation()} 
                    className='h-[40%] w-[50%] min-w-[350px] rounded-2xl flex flex-col items-center justify-center p-10 gap-4 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'
                >
                    <p className='text-xl font-semibold text-center'>
                        This feature is comming soon !
                    </p>
                    <TertiaryButton
                        text="Got it"
                        className='p-2 w-1/4'
                        type='button'
                        onClick={() => setActiveModal(false)}
                    />
                </div>
            </div>
        }
    </>
  )
}

export default ChatHeader