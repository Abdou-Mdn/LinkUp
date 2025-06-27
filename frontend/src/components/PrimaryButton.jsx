import React from 'react';
import { LoaderCircle } from 'lucide-react';

function PrimaryButton({ text, onClick, type = "button", disabled = false, loading = false }) {
  const isDisabled = disabled || loading;
  return (
    <button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        className={
            `outline-0 w-full text-center p-3 rounded-4xl transition-all font-medium border-1 mt-2 
            ${isDisabled 
            ? 'bg-gradient-to-tr from-gray-500 to-gray-600 text-inverted cursor-not-allowed' 
            : 'bg-gradient-to-tr from-primary to-secondary text-inverted cursor-pointer hover:from-transparent hover:to-transparent hover:border-secondary hover:text-secondary'
            }`
        }
    >
        {loading ? (
            <LoaderCircle className="size-5 mx-auto animate-spin" />
        ) : (
            text
        )}
    </button>
  )
}

export default PrimaryButton