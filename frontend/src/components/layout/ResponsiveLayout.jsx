import React from 'react'
import { useLayoutStore } from '../../store/layout.store'

/* 
 * ResponsiveLayout Component
  
 * Dynamically renders the application's layout depending on whether the user is on a mobile or desktop device.
  
 * - On Mobile: Displays either the `main` view or `aside` (sidebar), based on the `isMainActive` state.
 * - On Desktop: Renders a two-column layout, with the `aside` on the left and `main` content on the right.
 
 * params:
 *  - aside: content of the sidebar
 *  - main: content of the main section
*/

function ResponsiveLayout({aside, main}) {

    const { isMobile, isMainActive } = useLayoutStore();

    // mobile layout
    if(isMobile) {
        return (
            <div className='h-screen flex'>
                { isMainActive ? main : aside }
            </div>
        )
    }

    // desktop layout
  return (
    <div className='h-screen flex flex-row pl-20'>
        <div className='w-[40%] max-w-[350px] h-screen bg-light-200 dark:bg-dark-200'>
            { aside }
        </div>
        <div className='flex-1 h-screen bg-light-100 dark:bg-dark-100'>
            { main }
        </div>
    </div>
  )
}

export default ResponsiveLayout