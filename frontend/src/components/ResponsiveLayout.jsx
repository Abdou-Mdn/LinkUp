import React from 'react'
import { useLayoutStore } from '../store/layout.store'

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
    <div className='min-h-screen flex flex-row pl-20'>
        <div className='w-[40%] max-w-[350px] h-full'>
            { aside }
        </div>
        <div className='flex-1 h-full'>
            { main }
        </div>
    </div>
  )
}

export default ResponsiveLayout