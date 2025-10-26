import React, { useState } from 'react'
import { TriangleAlert } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

import { deleteAccount } from '../../lib/api/user.api';

import ForgotPasswordModal from '../layout/ForgotPasswordModal';
import SecondaryButton from '../SecondaryButton';
import TextInput from '../TextInput';

/* 
 * DeleteAccount component
 * Main container for delete account option.

 * Integrates with API functions:
 * - `deleteAccount`
 */
const DeleteAccount = () => {

    // management states
    const [loading, setLoading] = useState(false); 
    const [password, setPassword] = useState(""); // password input text
    const [displayModal, setDisplayModal] = useState(false) // forgot password modal visibility state

    // handle delete account
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            await deleteAccount(password);
        } catch (error) {
            console.log("error in deleting account ", error);
        } finally {
            setLoading(false);
        }
    }
  
    return (
    <>
        <form onSubmit={handleSubmit} className='size-full flex flex-col p-8 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'>
            {/* warning text */}
            <div>
                <h2 className='text-xl font-bold font-outfit'>Delete Your Account</h2>
                <h3 className='text-danger lg:text-lg font-semibold flex items-center gap-2 mt-8'>
                    <TriangleAlert className='size-5' />
                    <span>Warning: This action is irreversible.</span>
                    <TriangleAlert className='size-5' />
                </h3>
                <span className='text-sm text-danger'>
                    You are about to permanently delete your account. All associated data will be lost, and this cannot be undone.
                </span>
            </div>
            <div className='w-full py-3 my-2 flex flex-col gap-3'>
                {/* password input */}
                <TextInput
                    label='Type your password to confirm deletion'
                    placeholder='••••••••'
                    isPassword={true}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    openModal={() => setDisplayModal(true)}
                />
                
                {/* submit button */}
                <SecondaryButton
                    text="Delete Account" 
                    className='lg:w-1/2 min-w-[300px] p-2 mt-2' 
                    type='submit'
                    isColored={true}
                    loading={loading}
                    disabled={password.length < 8}
                />
            </div>
        </form>
        {/* forgot password modal */}
        <AnimatePresence>
        {
            displayModal && <ForgotPasswordModal onClose={() => setDisplayModal(false)} />
        }
        </AnimatePresence>
    </>
  )
}

export default DeleteAccount