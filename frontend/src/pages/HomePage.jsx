import React from 'react'
import { useAuthStore } from '../store/auth.store'

import PrimaryButton from '../components/PrimaryButton'
import { useLayoutStore } from '../store/layout.store';
import ResponsiveLayout from '../components/layout/ResponsiveLayout';

function HomePage() {

  const { logout } = useAuthStore();
  const { setMainActive, isMobile } = useLayoutStore();

  const Aside = () => (
    <div className='size-full flex justify-center items-center bg-light-200'>
      { isMobile && <div className='min-h-[200vh] w-full'> <PrimaryButton text="open" onClick={() => setMainActive(true)} /> </div>} 
    </div>
  ) 

  const Main = () => (
    <div className='size-full flex justify-center items-center bg-light-100'>
      { isMobile && <PrimaryButton text="close" onClick={() => setMainActive(false)} />}
      
    </div>
  )

  return (
    <ResponsiveLayout aside={<Aside />} main={<Main />} />
  )
}

export default HomePage