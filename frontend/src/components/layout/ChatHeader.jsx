import React, { useState } from 'react'
import { ArrowLeft, Phone, Video } from 'lucide-react';

import { useLayoutStore } from '../../store/layout.store'

import TertiaryButton from '../TertiaryButton';



/* 
 * ChatHeader Component
 
 * Displays header for the chat container.
  
 * Features: 
 * - User or group info ** → the avatar, name and online status of the user or group related to the chat.
 * - Voice & video call buttons ** → this represents future features to implement. (###### TODO ######)
 * - Go back button (ArrowLeft) ** → only on mobile devices, used to close chat and go back to the sidebar content 
 
 * params:
 * - chat: chat object used to render necessary infos
 * - otherUser: user's info in case it's a private chat
*/
const ChatHeader = ({chat, otherUser}) => {
    const {isMobile, isMainActive, setMainActive} = useLayoutStore();

    // modal visibility state (### TEMPORARY ####)
    const [activeModal, setActiveModal] = useState(false);

    // check if it's a private or group chat
    const isGroup = chat.isGroup;


  return (
    <>
        <div className='bg-light-200 dark:bg-dark-200 text-light-txt dark:text-dark-txt p-2 flex items-center justify-between capitalize z-10'>
            {/* left section */}
            <div className='flex items-center gap-4'>
                {/* go back button (mobile only) */}
                {isMobile && isMainActive && 
                <button 
                    onClick={() => setMainActive(false)} 
                    className='p-1 rounded-lg flex items-center justify-center cursor-pointer hover:bg-light-300 hover:dark:bg-dark-300'
                >
                    <ArrowLeft className='size-6' />
                </button>}

                {/* image */}
                <div className='flex-shrink-0 relative size-fit lg:ml-4'>
                    {
                        isGroup ? (
                            <img src={chat.group.image ? chat.group.image : '/assets/group-avatar.svg'} className='size-10 lg:size-12 rounded-[50%]'/>
                        ) : (
                            <img src={otherUser.profilePic ? otherUser.profilePic : '/assets/avatar.svg'} className='size-10 lg:size-12 rounded-[50%]'/>
                        )
                    }
                    {/* online status */}
                    { true && <div className='bg-accent border-3 border-light-200 dark:border-dark-200 size-3.5 lg:size-4.25 rounded-[50%] absolute -right-0.75 -bottom-0.75'></div> }
                </div>
                {/* name and online status */}
                <div className='w-full flex flex-col min-w-0'>
                    <p className='text-sm lg:text-lg'>
                        { isGroup ? chat.group.name : otherUser.name }
                    </p>    
                    <p className='text-accent text-xs lg:text-sm'>
                        { isGroup ? "3 Members Online" : "Online"}
                    </p>
                </div>
            </div>
            {/* right section (buttons) */}
            <div className='flex items-center px-1 lg:px-4 gap-2 lg:gap-10 lg:mr-8'>
                {/* voice call */}
                <button 
                    title='Voice call'
                    className={`hover:bg-light-300 hover:dark:bg-dark-300 p-1.5 lg:p-3 rounded-xl cursor-pointer ${activeModal ? "text-secondary" : "text-light-txt2 dark:text-dark-txt2"}`} 
                    onClick={() => setActiveModal(true)} // currently just opens modal
                >
                    <Phone className='size-5 lg:size-6' />    
                </button>
                {/* video call */}
                <button 
                    title='Video call'
                    className={`hover:bg-light-300 hover:dark:bg-dark-300 p-1.5 lg:p-3 rounded-xl cursor-pointer ${activeModal ? "text-secondary" : "text-light-txt2 dark:text-dark-txt2"}`} 
                    onClick={() => setActiveModal(true)} // currently just opens modal
                >
                    <Video className='size-5 lg:size-6' />    
                </button>
            </div>
        </div>
        {/* temporary modal to display features coming soon */}
        {
            activeModal && 
            <div onClick={() => setActiveModal(false)} 
                className='bg-[#00000066] dark:bg-[#ffffff33] fixed inset-0 z-50 flex items-center justify-center'
            >
                <div 
                    onClick={(e) => e.stopPropagation()} 
                    className='h-fit max-h-[30%] w-[40%] min-w-[350px] rounded-2xl flex flex-col items-center justify-center p-10 gap-8 bg-light-100 dark:bg-dark-100 text-light-txt dark:text-dark-txt'
                >
                    <p className='text-lg lg:text-xl font-semibold text-center'>
                        This feature is comming soon !
                    </p>
                    <TertiaryButton
                        text="Got it"
                        className='p-2 w-1/4 min-w-[100px]'
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