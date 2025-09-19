import React, { useState } from 'react'
import { Eye, EyeClosed } from 'lucide-react';


/* 
 * TextInput Component
 
 * Displays a styled text input
  
 * params:
 * - label: input's label 
 * - isPassword: boolean to check whether input is password or normal (defaults to false)
 * - placeholder: input's placeholder (empty state)
 * - value: input's text state 
 * - onChange: callback function to update input's text state and error state when user's types on the input
 * - error: inpt's error state (defaults to non)
 * - openModal: callback function to open forgot password modal (defaults to null)
 * - darkTheme: boolean controls whether input accepts dark theme or not (no dark theme in signup and login pages)
 * - fullWidth: boolean controls whether input takes the full width or half
*/
const TextInput = ({label, placeholder, value, onChange, isPassword = false, error = null, openModal = null, darkTheme = true, fullWidth = false}) => {
    // password visibility state
    const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`${fullWidth ? 'w-full' : 'lg:w-1/2'} min-w-[300px]`}>
        {/* input label */}
        <label htmlFor='input' className={`font-outfit text-sm pl-1 text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'}`}>
            {label}
        </label>
        {/* text input */}
        <div className='relative'>
            <input 
                it='input'
                type={isPassword && !showPassword ? 'password' : 'text'}
                autoComplete='off'
                className={`p-1 w-full outline-0 
                    ${ error ? 'border-b-2 border-danger text-danger' : 
                    `border-b-1 focus:border-b-2 border-light-txt2 focus:border-light-txt text-light-txt ${darkTheme && 'dark:border-dark-txt2 dark:focus:border-dark-txt dark:text-dark-txt'}`}  
                `}
                placeholder={placeholder} 
                value={value}
                onChange={onChange}
            />
            {/* password visibility button (only on password) */}
            { isPassword && 
                <button
                    type='button'
                    className='absolute inset-y-0 right-0 flex items-center cursor-pointer'
                    onClick={() => setShowPassword(!showPassword)}
                >
                    { showPassword ? (
                        <Eye className='size-6 text-light-txt2' />
                    ): (
                        <EyeClosed className='size-6 text-light-txt2' />
                    )
                    }
                </button>
            }
        </div>
        <div className='flex items-center justify-between'>
            {/* error span */}
            <span className="text-xs min-h-[1rem] block">
                {error && <span className="text-danger">{error}</span>}
            </span>
            {/* open modal button */}
            { openModal &&
                <button 
                    type='button' 
                    className='text-sm cursor-pointer text-primary hover:text-secondary hover:underline'
                    onClick={openModal}
                >
                    Forgot your password ?
                </button> 
            }
        </div>   
    </div>
  )
}

export default TextInput
