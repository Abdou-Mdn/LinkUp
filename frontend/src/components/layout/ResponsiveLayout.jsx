import React from 'react'
import { useLayoutStore } from '../../store/layout.store'

function ResponsiveLayout({aside, main}) {

    const { isMobile, isMainActive } = useLayoutStore();

    if(isMobile) {
        return (
            <div className='min-h-screen flex'>
                { isMainActive ? main : aside }
            </div>
        )
    }


  return (
    <div className='h-screen flex flex-row pl-20'>
        <div className='w-[40%] max-w-[350px] min-h-screen h-full bg-light-200 dark:bg-dark-200'>
            { aside }
        </div>
        <div className='flex-1 h-screen overflow-y-scroll bg-light-100 dark:bg-dark-100'>
            { main }
        </div>
    </div>
  )
}

export default ResponsiveLayout