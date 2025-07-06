import React from 'react'
import { useLayoutStore } from '../../store/layout.store'
import { ArrowLeft } from 'lucide-react';

const MobileHeader = ({title}) => {
    const {isMobile, isMainActive, setMainActive} = useLayoutStore();


  return (
    isMobile && isMainActive &&
    <div className='bg-light-200 dark:bg-dark-200 text-light-txt dark:text-dark-txt 
        sticky top-0 left-0 right-0 p-2 flex items-center gap-2 capitalize z-10'>
        {/* go back button  */}
        <button onClick={() => setMainActive(false)} className='size-8 flex items-center justify-center'>
            <ArrowLeft className='size-6' />
        </button>
        { title }
    </div>
  )
}

export default MobileHeader