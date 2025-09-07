import React from 'react'

const MessageSkeleton = ({isMine, displayDay}) => {
  return (
    <>
        {
            displayDay && (
                <div className='py-2 px-10 w-full flex items-center justify-center'>
                    <div className='w-[150px] h-3 rounded-2xl animate-pulse bg-light-300 dark:bg-dark-300'></div>
                </div>
            )
        }
        <div className={`w-full px-6 py-2 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div className='max-w-[70%]'>
                <div className={isMine ? 'pr-9' : 'pl-9'}>
                    <div className='w-full relative'>
                        <div 
                            className={`w-[350px] h-13 animate-pulse bg-light-300 dark:bg-dark-300
                                ${isMine ? 'rounded-tr-2xl rounded-tl-2xl rounded-bl-2xl' : 'rounded-tr-2xl rounded-tl-2xl rounded-br-2xl'}
                            `}
                        />
                        <div className={`size-9 rounded-full bg-transparent absolute bottom-0 ${isMine ? '-right-10' : '-left-10'}`}>
                            <div className='size-9 rounded-full shrink-0 animate-pulse bg-light-300 dark:bg-dark-300' />
                        </div>
                    </div>  
                </div>
            </div>
        </div>
    </>
  )
}

/* 
    <div className={`w-full px-10 py-1 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
        <div 
            className={`w-[350px] max-w-[70%] relative h-13 animate-pulse bg-light-300 dark:bg-dark-300
                ${isMine ? 'rounded-tr-2xl rounded-tl-2xl rounded-bl-2xl pr-15' : 'rounded-tr-2xl rounded-tl-2xl rounded-br-2xl pl-15'}
            `}
        > 
            <div className={`size-8 rounded-full absolute bottom-0 ${isMine ? '-right-9' : '-left-9'} animate-pulse bg-light-300 dark:bg-dark-300`}/>
        </div>
    </div>
*/

export default MessageSkeleton