import React from 'react'

import PrimaryButton from '../components/PrimaryButton'
import { useAuthStore } from '../store/auth.store'

function HomePage() {

  const { logout } = useAuthStore();

  return (
    <div>
      HomePage

      <div className='w-1/2'>
        <PrimaryButton
          text="Logout"
          onClick={logout}
        />
      </div>
    </div>
  )
}

export default HomePage