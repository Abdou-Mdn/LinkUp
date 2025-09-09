import React from 'react';
import { LoaderCircle } from 'lucide-react';

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
}) {
  const isDisabled = disabled || loading;
  return (
    <button
        type={type}
        title={toolip}
        onClick={onClick}
        disabled={isDisabled}
        className={
            `outline-0 text-center rounded-4xl transition-all font-medium border-1 
             ${ isDisabled ? 'border-gray-500 bg-gray-500 text-inverted cursor-not-allowed' : 
                isColored ? 'border-danger text-danger bg-transparent hover:text-inverted hover:bg-danger cursor-pointer' :
                'border-light-txt text-light-txt dark:border-dark-txt dark:text-dark-txt hover:border-danger hover:text-danger cursor-pointer'
             }
             ${className}
            `
        }
    >
        {loading ? (
            <LoaderCircle className="size-6 mx-auto animate-spin" />
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