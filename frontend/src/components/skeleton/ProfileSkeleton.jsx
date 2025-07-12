import React from 'react'
import ProfilePreviewSkeleton from './ProfilePreviewSkeleton'

const ProfileSkeleton = () => {
  return (
    <div className='size-full bg-light-100 dark:bg-dark-100'>
        {/* pictures */}
        <div className='w-full h-[270px] relative'>
          {/* cover image */}
          <div className='w-full h-[200px] animate-pulse bg-light-300 dark:bg-dark-300'></div> 
          {/* profile picture */}
          <div className='size-[150px] rounded-[50%] absolute left-8 bottom-0 border-4 animate-pulse bg-light-300 dark:bg-dark-300 border-light-100 dark:border-dark-100' />
        </div>
        {/* main infos */}
        <div className='w-full p-3 mb-2 lg:pl-10 relative'>
          <div className='w-[150px] h-6 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
          {/* action buttons */}
          <div className='flex flex-col gap-1 lg:items-end my-3 lg:absolute lg:top-[-50px] lg:right-8'>
            <div className='min-w-[300px] w-[75%] h-4 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
            <div className='flex items-center gap-4 mt-2'>
              <div className='w-[120px] h-10 rounded-4xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
              <div className='w-[120px] h-10 rounded-4xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
            </div>
          </div>

          <div className='mt-6 flex flex-col gap-2'>
            <div className='min-w-[300px] w-[75%] h-4 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
            <div className='w-[250px] h-4 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
          </div>
        </div>
        {/* additional infos */}
        <div className='w-full flex flex-col lg:flex-row items-start justify-between p-2 gap-4 lg:gap-0'>
          <div className='w-full pl-3 lg:pl-8 lg:w-1/2'>
            <div className='flex gap-2 py-2'>
                <div className='w-[250px] h-6 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
            </div>
            <div className='flex gap-2 py-2'>
                <div className='w-[250px] h-6 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
            </div>
            <div className='flex gap-2 py-2'>
                <div className='w-[250px] h-6 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
            </div>
            <div className='flex gap-2 py-2'>
                <div className='w-[250px] h-6 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
            </div>
            <div className='w-[120px] h-6 rounded-2xl my-2 animate-pulse bg-light-300 dark:bg-dark-300'></div>
          </div>
          <div className='w-full pl-3 lg:pl-8 lg:w-1/2'>
            <div className='flex gap-2 items-center justify-between py-2 px-4'>
              <div className='w-[150px] h-6 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
              <div className='w-[50px] h-6 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
            </div>
            <div>
              {
                Array.from({ length: 2 }).map((_, i) => <ProfilePreviewSkeleton key={i} />)
              }
            </div>
          </div>
        </div>
    </div>
  )
}

export default ProfileSkeleton