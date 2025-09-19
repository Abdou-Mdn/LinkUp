import React from 'react'

/* 
 * MessageSkeleton
 * Displays a skeleton while messages are loading
*/
const MessageSkeleton = ({isMine, displayDay}) => {
  return (
    <>
        {/* day separator */}
        {
            displayDay && (
                <div className='py-2 w-full flex items-center justify-center'>
                    <div className='w-[150px] h-3 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
                </div>
            )
        }
        <div className={`w-full px-4 py-2 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div className='max-w-[70%]'>
                <div className={isMine ? 'pr-7 lg:pr-9' : 'pl-7 lg:pl-9'}>
                    <div className='w-full relative'>
                        {/* message bubble */}
                        <div 
                            className={`w-[180px] lg:w-[350px] h-13 animate-pulse bg-light-300 dark:bg-dark-300
                                ${isMine ? 'rounded-tr-2xl rounded-tl-2xl rounded-bl-2xl' : 'rounded-tr-2xl rounded-tl-2xl rounded-br-2xl'}
                            `}
                        />
                        <div className={`size-7 lg:size-9 rounded-full bg-transparent absolute bottom-0 ${isMine ? '-right-8 lg:-right-10' : '-left-8 lg:-left-10'}`}>
                            {/* sender image */}
                            <div className='size-7 lg:size-9 rounded-full shrink-0 animate-pulse bg-light-300 dark:bg-dark-300' />
                        </div>
                    </div>  
                </div>
            </div>
        </div>
    </>
  )
}
export default MessageSkeleton