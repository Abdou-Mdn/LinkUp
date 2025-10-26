import React, { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react';

import { useAuthStore } from '../../store/auth.store';

import { resetPassword, sendCode, verifyCode, verifyEmail } from '../../lib/api/auth.api';

import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton'
import TextInput from '../TextInput';
import AnimatedModal from '../AnimatedModal';


/* 
 * OtpInput Component
 * 
 * A custom OTP (One-Time Password) input field manager.
 * - Accepts only digits
 * - Moves focus automatically
 * - Supports paste handling

 * params:
 *  - otp: current otp state (array of digits as strings)
 *  - setOtp: state  setter for otp
 *  - length: number of otp digits
 *  - onComplete: callback function triggered one otp is full
 *  - darkTheme: boolean enables dark theme
*/
const OtpInput = ({otp, setOtp, length, onComplete, darkTheme }) => {
  const inputsRef = useRef([]);

  // handle value changes in each OTP input 
  const handleChange = (value, index) => {
    if (/[^0-9]/.test(value)) return; // accept only digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // move focus forward if current is filled
    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // trigger onComplete when all digits are filled
    if (newOtp.every((digit) => digit !== "")) {
      onComplete(newOtp.join(""));
    }
  };

  // handle backspace press
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // handle paste event (example: full OTP pasted at once)
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, length);
    if (!/^[0-9]+$/.test(pasted)) return;

    const newOtp = pasted.split("");
    setOtp(newOtp);

    // focus last input
    inputsRef.current[newOtp.length - 1]?.focus();

    if (newOtp.length === length) {
      onComplete(newOtp.join(""));
    }
  };

  return (
    <div className='lg:w-1/2 min-w-[300px]'>
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {otp.map((digit, index) => (
            <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                maxLength={1}
                placeholder='•'
                autoComplete='off'
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`size-12 text-center text-xl border-b focus:border-b-2 outline-0 text-light-txt border-light-txt2 focus:border-light-txt ${darkTheme && 'dark:text-dark-txt dark:border-dark-txt2 dark:focus:border-dark-txt'}`}
            />
        ))}
        </div>
    </div>
  );
}


