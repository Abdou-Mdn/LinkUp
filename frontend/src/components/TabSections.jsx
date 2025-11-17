import React from 'react'
import { motion, AnimatePresence } from 'motion/react';

const TabSections = ({ direction, activeTab, children}) => {
    // animation varaints 
    const slideVariants = {
        initial: (direction) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0
        }),
        animate: {
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            x: direction > 0 ? -300 : 300,
            opacity: 0
        })
    };

  return (
    <div className='size-full relative overflow-hidden'>
        <AnimatePresence initial={false} custom={direction}>
            {/* filter tabs and keep only active tab */}
            {children.filter(child => child.props.tabID === activeTab).map(child => {
                /* remove tabID and clone child (prevent passing a non HTML prop to the DOM) */
                const { tabID, ...rest } = child.props;
                const cloned = React.cloneElement(child, rest);
                return (
                    <motion.div
                        key={tabID}
                        custom={direction}
                        variants={slideVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30}}
                        className='absolute inset-0'
                    >
                        {cloned}
                    </motion.div>
                )
            })}
        </AnimatePresence>
    </div>
  )
}

export default TabSections