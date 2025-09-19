import React from 'react';
import { LoaderCircle } from 'lucide-react';


/* 
 * PrimaryButton Component
 
 * Displays the primary button type   
 * used for important and primary actions 
 * the button's colors are a gradient with primary and secondary colors and text color is inverted, on hover becomes transparent background with secondary colors 
 
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
function PrimaryButton({ 
    text, 
    onClick = () => {}, 
    type = "button", 
    disabled = false, 
    loading = false,
    className,
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
        className={`outline-0 text-center rounded-4xl transition-all font-medium border-1 border-transparent
            ${isDisabled ? 'bg-gradient-to-tr from-gray-500 to-gray-600 text-inverted cursor-not-allowed' : 'bg-gradient-to-tr from-primary to-secondary text-inverted cursor-pointer hover:from-transparent hover:to-transparent hover:border-secondary hover:text-secondary'}
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

export default PrimaryButton