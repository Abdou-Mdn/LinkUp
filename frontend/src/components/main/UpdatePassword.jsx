import React, { useState } from 'react'

import { useAuthStore } from '../../store/auth.store';

import { updatePassword } from '../../lib/api/user.api';

import PrimaryButton from '../PrimaryButton';
import ForgotPasswordModal from '../layout/ForgotPasswordModal';
import TextInput from '../TextInput';

/* 
 * UpdatePassword component
 * Main container for password update option.

 * Integrates with API functions:
 * - `updatePassword`
 */
const UpdatePassword = () => {
    const { setAuthUser } = useAuthStore();
    // management states
    const [loading, setLoading] = useState(false); // laoding state
    // inputs text 
    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: "",
        oldPassword: ""
    });
    // inputs errors
    const [formErrors, setFormErrors] = useState({
        newPassword: "",
        confirmPassword: "",
        oldPassword: ""
    });

    // forgot password modal visibility
    const [displayModal, setDisplayModal] = useState(false)

    // helper function to validate form before submit
    const validateForm = () => {
        let isValid = true;
        let errors = {
            newPassword: "",
            confirmPassword: "",
            oldPassword: ""
        }

        // validate new password (cannot be empty, and must be at least 8 characters)
        if(!formData.newPassword.trim()) {
            errors.newPassword = "New Password is required";
            isValid = false;
        } else if(formData.oldPassword.length < 8) {
            errors.newPassword = "Password must be at least 8 characters";
            isValid = false;
        }

        // validate confirm password (cannot be empty, and should match new password)
        if(!formData.confirmPassword.trim()) {
            errors.confirmPassword = "Confirm Password is required";
            isValid = false;
        } else if (formData.confirmPassword.trim() !== formData.newPassword.trim()) {
            errors.newPassword = "Passwords are not matching";
            errors.confirmPassword = "Passwords are not matching";
            isValid = false;
        }

        // validate current password (cannot be empty, and must be at least 8 characters)
        if(!formData.oldPassword.trim()) {
            errors.oldPassword = "Current Password is required";
            isValid = false;
        } else if(formData.oldPassword.length < 8) {
            errors.newPassword = "Password must be at least 8 characters";
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    }

    // handle update password
    const handleSubmit = async (event) => {
        event.preventDefault();

        const success = validateForm();

        if(success === true) {
            setLoading(true);
            try {
                const res = await updatePassword(formData.oldPassword, formData.newPassword);
                if(res?.user) {
                    setAuthUser(res.user);
                    // clear form inputs 
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
            } catch (error) {
                console.log("error in updating password ", error);
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
                <h2 className='text-xl font-bold font-outfit'>Update Your Password</h2>
                <p className='text-light-txt2 dark:text-dark-txt2'>For security reasons, please enter your current password before setting a new one.</p>
                <p className='text-light-txt2 dark:text-dark-txt2'>Make sure your new password is strong and unique. Avoid reusing old passwords.</p>
            </div>
            <div className='w-full py-3 my-2 flex flex-col gap-3'>
                {/* current password input */}
                <TextInput 
                    label='Current Password'
                    isPassword={true}
                    placeholder='••••••••'
                    value={formData.oldPassword}
                    onChange={(e) => {
                        setFormData({...formData, oldPassword: e.target.value})
                        if (formErrors.oldPassword) setFormErrors({ ...formErrors, oldPassword: ""});
                    }}
                    error={formErrors.oldPassword}
                    openModal={() => setDisplayModal(true)}
                />
                
                {/* new password input */}
                <TextInput
                    label='New Password'
                    isPassword={true}
                    placeholder='••••••••'
                    value={formData.newPassword}
                    onChange={(e) => {
                        setFormData({...formData, newPassword: e.target.value})
                        if (formErrors.newPassword) setFormErrors({ ...formErrors, newPassword: ""});
                    }}
                    error={formErrors.newPassword}
                />

                {/* confirm password input */}
                <TextInput
                    label='Confirm New Password'
                    isPassword={true}
                    placeholder='••••••••'
                    value={formData.confirmPassword}
                    onChange={(e) => {
                        setFormData({...formData, confirmPassword: e.target.value})
                        if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: ""});
                    }}
                    error={formErrors.confirmPassword}
                />
                
                {/* submit button */}
                <PrimaryButton 
                    text="Update Password" 
                    className='lg:w-1/2 min-w-[300px] p-2 mt-2' 
                    type='submit'
                    loading={loading}
                />
            </div>
        </form>
        {/* forgot password modal */}
        {
            displayModal && <ForgotPasswordModal onClose={() => setDisplayModal(false)} />
        }
    </>
  )
}

export default UpdatePassword