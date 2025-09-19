import React, { useEffect, useRef, useState } from 'react'
import { Eye, EyeClosed } from 'lucide-react';


/* 
 * DynamicTextarea Component
 
 * Displays a styled text input with dynamic size that changes based on text's length (used for bio and descriptions)  

 * params:
 * - label: input's label 
 * - placeholder: input's placeholder (empty state)
 * - value: input's text state 
 * - onChange: callback function to update input's text state when user's types on the input
*/
const DynamicTextarea = ({label, placeholder, value, onChange}) => {
    
    // input ref
    const inputRef = useRef(null);

    // dynamic resize textarea
    useEffect(() => {
        const input = inputRef.current;
        if (!input) return;

        // reset height to "auto" so the browser recalculates the correct scrollHeight
        input.style.height = "auto";

        // Define line height and maximum allowed height
        const lineHeight = 24; // each line is ~24px tall
        const maxHeight = lineHeight * 3; // limit to 3 lines of text

        // adjust the height dynamically:
        // - use the element's scrollHeight (actual content height)
        // - cap it at the maxHeight so it doesn’t keep growing indefinitely
        input.style.height = Math.min(input.scrollHeight, maxHeight) + "px";
    }, [value]);

  return (
    <div className='lg:w-1/2 min-w-[300px]'>
        {/* input's label */}
        <label htmlFor='input' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
            {label}
        </label>
        {/* text area */}                
        <textarea
            ref={inputRef} 
            id='input'
            rows={1}
            maxLength={150}
            className={`p-1 w-full resize-none outline-0 border-b-1 border-light-txt2 dark:border-dark-txt2 focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt text-light-txt dark:text-dark-txt`} 
            placeholder={placeholder}
            autoComplete='off'
            value={value}
            onChange={onChange}
        />
        {/* character counter */}
        <span className='text-xs text-light-txt2 dark:text-dark-txt2 pl-1'>
            {value.length}/150
        </span>
    </div>
  )
}

export default DynamicTextarea
