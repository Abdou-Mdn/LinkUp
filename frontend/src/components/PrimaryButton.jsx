import React from 'react';
import { LoaderCircle } from 'lucide-react';

function PrimaryButton({ 
    text, 
    onClick = () => {}, 
    type = "button", 
    disabled = false, 
    loading = false,
    className = "w-full p-3",
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
            `outline-0 text-center rounded-4xl transition-all font-medium border-1 border-transparent
            ${className}
            ${isDisabled 
            ? 'bg-gradient-to-tr from-gray-500 to-gray-600 text-inverted cursor-not-allowed' 
            : 'bg-gradient-to-tr from-primary to-secondary text-inverted cursor-pointer hover:from-transparent hover:to-transparent hover:border-secondary hover:text-secondary'
            }`
        }
    >
        {loading ? (
            <LoaderCircle className="size-5 mx-auto animate-spin" />
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