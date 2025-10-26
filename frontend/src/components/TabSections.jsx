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
            {children.map(child => {
                if(child.props.tabID === activeTab) {
                    return (
                        <motion.div
                            key={child.props.tabID}
                            custom={direction}
                            variants={slideVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ type: 'spring', stiffness: 300, damping: 30}}
                            className='absolute inset-0'
                        >
                            {child}
                        </motion.div>
                    )
                }
            })}
        </AnimatePresence>
    </div>
  )
}

export default TabSections