/* 
 * ForgotPasswordModal Component
 
 * A modal dialog that handles the **Forgot Password workflow**:
  
 * 1. **Email step** → User submits email, system verifies & sends OTP.
 * 2. **OTP step** → User enters 6-digit OTP, system verifies & issues reset token.
 * 3. **Password step** → User sets a new password (with validation).
  
 * Integrates with API functions:
 * - `verifyEmail`, `sendCode`, `verifyCode`, `resetPassword`
 
 * params: 
 * - onClose: callback function to close the modal
 * - darkTheme: boolean that enables dark mode (no dark mode in login page)
*/
const ForgotPasswordModal = ({onClose, darkTheme = true}) => {
    const { logout } = useAuthStore();

    // UI states
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState("email");
    
    // email section states
    const [email, setEmail] = useState("");
    const [emailErr, setEmailErr] = useState("");
    
    // OTP section states
    const length = 6;
    const [otp, setOtp] = useState(new Array(length).fill(""));
    const [token, setToken] = useState(null);

    // password section states
    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [formErrors, setFormErrors] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    // states for framer motion animation
    const [direction, setDirection] = useState(0)
    const sectionVariants = {
        initial: (direction) => ({
            x: direction > 0 ? 500 : direction < 0 ? -500 : 0,
            opacity: direction === 0 ? 1 : 0,
        }),
        animate: {
            x: 0,
            opacity: 1,
        },
        exit: (direction) => ({
            x: direction > 0 ? -500 : direction < 0 ? 500 : 0,
            opacity: 0
        })
    }

    // ** step 1: verify email & send OTP
    const sendOTPCode = async (event) => {
        event.preventDefault()
        // validate email first
        if(!email.trim()) {
            setEmailErr("Email is required")
            return;
        } else if(!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            setEmailErr("Invalid email format")
            return;
        }

        setLoading(true);
        try {
            const res = await verifyEmail(email);

            if(res?.userID) {
                // if email is registered then send OTP to the email
                const result = await sendCode(email);

                if(result?.emailID) {
                    // if OTP is sent successfully go to next section
                    setDirection(1);
                    setActiveSection("otp");
                }
            } else if (res === "Email not registered") {
                // if email is not registered update email error
                setEmailErr(res);
            }
        } catch (error) {
            console.log("error in verify email and send code ", error);
        } finally {
            setLoading(false)
        }
    }

    // ** step 2: verify OTP code
    const verifyOTPCode = async (otp) => {
        if(loading) return;
        setLoading(true);
        try {
            const res = await verifyCode(email, otp);

            if(res?.resetToken) {
                // if code is correct save resetToken and move to next section
                setToken(res.resetToken);
                setDirection(1);
                setActiveSection("password")
            }

        } catch (error) {
            console.log("error in verify code ", error);
        } finally {
            setLoading(false)
        }
    }

    // ** step 3: set new password 
    const setNewPassword = async (event) => {
        event.preventDefault()
        if(loading) return;
        let isValid = true;
        let errors = {
            newPassword: "",
            confirmPassword: "",
        }

        // validate new password
        if(!formData.newPassword.trim()) {
            errors.newPassword = "New password is required";
            isValid = false;
        } else if(formData.newPassword.length < 8) {
            errors.newPassword = "Password must be at least 8 characters";
            isValid = false;
        }

        // validate confirm password
        if(!formData.confirmPassword.trim()) {
            errors.confirmPassword = "Confirm password is required";
            isValid = false;
        } else if (formData.newPassword !== formData.confirmPassword) {
            errors.newPassword = "Passwords do not match";
            errors.confirmPassword = "Passwords do not match";
            isValid = false;
        }

        if(!isValid) {
            setFormErrors(errors);
            return;
        }

        setLoading(true);
        try {
            const res = await resetPassword(token, formData.newPassword);

            if(res?.reset) {
                // if password is updated successfully then close modal and logout (if logged in) 
                onClose();
                logout();
            }

        } catch (error) {
            console.log("error in reset password ", error);
        } finally {
            setLoading(false)
        }
    }

  return (
    <AnimatedModal
        onClose={onClose}
        darkTheme={darkTheme}
        className={`h-fit w-[95%] lg:w-[50%] min-w-[350px] rounded-2xl flex items-center justify-center p-8 bg-light-100 text-light-txt ${darkTheme && 'dark:bg-dark-100 dark:text-dark-txt'}`}
    >
        <div className='size-full overflow-hidden'>
        <AnimatePresence initial={false} custom={direction} mode='wait'>
            {/* ** step 1: email input */}
            {
                activeSection == "email" && (
                    <motion.form 
                        key="email"
                        onSubmit={sendOTPCode}
                        className='size-full flex flex-col justify-center items-center gap-3'
                        custom={direction}
                        variants={sectionVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ 
                            x: { type: 'tween', ease: 'linear', duration: 0.2 },
                            opacity: { duration: 0.2, ease: 'linear' }
                        }}
                    >
                        {/* title and text */}
                        <div className='text-center px-8 flex flex-col gap-3'>
                            <h2 className='text-lg lg:text-xl font-bold font-outfit'>Forgot Your Password ?</h2>
                            <p className={`text-sm lg:text-normal text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'}`}>Please enter your email for the verification process. We will send 6 digits OTP code to your email</p>
                        </div>
                        {/* input */}
                        <TextInput
                            label='Your Email'
                            placeholder='you@example.com'
                            isPassword={false}
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                if (emailErr) setEmailErr("");
                            }}
                            error={emailErr}
                            darkTheme={darkTheme}
                        />
                        {/* buttons */}
                        <div className='flex items-center justify-center gap-4 lg:gap-8'>
                            {/* cancel button (closes the modal) */}
                            <SecondaryButton 
                                type='button'
                                text='Cancel'  
                                className='py-2 px-10 text-sm lg:text-normal' 
                                onClick={onClose}
                                disabled={loading}
                            />
                            {/* submit button */}
                            <PrimaryButton 
                                type='submit'
                                text='Send Code' 
                                className={`text-sm lg:text-normal py-2 ${loading ? 'px-12' : 'px-8'}`} 
                                onClick={sendOTPCode}
                                loading={loading}
                            />
                        </div>
                    </motion.form>
                )
            }
            {/* ** step 2: OTP input */}
            {
                activeSection == "otp" && (
                    <motion.div 
                        key="otp"
                        className='size-full flex flex-col justify-center items-center gap-3'
                        custom={direction}
                        variants={sectionVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ 
                            x: { type: 'tween', ease: 'linear', duration: 0.2 },
                            opacity: { duration: 0.2, ease: 'linear' }
                        }}
                    >
                        {/* title and text */}
                        <div className='text-center px-8 flex flex-col gap-3'>
                            <h2 className='text-lg lg:text-xl font-bold font-outfit'>OTP Code Verification</h2>
                            <p className={`text-sm lg:text-normal text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'}`}>Please enter the 6 digits otp code that you received on your email</p>
                        </div>
                        {/* input */}
                        <div className='lg:w-[60%] min-w-[300px] p-3 flex flex-col items-center gap-4'>
                            <OtpInput
                                otp={otp}
                                setOtp={setOtp}
                                length={length} 
                                onComplete={verifyOTPCode} 
                                darkTheme={darkTheme} 
                            />
                            {/* resend OTP text */}
                            <div className='flex items-center gap-2'>
                                <span className='text-sm'>Didn't receive any code?</span>
                                <button  
                                    onClick={sendOTPCode}
                                    type='button' 
                                    className='text-sm cursor-pointer text-primary hover:text-secondary hover:underline'
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                        {/* buttons */}
                        <div className='flex items-center justify-center gap-8'>
                            {/* cancel button (closes the modal) */}
                            <SecondaryButton
                                type='button' 
                                text='Cancel' 
                                className='py-2 px-10 text-sm lg:text-normal' 
                                onClick={onClose}
                                disabled={loading}
                            />
                            {/* submit button */}
                            <PrimaryButton 
                                type='submit'
                                text='Continue' 
                                className={`text-sm lg:text-normal py-2 ${loading ? 'px-14' : 'px-10'}`} 
                                onClick={() => verifyOTPCode(otp.join(""))}
                                loading={loading}
                                disabled={!otp.every((digit) => digit !== "")}
                            />
                        </div>
                    </motion.div>
                )
            }
            {/* ** step 3: password inputs */}
            {
                activeSection == "password" && (
                    <motion.form 
                        key="password"
                        onSubmit={setNewPassword}
                        className='size-full flex flex-col justify-center items-center gap-2'
                        custom={direction}
                        variants={sectionVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ 
                            x: { type: 'tween', ease: 'linear', duration: 0.2 },
                            opacity: { duration: 0.2, ease: 'linear' }
                        }}
                    >
                        {/* title and text */}
                        <div className='text-center px-8 flex flex-col gap-3'>
                            <h2 className='text-lg lg:text-xl font-bold font-outfit'>Update Your Password</h2>
                            <p className={`text-sm lg:text-normal text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'}`}>Please enter a new password. Make sure your new password is strong and unique. Avoid reusing old passwords</p>
                        </div>

                        {/* new password input */}
                        <TextInput
                            label='New Password'
                            placeholder='••••••••'
                            isPassword={true}
                            value={formData.newPassword}
                            onChange={(e) => {
                                setFormData({...formData, newPassword: e.target.value})
                                if (formErrors.newPassword) setFormErrors({ ...formErrors, newPassword: ""});
                            }}
                            error={formErrors.newPassword}
                            darkTheme={darkTheme}
                        />
                        
                        {/* confirm password input */}
                        <TextInput
                            label='Confirm New Password'
                            placeholder='••••••••'
                            isPassword={true}
                            value={formData.confirmPassword}
                            onChange={(e) => {
                                setFormData({...formData, confirmPassword: e.target.value})
                                if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: ""});
                            }}
                            error={formErrors.confirmPassword}
                            darkTheme={darkTheme}
                        />
                        {/* buttons */}
                        <div className='flex items-center justify-center gap-8'>
                            {/* cancel button (closes the modal) */}
                            <SecondaryButton 
                                type='button'
                                text='Cancel' 
                                className='py-2 px-10 text-sm lg:text-normal' 
                                onClick={onClose}
                                disabled={loading}
                            />
                            {/* submit button */}
                            <PrimaryButton 
                                type='submit'
                                text='Continue' 
                                className={`text-sm lg:text-normal py-2 ${loading ? 'px-14' : 'px-10'}`} 
                                onClick={setNewPassword}
                                loading={loading}
                            />
                        </div>
                    </motion.form>
                )
            }
        </AnimatePresence>
        </div>
    </AnimatedModal>
  ) 
}

