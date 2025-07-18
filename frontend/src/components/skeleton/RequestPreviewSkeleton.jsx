import React from 'react'

const RequestPreviewSkeleton = ({isSent}) => {
  return (
    <div className='w-full flex items-center gap-2 p-1 mt-2 bg-light-200 dark:bg-dark-200'>
       <div className='size-12 rounded-[50%] animate-pulse bg-light-300 dark:bg-dark-300'/>
       <div className='flex flex-col min-w-0 flex-1'>
            <div className='w-[130px] h-4 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
            <div className='w-[150px] h-2 mt-2 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
       </div>
       <div className='flex items-center gap-2'>
          <div className='size-9 rounded-lg animate-pulse bg-light-300 dark:bg-dark-300'></div>
          {!isSent && <div className='size-9 rounded-lg animate-pulse bg-light-300 dark:bg-dark-300'></div>}
        </div>
    </div>
  )
}

export default RequestPreviewSkeleton