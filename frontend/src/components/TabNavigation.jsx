import React from 'react'
import { motion } from 'motion/react'

const TabNavigation = ({tabs, activeTab, onTabChange}) => {
  return (
    <div className='w-full relative border-b border-light-txt2 dark:border-dark-txt2'>
        <div className='flex'>
            {
                tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`relative flex-1 py-3 text-sm font-outfit font-medium text-center cursor-pointer transition-all duration-200 ${activeTab === tab.id ? 'text-primary' : 'text-light-txt dark:text-dark-txt hover:text-light-txt2 hover:dark:text-dark-txt2'}`}
                    >
                        { tab.label }
                        { activeTab === tab.id && (
                            <motion.div
                                layoutId='activeTab'
                                className='absolute bottom-0 left-0 right-0 h-1 rounded-xs bg-primary'
                                transition={{type: 'spring', stiffness: 500, damping: 30}}
                            />
                        )}
                    </button>
                ))
            }
        </div>
    </div>
  )
}

export default TabNavigation