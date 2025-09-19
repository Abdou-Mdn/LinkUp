import React from 'react'
import { useLayoutStore } from '../../store/layout.store'
import { ArrowLeft } from 'lucide-react';

/* 
 * MobileHeader Component
 
 * Displays a sticky header bar **only on mobile devices** when the `main` view is active.
 
 * Includes:
 * - A "back" button (ArrowLeft) that switches from the `main` view back to the `aside`.
 * - A dynamic `title` passed as a prop.
 
 * params:
 *  - title: the view's title 
*/

const MobileHeader = ({title}) => {
    const {isMobile, isMainActive, setMainActive} = useLayoutStore();

  return (
    isMobile && isMainActive &&
    <div className='sticky top-0 left-0 right-0 p-2 flex items-center gap-2 capitalize z-10 bg-light-200 dark:bg-dark-200 text-light-txt dark:text-dark-txt'>
        {/* go back button  */}
        <button 
          onClick={() => setMainActive(false)} 
          className='p-1 rounded-lg flex items-center justify-center cursor-pointer hover:bg-light-300 hover:dark:bg-dark-300'
        >
            <ArrowLeft className='size-6' />
        </button>
        { title }
    </div>
  )
}

export default MobileHeader