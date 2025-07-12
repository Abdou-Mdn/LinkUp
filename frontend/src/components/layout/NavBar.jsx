import React from 'react'
import { useLayoutStore } from '../../store/layout.store'
import { House, Compass, UserCheck, Users, MessagesSquare, Moon, Sun, MessageCircleMore } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';

const Tab = ({path, icon, toolip}) => {
    const { isMobile } = useLayoutStore();
    return(
    <NavLink 
        to={path}
        className={({ isActive}) => `
        ${ isMobile ? 'size-9' :'size-10'} flex items-center justify-center 
        rounded-[50%] transition-all cursor-pointer relative group hover:rounded-[10px]
        ${ isActive ? 'bg-primary text-inverted' : 
            isMobile ? 'text-light-txt dark:text-dark-txt' :
            'bg-light-200 text-light-txt dark:bg-dark-200 dark:text-dark-txt hover:bg-light-txt hover:text-light-200 dark:hover:bg-dark-txt dark:hover:text-dark-200'
        }`}
        
    >
        { icon }
        {!isMobile && <span 
            className='absolute right-[-100px] w-20 text-center p-2 rounded-2xl z-40 scale-0 group-hover:scale-100 bg-light-txt text-light-100 dark:bg-dark-txt dark:text-dark-100'
        >
            { toolip }
        </span>}
    </NavLink>
)}

const ThemeSwitch = ({direction = 'vertical'}) => {
    const { theme, toggleTheme } = useThemeStore();

    const isDark = theme == 'dark';
    const isVertical = direction == 'vertical' 

    return (
        <button 
            onClick={toggleTheme}
            title='Toggle Theme'
            className={`bg-light-200 dark:bg-dark-200 rounded-3xl relative cursor-pointer
                ${ isVertical ? 'h-18 w-10' : 'h-8 w-15'}`}
        >
            <div className={`${ isVertical ? 'size-8' : 'size-6'} rounded-3xl flex justify-center items-center 
                bg-light-100 dark:bg-dark-100 transition-all absolute left-1 top-1 
                ${isDark ? isVertical ? 'translate-y-8' : 'translate-x-7' : 'translate-y-0 translate-x-0'}`}>
                {
                    isDark ? <Moon className='size-4 text-dark-txt' /> : <Sun className='size-4 text-light-txt'/>
                }
            </div>
        </button>
    )
}


function NavBar() {

    const { isMobile, isMainActive } = useLayoutStore();
    const { authUser } = useAuthStore();

    if(isMobile) {
        return isMainActive ? null :  (
            <div className='bg-light-300 dark:bg-dark-300 sticky top-0 left-0 right-0 py-2 z-40'>
               {/* top section */}
               <div className='flex  px-5 justify-between'>
                    {/* logo */}
                    <div className='flex flex-row justify-center items-center gap-2'>
                        <img src='/assets/logo.svg' className='size-7' />
                        <h1 className='font-outfit text-lg font-semibold text-light-txt dark:text-dark-txt'>LinkUp</h1>
                    </div>
                    <ThemeSwitch direction='horizontal' />
               </div>
               {/* bottom section */}
               <nav className='flex gap-3 items-center justify-between px-10 mt-2'>
                <Tab 
                    path='/'
                    icon={<MessageCircleMore className='size-6' />} 
                    toolip='Chats'
                />
                <Tab 
                    path='/discover'
                    icon={<Compass className='size-6' />} 
                    toolip='Discover'
                />
                <Tab 
                    path='/friends'
                    icon={<UserCheck className='size-6' />} 
                    toolip='Friends'
                />
                <Tab 
                    path='/groups'
                    icon={<Users className='size-6' />} 
                    toolip='Groups'
                />
                <NavLink 
                    to='/profile'
                    className={({ isActive}) => `
                    flex items-center justify-center overflow-hidden
                    rounded-[50%] transition-all cursor-pointer relative group hover:rounded-[10px]
                    ${ isActive ? 'size-6 outline-4 outline-offset-1 outline-primary' : 'size-7'
                    }`}
                    
                >
                    {
                        authUser.profilePic ? <img src={authUser.profilePic} className='size-full'/> :  
                        <img src='/assets/avatar.svg' className='size-full'/> 
                    }
                </NavLink>
            </nav>
            </div>
        )
    }

  return (
    <div className='absolute left-0 top-0 bottom-0 w-20 py-4 flex flex-col z-40 justify-between bg-light-300 dark:bg-dark-300'>
        {/* top section */}
        <div className=' flex flex-col gap-4'>
            {/* logo */}
            <img src="/assets/logo.svg" alt="LinkUp" className='size-12 mx-auto' />

            <nav className='flex flex-col gap-3 items-center'>
                <Tab 
                    path='/'
                    icon={<MessageCircleMore className='size-6' />} 
                    toolip='Chats'
                />
                <Tab 
                    path='/discover'
                    icon={<Compass className='size-6' />} 
                    toolip='Discover'
                />
                <Tab 
                    path='/friends'
                    icon={<UserCheck className='size-6' />} 
                    toolip='Friends'
                />
                <Tab 
                    path='/groups'
                    icon={<Users className='size-6' />} 
                    toolip='Groups'
                />
            </nav>
        </div>

        {/* bottom section */}
        <div className=' flex flex-col items-center gap-4'>
            {/* theme switch */}
            <ThemeSwitch />
            {/* profile */}
            <NavLink 
                to='/profile'
                className={({ isActive}) => `
                flex items-center justify-center overflow-hidden
                rounded-[50%] transition-all cursor-pointer relative group hover:rounded-[10px]
                ${ isActive ? 'size-8 outline-4 outline-offset-1 outline-primary' : 'size-9'
                }`}
                
            >
                {
                    authUser.profilePic ? <img src={authUser.profilePic} className='size-full'/> :  
                    <img src='/assets/avatar.svg' className='size-full'/> 
                }
            </NavLink>
        </div>
    </div>
  )
}

export default NavBar