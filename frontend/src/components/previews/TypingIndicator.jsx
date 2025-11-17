import React from 'react'
import { motion } from 'motion/react'

const TypingIndicator = ({profilePic=""}) => {

    // variants for animated dots
    const dotVariants = {
        initial: {y: 0},
        animate: {y: -5}
    };

    // transitions for the dots
    const dotTransition = {
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
    };

  return (
    <div className='w-full px-4 py-1 mt-1 flex justify-start'>
        {/* message container */}
        <div className='max-w-[80%] lg:max-w-[65%]'>
            <div className='pl-6 lg:pl-9'>
                <div className='w-full relative'>
                    {/* message bubble */}
                    <div className='w-full py-3.5 px-4 flex items-center justify-center gap-1.5 bg-light-300 dark:bg-dark-300 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl'>
                        {/* animated dots */}
                        <motion.div
                            variants={dotVariants}
                            initial="initial"
                            animate="animate"
                            transition={{...dotTransition, delay: 0}}
                            className='size-2 rounded-full bg-light-txt2 dark:bg-dark-txt2'
                        />
                        <motion.div
                            variants={dotVariants}
                            initial="initial"
                            animate="animate"
                            transition={{...dotTransition, delay: 0.2}}
                            className='size-2 rounded-full bg-light-txt2 dark:bg-dark-txt2'
                        />
                        <motion.div
                            variants={dotVariants}
                            initial="initial"
                            animate="animate"
                            transition={{...dotTransition, delay: 0.4}}
                            className='size-2 rounded-full bg-light-txt2 dark:bg-dark-txt2'
                        />
                    </div>
                    {/* user profile picture */}
                    <div className='size-6 lg:size-8 rounded-full bg-transparent absolute bottom-0 -left-7 lg:-left-9'>
                        <img src={ profilePic ? profilePic : '/assets/avatar.svg'} className='size-6 lg:size-8 rounded-full shrink-0' />
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default TypingIndicator