import React, { useState } from 'react'
import { useAuthStore } from '../../store/auth.store';
import { Eye, EyeClosed } from 'lucide-react';
import PrimaryButton from '../PrimaryButton';
import ForgotPasswordModal from '../layout/ForgotPasswordModal';
import { updateEmail } from '../../lib/api/user.api';

const UpdateEmail = () => {
    const { authUser, setAuthUser } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        newEmail: "",
        confirmEmail: "",
        password: ""
    });
    const [formErrors, setFormErrors] = useState({
        newEmail: "",
        confirmEmail: "",
        password: ""
    });

    const [displayModal, setDisplayModal] = useState(false)

    const validateForm = () => {
        let isValid = true;
        let errors = {
            newEmail: "",
            confirmEmail: "",
            password: ""
        }

        if(!formData.newEmail.trim()) {
            errors.newEmail = "New Email is required";
            isValid = false;
        } else if(!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.newEmail)) {
            errors.newEmail = "Invalid email format";
            isValid = false;
        } else if (formData.newEmail === authUser.email) {
            errors.newEmail = "Can't provide your current email";
            isValid = false;
        }

        if(!formData.confirmEmail.trim()) {
            errors.confirmEmail = "Confirm Email is required";
            isValid = false;
        } else if (formData.confirmEmail.trim() !== formData.newEmail.trim()) {
            errors.newEmail = "Emails are not matching";
            errors.confirmEmail = "Emails are not matching";
            isValid = false;
        }

        if(!formData.password.trim()) {
            errors.password = "Password is required";
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
                const res = await updateEmail(formData.newEmail, formData.password);
                if(res?.user) {
                    setAuthUser(res.user);
                }
            } catch (error) {
                console.log("error in updating email ", error);
            } finally {
                setLoading(false);
                setFormData({
                    newEmail: "",
                    confirmEmail: "",
                    password: ""
                });
                setFormErrors({
                    newEmail: "",
                    confirmEmail: "",
                    password: ""
                })
            }
        };
    }
  
    return (
    <>
        <form onSubmit={handleSubmit} className='size-full flex flex-col p-8 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'>
            <div className=''>
                <h2 className='text-xl font-bold font-outfit'>Update Your Email Address</h2>
                <p className='text-light-txt2 dark:text-dark-txt2'>Keep your email address up to date to ensure you don't lose access to your account.</p>
            </div>
            <div className='w-full py-3 my-2 flex flex-col gap-3'>
                {/* current email input */}
                <div className='w-1/2 min-w-[300px]'>
                    <span className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
                        Current Email
                    </span>                
                    <div className='p-1 w-full border-b-1 border-light-txt2 dark:border-dark-txt2 text-light-txt2 dark:text-dark-txt2'>
                        <span>{authUser.email}</span>
                    </div>
                    <span className='text-xs text-transparent'>
                        placeholder
                    </span>
                </div>
                {/* new email input */}
                <div className='w-1/2 min-w-[300px]'>
                    <label htmlFor='newEmail' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
                        New Email
                    </label>                
                    <input 
                        id='newEmail'
                        type="text"
                        autoComplete='off'
                        className={`p-1 w-full outline-0 
                            ${ formErrors.newEmail ? 'border-b-2 border-danger text-danger' : 
                            'border-b-1 border-light-txt2 dark:border-dark-txt2 focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt text-light-txt dark:text-dark-txt'}  
                        `} 
                        placeholder='you@example.com'
                        value={formData.newEmail}
                        onChange={(e) => {
                            setFormData({...formData, newEmail: e.target.value})
                            if (formErrors.newEmail) setFormErrors({ ...formErrors, newEmail: ""});
                        }}
                    />
                    <span className={`text-xs ${formErrors.newEmail ? 'text-danger' : 'text-transparent'}`}>
                        { formErrors.newEmail || "placeholder" }
                    </span>
                </div>
                {/* confirm email input */}
                <div className='w-1/2 min-w-[300px]'>
                    <label htmlFor='confirmEmail' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
                        Confirm New Email
                    </label>                
                    <input 
                        id='confirmEmail'
                        type="text"
                        autoComplete='off'
                        className={`p-1 w-full outline-0 
                            ${ formErrors.confirmEmail ? 'border-b-2 border-danger text-danger' : 
                            'border-b-1 border-light-txt2 dark:border-dark-txt2 focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt text-light-txt dark:text-dark-txt'}  
                        `} 
                        placeholder='you@example.com'
                        value={formData.confirmEmail}
                        onChange={(e) => {
                            setFormData({...formData, confirmEmail: e.target.value})
                            if (formErrors.confirmEmail) setFormErrors({ ...formErrors, confirmEmail: ""});
                        }}
                    />
                    <span className={`text-xs ${formErrors.confirmEmail ? 'text-danger' : 'text-transparent'}`}>
                        { formErrors.confirmEmail || "placeholder" }
                    </span>
                </div>
                {/* password input */}
                <div className='w-1/2 min-w-[300px]'>
                    <label htmlFor='password' className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
                        Password
                    </label>   
                    <div className='relative'>             
                        <input 
                            id='password'
                            type={showPassword ? "text" : "password"}
                            autoComplete='off'
                            className={`p-1 w-full outline-0 
                                ${ formErrors.password ? 'border-b-2 border-danger text-danger' : 
                                'border-b-1 border-light-txt2 dark:border-dark-txt2 focus:border-b-2 focus:border-light-txt dark:focus:border-dark-txt text-light-txt dark:text-dark-txt'}  
                            `} 
                            placeholder='••••••••'
                            value={formData.password}
                            onChange={(e) => {
                                setFormData({...formData, password: e.target.value})
                                if (formErrors.password) setFormErrors({ ...formErrors, password: ""});
                            }}
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
                    <div className='flex items-center justify-between'>
                        <span className={`text-xs ${formErrors.password ? 'text-danger' : 'text-transparent'}`}>
                            { formErrors.password || "placeholder" }
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

                <PrimaryButton 
                    text="Update Email" 
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

export default UpdateEmail