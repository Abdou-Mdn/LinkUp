import React, { useState } from 'react'
import { useAuthStore } from '../../store/auth.store';
import { Eye, EyeClosed } from 'lucide-react';
import PrimaryButton from '../PrimaryButton';
import ForgotPasswordModal from '../layout/ForgotPasswordModal';
import { updatePassword } from '../../lib/api/user.api';

const UpdatePassword = () => {
    const { setAuthUser } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState({
        newPassword: false,
        confirmPassword: false,
        oldPassword: false
    });
    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: "",
        oldPassword: ""
    });
    const [formErrors, setFormErrors] = useState({
        newPassword: "",
        confirmPassword: "",
        oldPassword: ""
    });

    const [displayModal, setDisplayModal] = useState(false)

    const validateForm = () => {
        let isValid = true;
        let errors = {
            newPassword: "",
            confirmPassword: "",
            oldPassword: ""
        }

        if(!formData.newPassword.trim()) {
            errors.newPassword = "New Password is required";
            isValid = false;
        } else if(formData.oldPassword.length < 8) {
            errors.newPassword = "Password must be at least 8 characters";
            isValid = false;
        }

        if(!formData.confirmPassword.trim()) {
            errors.confirmPassword = "Confirm Password is required";
            isValid = false;
        } else if (formData.confirmPassword.trim() !== formData.newPassword.trim()) {
            errors.newPassword = "Passwords are not matching";
            errors.confirmPassword = "Passwords are not matching";
            isValid = false;
        }

        if(!formData.oldPassword.trim()) {
            errors.oldPassword = "Current Password is required";
            isValid = false;
        }
        setFormErrors(errors);
        return isValid;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        const success = validateForm();

        if(success === true) {
            setLoading(true);
            try {
                const res = await updatePassword(formData.oldPassword, formData.newPassword);
                if(res?.user) {
                    setAuthUser(res.user);
                }
            } catch (error) {
                console.log("error in updating password ", error);
            } finally {
                setLoading(false);
                setFormData({
                    newPassword: "",
                    confirmPassword: "",
                    oldPassword: ""
                });
                setFormErrors({
                    newPassword: "",
                    confirmPassword: "",
                    oldPassword: ""
                })
            }
        };
    }
  
    return (
    <>
        <form onSubmit={handleSubmit} className='size-full flex flex-col p-8 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'>
            <div className=''>
                <h2 className='text-xl font-bold font-outfit'>Update Your Password</h2>
                <p className='text-light-txt2 dark:text-dark-txt2'>For security reasons, please enter your current password before setting a new one.</p>
                <p className='text-light-txt2 dark:text-dark-txt2'>Make sure your new password is strong and unique. Avoid reusing old passwords.</p>
            </div>
            <div className='w-full py-3 my-2 flex flex-col gap-3'>
                {/* current password input */}
                <div className='w-1/2 min-w-[300px]'>
                    <label htmlFor='oldPassword' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
                       Current Password
                    </label>   
                    <div className='relative'>             
                        <input 
                            id='oldPassword'
                            type={showPassword.oldPassword ? "text" : "password"}
                            autoComplete='off'
                            className={`p-1 w-full outline-0 
                                ${ formErrors.oldPassword ? 'border-b-2 border-danger text-danger' : 
                                'border-b-1 border-light-txt2 dark:border-dark-txt2 focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt text-light-txt dark:text-dark-txt'}  
                            `} 
                            placeholder='••••••••'
                            value={formData.oldPassword}
                            onChange={(e) => {
                                setFormData({...formData, oldPassword: e.target.value})
                                if (formErrors.oldPassword) setFormErrors({ ...formErrors, oldPassword: ""});
                            }}
                        />
                        <button
                            type='button'
                            className='absolute inset-y-0 right-0 flex items-center cursor-pointer'
                            onClick={() => setShowPassword({...showPassword, oldPassword: !showPassword.oldPassword})}
                        >
                            { showPassword.oldPassword ? (
                                <Eye className='size-5 text-light-txt2' />
                            ): (
                                <EyeClosed className='size-5 text-light-txt2' />
                            )
                            }
                        </button>
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className={`text-xs ${formErrors.oldPassword ? 'text-danger' : 'text-transparent'}`}>
                            { formErrors.oldPassword || "placeholder" }
                        </span>
                        <button 
                            type='button' 
                            className='text-sm cursor-pointer text-primary hover:text-secondary hover:underline'
                            onClick={() => setDisplayModal(true)}
                        >
                            Forgot your password ?
                        </button>
                    </div>
                </div>
                
                {/* new password input */}
                <div className='w-1/2 min-w-[300px]'>
                    <label htmlFor='newPassword' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
                       New Password
                    </label>   
                    <div className='relative'>             
                        <input 
                            id='newPassword'
                            type={showPassword.newPassword ? "text" : "password"}
                            autoComplete='off'
                            className={`p-1 w-full outline-0 
                                ${ formErrors.newPassword ? 'border-b-2 border-danger text-danger' : 
                                'border-b-1 border-light-txt2 dark:border-dark-txt2 focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt text-light-txt dark:text-dark-txt'}  
                            `} 
                            placeholder='••••••••'
                            value={formData.newPassword}
                            onChange={(e) => {
                                setFormData({...formData, newPassword: e.target.value})
                                if (formErrors.newPassword) setFormErrors({ ...formErrors, newPassword: ""});
                            }}
                        />
                        <button
                            type='button'
                            className='absolute inset-y-0 right-0 flex items-center cursor-pointer'
                            onClick={() => setShowPassword({...showPassword, newPassword: !showPassword.newPassword})}
                        >
                            { showPassword.newPassword ? (
                                <Eye className='size-5 text-light-txt2' />
                            ): (
                                <EyeClosed className='size-5 text-light-txt2' />
                            )
                            }
                        </button>
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className={`text-xs ${formErrors.newPassword ? 'text-danger' : 'text-transparent'}`}>
                            { formErrors.newPassword || "placeholder" }
                        </span>
                    </div>
                </div>
                
                {/* confirm password input */}
                <div className='w-1/2 min-w-[300px]'>
                    <label htmlFor='confirmPassword' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
                       Confirm New Password
                    </label>   
                    <div className='relative'>             
                        <input 
                            id='confirmPassword'
                            type={showPassword.confirmPassword ? "text" : "password"}
                            autoComplete='off'
                            className={`p-1 w-full outline-0 
                                ${ formErrors.confirmPassword ? 'border-b-2 border-danger text-danger' : 
                                'border-b-1 border-light-txt2 dark:border-dark-txt2 focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt text-light-txt dark:text-dark-txt'}  
                            `} 
                            placeholder='••••••••'
                            value={formData.confirmPassword}
                            onChange={(e) => {
                                setFormData({...formData, confirmPassword: e.target.value})
                                if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: ""});
                            }}
                        />
                        <button
                            type='button'
                            className='absolute inset-y-0 right-0 flex items-center cursor-pointer'
                            onClick={() => setShowPassword({...showPassword, confirmPassword: !showPassword.confirmPassword})}
                        >
                            { showPassword.confirmPassword ? (
                                <Eye className='size-5 text-light-txt2' />
                            ): (
                                <EyeClosed className='size-5 text-light-txt2' />
                            )
                            }
                        </button>
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className={`text-xs ${formErrors.confirmPassword ? 'text-danger' : 'text-transparent'}`}>
                            { formErrors.confirmPassword || "placeholder" }
                        </span>
                    </div>
                </div>

                <PrimaryButton 
                    text="Update Password" 
                    className='w-1/2 min-w-[300px] p-2 mt-2' 
                    type='submit'
                    loading={loading}
                />
            </div>
        </form>
        {
            displayModal && <ForgotPasswordModal onClose={() => setDisplayModal(false)} />
        }
    </>
  )
}

export default UpdatePassword