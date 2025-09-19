import React from 'react'
import { Compass, UserCheck, Users, Moon, Sun, MessageCircleMore } from 'lucide-react'
import { NavLink } from 'react-router-dom';

import { useLayoutStore } from '../../store/layout.store'
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';

/* 
 * Tab Component
 * Represents a navigation tab with an icon and optional tooltip. 
 
  *params:  
    - path : route to navigate to 
    - icon: tab's icon
    - toolip: tab title text shown on hover
*/
const Tab = ({path, icon, toolip}) => {
    const { isMobile } = useLayoutStore();
    return(
    <NavLink 
        to={path}
        className={({isActive}) => `p-2 lg:p-3 flex items-center justify-center rounded-3xl hover:rounded-lg transition-all cursor-pointer relative group
            ${ isActive ? 'bg-primary text-inverted' : 
                'bg-light-200 dark:bg-dark-200 hover:bg-light-txt hover:dark:bg-dark-txt text-light-txt dark:text-dark-txt hover:text-light-200 hover:dark:text-dark-200' }
        `}
    >
        { icon }
        {!isMobile && 
        <span 
            className='absolute right-[-100px] w-20 text-center p-2 rounded-2xl z-40 scale-0 group-hover:scale-100 bg-light-txt dark:bg-dark-txt text-light-100 dark:text-dark-100'
        >
            { toolip }
        </span>}
    </NavLink>
)}


/* 
 * ThemeSwitch Component
 * Represents a button to toggle between light and dark.
 * vertical on desktop, horizental on mobile 
 
 * params:
    - direction : "vertical" or "horizental" 
*/
const ThemeSwitch = ({direction = 'vertical'}) => {
    const { theme, toggleTheme } = useThemeStore();

    const isDark = theme === 'dark';
    const isVertical = direction === 'vertical' 

    return (
        <button 
            onClick={toggleTheme}
            title='Toggle Theme'
            className={`rounded-3xl relative cursor-pointer bg-light-200 dark:bg-dark-200 ${ isVertical ? 'h-15 w-8 lg:h-18 lg:w-10' : 'h-8 w-15'}`}
        >
            <div 
                className={`rounded-3xl flex justify-center items-center transition-all absolute left-1 top-1 bg-light-100 dark:bg-dark-100
                ${ isVertical ? 'size-6 lg:size-8' : 'size-6'}  ${isDark ? isVertical ? 'translate-y-7 lg:translate-y-8' : 'translate-x-7' : 'translate-y-0 translate-x-0'}`}
            >
                {
                    isDark ? <Moon className='size-4 text-dark-txt' /> : <Sun className='size-4 text-light-txt'/>
                }
            </div>
        </button>
    )
}


/* 
 * NavBar Component
 * Renders the main navigation bar for the app. 
 * - On mobile: sticky top bar with logo, theme toggle, and bottom navigation tabs.
 * - On desktop: vertical sidebar with logo, navigation tabs, theme toggle, and profile shortcut.
*/
function NavBar() {
    const { isMobile, isMainActive } = useLayoutStore();
    const { authUser } = useAuthStore();

    // mobile version
    if(isMobile) {
        return isMainActive ? null :  (
            <div className='sticky top-0 left-0 right-0 py-3 z-40 bg-light-300 dark:bg-dark-300'>
               {/* top section: logo and theme switch */}
               <div className='px-5 flex justify-between'>
                    <div className='flex flex-row justify-center items-center gap-2'>
                        <img src='/assets/logo.svg' className='size-7' />
                        <h1 className='font-outfit text-lg font-semibold text-light-txt dark:text-dark-txt'>LinkUp</h1>
                    </div>
                    <ThemeSwitch direction='horizontal' />
               </div>
               {/* bottom section: tab navigation */}
               <nav className='px-6 mt-3 flex gap-3 items-center justify-between'>
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
                    className={({ isActive}) => `flex items-center justify-center overflow-hidden rounded-full hover:rounded-lg transition-all cursor-pointer relative group
                    ${ isActive ? 'size-7 outline-4 outline-offset-1 outline-primary' : 'size-8'}`}
                >
                    {
                        <img src={authUser.profilePic ? authUser.profilePic : '/assets/avatar.svg'} className='size-full'/>
                    }
                </NavLink>
            </nav>
            </div>
        )
    }

    // desktop version
  return (
    <div className='absolute left-0 top-0 bottom-0 z-40 w-20 py-2 lg:py-4 flex flex-col justify-between bg-light-300 dark:bg-dark-300'>
        {/* top section: logo and tab navigation */}
        <div className='flex flex-col gap-2 lg:gap-4'>
            <img src="/assets/logo.svg" alt="LinkUp" className='size-9 lg:size-12 mx-auto' />

            <nav className='flex flex-col gap-1 lg:gap-3 items-center'>
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

        {/* bottom section: theme switch and profile navlink */}
        <div className='flex flex-col items-center gap-4'>
            <ThemeSwitch />

            <NavLink 
                to='/profile'
                className={({ isActive}) => `flex items-center justify-center overflow-hidden rounded-full hover:rounded-lg transition-all cursor-pointer relative group
                ${ isActive ? 'size-7 lg:size-9 outline-4 outline-offset-1 outline-primary' : 'size-8 lg:size-10'}`}
            >
                {
                    <img src={authUser.profilePic ? authUser.profilePic : '/assets/avatar.svg'} className='size-full'/>
                }
            </NavLink>
        </div>
    </div>
  )
}

export default NavBar