export default ForgotPasswordModal


const ikhti = () => (
    <div 
        onClick={onClose} 
        className={`fixed inset-0 z-50 flex items-center justify-center bg-[#00000066] ${darkTheme && 'dark:bg-[#ffffff33]'}`}
    >
        <div 
            onClick={(e) => e.stopPropagation()}
            className={`h-fit w-[95%] lg:w-[50%] min-w-[350px] rounded-2xl flex items-center justify-center p-8 bg-light-100 text-light-txt ${darkTheme && 'dark:bg-dark-100 dark:text-dark-txt'}`}
        >
            {/* ** step 1: email input */}
            {
                activeSection == "email" && (
                    <form 
                        onSubmit={sendOTPCode}
                        className='size-full flex flex-col justify-center items-center gap-3'
                    >
                        {/* title and text */}
                        <div className='text-center px-8 flex flex-col gap-3'>
                            <h2 className='text-lg lg:text-xl font-bold font-outfit'>Forgot Your Password ?</h2>
                            <p className={`text-sm lg:text-normal text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'}`}>Please enter your email for the verification process. We will send 6 digits OTP code to your email</p>
                        </div>
                        {/* input */}
                        <TextInput
                            label='Your Email'
                            placeholder='you@example.com'
                            isPassword={false}
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                if (emailErr) setEmailErr("");
                            }}
                            error={emailErr}
                        />
                        {/* buttons */}
                        <div className='flex items-center justify-center gap-4 lg:gap-8'>
                            {/* cancel button (closes the modal) */}
                            <SecondaryButton 
                                type='button'
                                text='Cancel'  
                                className='py-2 px-10 text-sm lg:text-normal' 
                                onClick={onClose}
                                disabled={loading}
                            />
                            {/* submit button */}
                            <PrimaryButton 
                                type='submit'
                                text='Send Code' 
                                className={`text-sm lg:text-normal py-2 ${loading ? 'px-12' : 'px-8'}`} 
                                onClick={sendOTPCode}
                                loading={loading}
                            />
                        </div>
                    </form>
                )
            }
            {/* ** step 2: OTP input */}
            {
                activeSection == "otp" && (
                    <div className='size-full flex flex-col justify-center items-center gap-3'>
                        {/* title and text */}
                        <div className='text-center px-8 flex flex-col gap-3'>
                            <h2 className='text-lg lg:text-xl font-bold font-outfit'>OTP Code Verification</h2>
                            <p className={`text-sm lg:text-normal text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'}`}>Please enter the 6 digits otp code that you received on your email</p>
                        </div>
                        {/* input */}
                        <div className='lg:w-[60%] min-w-[300px] p-3 flex flex-col items-center gap-4'>
                            <OtpInput
                                otp={otp}
                                setOtp={setOtp}
                                length={length} 
                                onComplete={verifyOTPCode} 
                                darkTheme={darkTheme} 
                            />
                            {/* resend OTP text */}
                            <div className='flex items-center gap-2'>
                                <span className='text-sm'>Didn't receive any code?</span>
                                <button  
                                    onClick={sendOTPCode}
                                    type='button' 
                                    className='text-sm cursor-pointer text-primary hover:text-secondary hover:underline'
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                        {/* buttons */}
                        <div className='flex items-center justify-center gap-8'>
                            {/* cancel button (closes the modal) */}
                            <SecondaryButton
                                type='button' 
                                text='Cancel' 
                                className='py-2 px-10 text-sm lg:text-normal' 
                                onClick={onClose}
                                disabled={loading}
                            />
                            {/* submit button */}
                            <PrimaryButton 
                                type='submit'
                                text='Continue' 
                                className={`text-sm lg:text-normal py-2 ${loading ? 'px-14' : 'px-10'}`} 
                                onClick={() => verifyOTPCode(otp.join(""))}
                                loading={loading}
                                disabled={!otp.every((digit) => digit !== "")}
                            />
                        </div>
                    </div>
                )
            }
            {/* ** step 3: password inputs */}
            {
                activeSection == "password" && (
                    <form 
                        onSubmit={setNewPassword}
                        className='size-full flex flex-col justify-center items-center gap-2'
                    >
                        {/* title and text */}
                        <div className='text-center px-8 flex flex-col gap-3'>
                            <h2 className='text-lg lg:text-xl font-bold font-outfit'>Update Your Password</h2>
                            <p className={`text-sm lg:text-normal text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'}`}>Please enter a new password. Make sure your new password is strong and unique. Avoid reusing old passwords</p>
                        </div>

                        {/* new password input */}
                        <TextInput
                            label='New Password'
                            placeholder='••••••••'
                            isPassword={true}
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
                            placeholder='••••••••'
                            isPassword={true}
                            value={formData.confirmPassword}
                            onChange={(e) => {
                                setFormData({...formData, confirmPassword: e.target.value})
                                if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: ""});
                            }}
                            error={formErrors.confirmPassword}
                        />
                        {/* buttons */}
                        <div className='flex items-center justify-center gap-8'>
                            {/* cancel button (closes the modal) */}
                            <SecondaryButton 
                                type='button'
                                text='Cancel' 
                                className='py-2 px-10 text-sm lg:text-normal' 
                                onClick={onClose}
                                disabled={loading}
                            />
                            {/* submit button */}
                            <PrimaryButton 
                                type='submit'
                                text='Continue' 
                                className={`text-sm lg:text-normal py-2 ${loading ? 'px-14' : 'px-10'}`} 
                                onClick={setNewPassword}
                                loading={loading}
                            />
                        </div>
                    </form>
                )
            }
        </div>
    </div>
  )