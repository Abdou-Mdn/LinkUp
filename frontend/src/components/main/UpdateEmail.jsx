import React, { useState } from 'react'
import { AnimatePresence } from 'motion/react';

import { useAuthStore } from '../../store/auth.store';

import { updateEmail } from '../../lib/api/user.api';

import PrimaryButton from '../PrimaryButton';
import ForgotPasswordModal from '../layout/ForgotPasswordModal';
import TextInput from '../TextInput';

/* 
 * UpdateEmail component
 * Main container for email update option.

 * Integrates with API functions:
 * - `updateEmail`
 */
const UpdateEmail = () => {
    const { authUser, setAuthUser } = useAuthStore();

    // management states
    const [loading, setLoading] = useState(false); // loading state

    // input texts
    const [formData, setFormData] = useState({
        newEmail: "", // new email input
        confirmEmail: "", // confirm new email input
        password: "" // password input
    });
    // input errors
    const [formErrors, setFormErrors] = useState({
        newEmail: "",
        confirmEmail: "",
        password: ""
    });

    // forgot password modal visibility
    const [displayModal, setDisplayModal] = useState(false)

    // hemper function to validate inputs before submit
    const validateForm = () => {
        let isValid = true;
        let errors = {
            newEmail: "",
            confirmEmail: "",
            password: ""
        }

        // validate new email (cannot be empty or equal to current email and must be with correct format)
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

        // validate confirm email (cannot be empty, and should match new email)
        if(!formData.confirmEmail.trim()) {
            errors.confirmEmail = "Confirm Email is required";
            isValid = false;
        } else if (formData.confirmEmail.trim() !== formData.newEmail.trim()) {
            errors.newEmail = "Emails are not matching";
            errors.confirmEmail = "Emails are not matching";
            isValid = false;
        }

        // validate password (cannot be empty, and should be > 8 characters)
        if(!formData.password.trim()) {
            errors.password = "Password is required";
            isValid = false;
        } else if (formData.password.length < 8) {
            errors.password = "Password must be at least 8 characters"
            isValid = false
        }

        setFormErrors(errors);
        return isValid;
    }

    // handle update email
    const handleSubmit = async (event) => {
        event.preventDefault();

        const success = validateForm();

        if(success === true) {
            setLoading(true);
            try {
                const res = await updateEmail(formData.newEmail, formData.password);
                // if email is updated then update authUser state 
                if(res?.user) {
                    setAuthUser(res.user);
                    // clear inputs
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
            } catch (error) {
                console.log("error in updating email ", error);
            } finally {
                setLoading(false);
            }
        };
    }
  
    return (
    <>
        <form onSubmit={handleSubmit} className='size-full flex flex-col p-8 bg-light-100 text-light-txt dark:bg-dark-100 dark:text-dark-txt'>
            {/* title and text */}
            <div>
                <h2 className='text-xl font-bold font-outfit'>Update Your Email Address</h2>
                <p className='text-light-txt2 dark:text-dark-txt2'>Keep your email address up to date to ensure you don't lose access to your account.</p>
            </div>
            {/* inputs */}
            <div className='w-full py-3 my-2 flex flex-col gap-3'>
                {/* current email input mockup */}
                <div className='lg:w-1/2 min-w-[300px]'>
                    <span className='font-outfit text-sm text-light-txt2 dark:text-dark-txt2 pl-1'>
                        Current Email
                    </span>                
                    <div className='p-1 w-full border-b border-light-txt2 dark:border-dark-txt2 text-light-txt2 dark:text-dark-txt2'>
                        <span>{authUser.email}</span>
                    </div>
                    <span className="text-xs min-h-4 block"></span>
                </div>

                {/* new email input */}
                <TextInput
                    label='New Email'
                    isPassword={false}
                    placeholder='you@example.com'
                    value={formData.newEmail}
                    onChange={(e) => {
                        setFormData({...formData, newEmail: e.target.value})
                        if (formErrors.newEmail) setFormErrors({ ...formErrors, newEmail: ""});
                    }}
                    error={formErrors.newEmail}
                />

                {/* confirm email input */}
                <TextInput
                    label='Confirm New Email'
                    isPassword={false}
                    placeholder='you@example.com'
                    value={formData.confirmEmail}
                    onChange={(e) => {
                        setFormData({...formData, confirmEmail: e.target.value})
                        if (formErrors.confirmEmail) setFormErrors({ ...formErrors, confirmEmail: ""});
                    }}
                    error={formErrors.confirmEmail}
                />

                {/* password input */}
                <TextInput
                    label='Password'
                    isPassword={true}
                    placeholder='••••••••'
                    value={formData.password}
                    onChange={(e) => {
                        setFormData({...formData, password: e.target.value})
                        if (formErrors.password) setFormErrors({ ...formErrors, password: ""});
                    }}
                    error={formErrors.password}
                    openModal={() => setDisplayModal(true)}
                />

                {/* submit button */}            
                <PrimaryButton 
                    text="Update Email" 
                    className='lg:w-1/2 min-w-[300px] p-2 mt-2' 
                    type='submit'
                    loading={loading}
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

export default UpdateEmail