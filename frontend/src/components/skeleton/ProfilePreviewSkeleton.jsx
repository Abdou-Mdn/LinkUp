import React from 'react'

const ProfilePreviewSkeleton = () => {
  return (
    <div className='w-full flex items-center gap-2 p-1 mt-1'>
       <div className='size-12 rounded-[50%] animate-pulse bg-light-300 dark:bg-dark-300'/>
       <div>
            <div className='w-[150px] h-4 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
            <div className='w-[180px] h-2 mt-2 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
       </div>
    </div>
  )
}

export default ProfilePreviewSkeleton