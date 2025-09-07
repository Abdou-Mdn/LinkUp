import React from 'react'
import MessageSkeleton from './MessageSkeleton'

const ChatContainerSkeleteon = () => {
  return (
   <div className='h-screen flex flex-col w-full bg-light-100 dark:bg-dark-100'>
       {/* header skeleton */}
        <div className='p-2 flex items-center justify-between bg-light-200 dark:bg-dark-200'>
            <div className='flex items-center gap-4 pl-4'>
                <div className='size-12 rounded-full animate-pulse bg-light-300 dark:bg-dark-300'/>
                <div>
                    <div className='w-[180px] h-4 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
                    <div className='w-[120px] h-2 mt-2 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
                </div>
            </div>
            <div className='flex items-center px-4 gap-4 lg:gap-10 lg:mr-8'>
                <div className='size-10 rounded-full animate-pulse bg-light-300 dark:bg-dark-300'/>
                <div className='size-10 rounded-full animate-pulse bg-light-300 dark:bg-dark-300'/>
            </div>
        </div>
        {/* messages */}
        <div className='flex-1 overflow-y-auto scrollbar'>
            { Array.from({ length: 10 }).map((_, i) => <MessageSkeleton key={i} isMine={i % 2 === 0} displayDay={i % 5 === 0} />) }
        </div>
        {/* input */}
        <div className='px-3 pb-3 mt-2 w-full'>
            <div className='flex items-center justify-center gap-4'>
                <div className='size-10 rounded-full shrink-0 animate-pulse bg-light-300 dark:bg-dark-300'/>
                <div className='w-full h-12 rounded-3xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
                <div className='size-10 rounded-full shrink-0 animate-pulse bg-light-300 dark:bg-dark-300'/>
                <div className='h-13 w-16 rounded-full shrink-0 animate-pulse bg-light-300 dark:bg-dark-300'/>
            </div>
        </div>
   </div>
  )
}

export default ChatContainerSkeleteon