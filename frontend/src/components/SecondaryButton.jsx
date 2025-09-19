import React from 'react';
import { LoaderCircle } from 'lucide-react';


/* 
 * SecondaryButton Component
 
 * Displays the secondary button type  
 * used for destructive actions
 * the button's colors are based on iscolored prop:
 * - true: transparent background and danger colors, on hover becomes danger background with inverted colors
 * - false: transparent background and text colors, on hover becomes danger colors
 
 * params:
 * - text: text content of button
 * - onclick: callback function triggered when button is clicked
 * - type: button type (defaults to "button")
 * - disabled: boolean to control state of button (defaults to false)
 * - loading: loading state of the button, displays a loader (defaults to false)
 * - className: additional tailwind classes for customization 
 * - leftIcon: icon object to diplay before the text (defaults to null)
 * - rightIcon: icon object to display after the text (defaults to null)
 * - toolip: button's title
 * - loaderSize: tailwind classes to control the loader's size
 */
function SecondaryButton({ 
    text, 
    onClick = () => {}, 
    type = "button", 
    disabled = false, 
    loading = false,
    className = "",
    isColored = true,
    leftIcon = null,
    rightIcon = null,
    toolip=null,
    loaderSize = "size-6"
}) {
  const isDisabled = disabled || loading;
  return (
    <button
        type={type}
        title={toolip}
        onClick={onClick}
        disabled={isDisabled}
        className={`outline-0 text-center rounded-4xl transition-all font-medium border-1 
            ${ isDisabled ? 'border-gray-500 bg-gray-500 text-inverted cursor-not-allowed' : 
                isColored ? 'border-danger text-danger bg-transparent hover:text-inverted hover:bg-danger cursor-pointer' :
                'border-light-txt text-light-txt dark:border-dark-txt dark:text-dark-txt hover:border-danger hover:text-danger cursor-pointer'
             }
            ${className}
        `}
    >
        {loading ? (
            <LoaderCircle className={`${loaderSize} mx-auto animate-spin`} />
        ) : (
            <div className='flex items-center justify-center gap-2'>
                {leftIcon}
                {text}
                {rightIcon}
            </div>
        )}
    </button>
  )
}

export default SecondaryButton