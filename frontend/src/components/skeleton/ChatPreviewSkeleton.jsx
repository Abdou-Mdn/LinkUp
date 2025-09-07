import React from 'react'

const ChatPreviewSkeleton = () => {
  return (
    <div className='w-full flex items-center gap-2 p-1 mt-1'>
       <div className='size-12 rounded-[50%] shrink-0 animate-pulse bg-light-300 dark:bg-dark-300'/>
       <div className='flex-1'>
            <div className='w-[150px] h-4 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
            <div className='flex items-center gap-1'>
                <div className='w-[70%] h-2.5 mt-2 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
                <div className='w-[20%] h-2 mt-2 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
            </div>
       </div>
       <div className='size-3 rounded-[50%] shrink-0 animate-pulse bg-light-300 dark:bg-dark-300'/>
    </div>
  )
}

export default ChatPreviewSkeleton