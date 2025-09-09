import React, { useState } from 'react'
import { useAuthStore } from '../../store/auth.store';
import { Eye, EyeClosed, TriangleAlert } from 'lucide-react';
import PrimaryButton from '../PrimaryButton';
import ForgotPasswordModal from '../layout/ForgotPasswordModal';
import SecondaryButton from '../SecondaryButton';
import { deleteAccount } from '../../lib/api/user.api';

const DeleteAccount = () => {

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [displayModal, setDisplayModal] = useState(false)

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
            <div className=''>
                <h2 className='text-xl font-bold font-outfit'>Delete Your Account</h2>
                <h3 className='text-danger text-lg font-semibold flex items-center gap-2 mt-8'>
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
                <div className='w-1/2 min-w-[300px]'>
                    <label htmlFor='password' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
                        Type your password to confirm deletion
                    </label>   
                    <div className='relative'>             
                        <input 
                            id='password'
                            type={showPassword ? "text" : "password"}
                            autoComplete='off'
                            className='p-1 w-full outline-0 border-b-1 border-light-txt2 dark:border-dark-txt2 focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt text-light-txt dark:text-dark-txt' 
                            placeholder='••••••••'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type='button'
                            className='absolute inset-y-0 right-0 flex items-center cursor-pointer'
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            { showPassword ? (
                                <Eye className='size-5 text-light-txt2' />
                            ): (
                                <EyeClosed className='size-5 text-light-txt2' />
                            )
                            }
                        </button>
                    </div>
                    <div className='flex items-center justify-end'>
                        <button 
                            type='button' 
                            className='text-sm cursor-pointer text-primary hover:text-secondary hover:underline'
                            onClick={() => setDisplayModal(true)}
                        >
                            Forgot your password ?
                        </button>
                    </div>
                </div>

                <SecondaryButton
                    text="Delete Account" 
                    className='w-1/2 min-w-[300px] p-2 mt-2' 
                    type='submit'
                    isColored={true}
                    loading={loading}
                    disabled={password.length < 8}
                />
            </div>
        </form>
        {
            displayModal && <ForgotPasswordModal onClose={() => setDisplayModal(false)} />
        }
    </>
  )
}

export default DeleteAccount