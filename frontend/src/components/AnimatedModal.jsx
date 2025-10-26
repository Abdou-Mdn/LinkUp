import React from 'react'
import { motion } from 'motion/react'

const AnimatedModal = ({children, onClose, className = '', darkTheme= true}) => {
  return (
    <motion.div 
        key="modal-overlay"
        onClick={onClose} 
        className={`bg-[#00000066] ${darkTheme && 'dark:bg-[#ffffff66]'} fixed inset-0 z-50 flex items-center justify-center`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    >
        <motion.div 
            key="modal-body"
            onClick={(e) => e.stopPropagation()} 
            className={className}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2, layout: { duration: 0.3, ease: "easeInOut" }}}
            layout
        >
            { children }
        </motion.div>
    </motion.div>
  )
}

export default AnimatedModal