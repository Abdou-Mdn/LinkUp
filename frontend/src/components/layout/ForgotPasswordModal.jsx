import React, { useEffect, useRef, useState } from 'react'
import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton'
import TertiaryButton from '../TertiaryButton';
import ProfilePreviewSkeleton from '../skeleton/ProfilePreviewSkeleton';
import { Check, Eye, EyeClosed, Ghost } from 'lucide-react';
import { getFriends } from '../../lib/api/user.api';
import ProfilePreview from '../previews/ProfilePreview';
import { createGroup } from '../../lib/api/group.api';
import { resetPassword, sendCode, verifyCode, verifyEmail } from '../../lib/api/auth.api';
import { useAuthStore } from '../../store/auth.store';

const OtpInput = ({otp, setOtp, length, onComplete, darkTheme }) => {
  const inputsRef = useRef([]);

  const handleChange = (value, index) => {
    if (/[^0-9]/.test(value)) return; // only digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // move focus forward if filled
    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // trigger when all filled
    if (newOtp.every((digit) => digit !== "")) {
      onComplete(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

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
    <div className='w-1/2 min-w-[300px]'>
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {otp.map((digit, index) => (
            <input
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            type="text"
            maxLength={1}
            placeholder='•'
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



const ForgotPasswordModal = ({onClose, darkTheme = true}) => {
    const { logout } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState("email");
    
    const [email, setEmail] = useState("");
    const [emailErr, setEmailErr] = useState("");
    
    const length = 6;
    const [otp, setOtp] = useState(new Array(length).fill(""));
    const [token, setToken] = useState(null);

    const [showPassword, setShowPassword] = useState({
        newPassword: false,
        confirmPassword: false,
    });
    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [formErrors, setFormErrors] = useState({
        newPassword: "",
        confirmPassword: "",
    });


    const sendOTPCode = async () => {
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
                const result = await sendCode(email);

                if(result?.emailID) {
                    setActiveSection("otp");
                }
            } else if (res === "Email not registered") {
                setEmailErr(res);
            }
        } catch (error) {
            console.log("error in verify email and send code ", error);
        } finally {
            setLoading(false)
        }
    }

    const verifyOTPCode = async (otp) => {
        if(loading) return;
        setLoading(true);
        try {
            const res = await verifyCode(email, otp);

            if(res?.resetToken) {
                setToken(res.resetToken);
                setActiveSection("password")
            }

        } catch (error) {
            console.log("error in verify code ", error);
        } finally {
            setLoading(false)
        }
    }

    const setNewPassword = async () => {
        if(loading) return;
        let isValid = true;
        let errors = {
            newPassword: "",
            confirmPassword: "",
        }

        if(!formData.newPassword.trim()) {
            errors.newPassword = "New password is required";
            isValid = false;
        } else if(formData.newPassword.length < 8) {
            errors.newPassword = "Password must be at least 8 characters";
            isValid = false;
        }

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
    <div onClick={onClose} 
        className={`bg-[#00000066] ${darkTheme && 'dark:bg-[#ffffff33]'} fixed inset-0 z-50 flex items-center justify-center`}
    >
        <div 
            onClick={(e) => e.stopPropagation()}
            className={`${activeSection === "password" ? 'h-[70%]' : 'h-[60%]'} w-[50%] min-w-[350px] rounded-2xl flex items-center justify-center p-8 bg-light-100 text-light-txt ${darkTheme && 'dark:bg-dark-100 dark:text-dark-txt'}`}
        >
            {
                activeSection == "email" && (
                    <div className='size-full flex flex-col justify-center items-center gap-3'>
                        <div className='text-center px-8 flex flex-col gap-3'>
                            <h2 className='text-xl font-bold font-outfit'>Forgot Your Password ?</h2>
                            <p className={`text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'}`}>Please enter your email for the verification process. We will send 6 digits OTP code to your email</p>
                        </div>
                        {/* input */}
                        <div className='w-[60%] min-w-[300px]'>
                            <label htmlFor='email' className={`font-outfit text-sm text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'} pl-1`}>
                                Your Email
                            </label>                
                            <input 
                                id='email'
                                type="text"
                                autoComplete='off'
                                className={`p-1 w-full outline-0 
                                    ${ emailErr ? 'border-b-2 border-danger text-danger' : 
                                    `border-b-1 border-light-txt2 focus:border-b-2 focus:border-light-txt text-light-txt ${darkTheme && 'dark:border-dark-txt2 dark:focus:border-dark-txt dark:text-dark-txt'}`}  
                                `} 
                                placeholder='you@example.com'
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    if (emailErr) setEmailErr("");
                                }}
                            />
                            <span className={`text-xs ${emailErr ? 'text-danger' : 'text-transparent'}`}>
                                { emailErr || "placeholder" }
                            </span>
                        </div>
                        <div className='flex items-center justify-center gap-8'>
                            <SecondaryButton 
                                text='Cancel'  
                                className='py-2 px-10' 
                                onClick={onClose}
                                disabled={loading}
                            />
                            <PrimaryButton 
                                text='Send Code' 
                                className='py-2 px-8' 
                                onClick={sendOTPCode}
                                loading={loading}
                            />
                        </div>
                    </div>
                )
            }
            {
                activeSection == "otp" && (
                    <div className='size-full flex flex-col justify-center items-center gap-3'>
                        <div className='text-center px-8 flex flex-col gap-3'>
                            <h2 className='text-xl font-bold font-outfit'>OTP Code Verification</h2>
                            <p className={`text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'}`}>Please enter the 6 digits otp code that you received on your email</p>
                        </div>
                        {/* input */}
                        <div className='w-[60%] min-w-[300px] p-3 flex flex-col items-center gap-4'>
                            <OtpInput
                                otp={otp}
                                setOtp={setOtp}
                                length={length} 
                                onComplete={verifyOTPCode} 
                                darkTheme={darkTheme} 
                            />
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
                        <div className='flex items-center justify-center gap-8'>
                            <SecondaryButton 
                                text='Cancel' 
                                className='py-2 px-10' 
                                onClick={onClose}
                                disabled={loading}
                            />
                            <PrimaryButton 
                                text='Continue' 
                                className='py-2 px-10' 
                                onClick={verifyOTPCode}
                                loading={loading}
                                disabled={!otp.every((digit) => digit !== "")}
                            />
                        </div>
                    </div>
                )
            }
            {
                activeSection == "password" && (
                    <div className='size-full flex flex-col justify-center items-center gap-2'>
                        <div className='text-center px-8 flex flex-col gap-3'>
                            <h2 className='text-xl font-bold font-outfit'>Update Your Password</h2>
                            <p className={`text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'}`}>Please enter a new password. Make sure your new password is strong and unique. Avoid reusing old passwords</p>
                        </div>
                        {/* new password input */}
                        <div className='w-[60%] min-w-[300px]'>
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
                                        `border-b-1 border-light-txt2 focus:border-b-2 focus:border-light-txt text-light-txt ${darkTheme && 'dark:border-dark-txt2 dark:focus:border-dark-txt dark:text-dark-txt'}`}  
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
                                        <Eye className={`size-5 text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'}`} />
                                    ): (
                                        <EyeClosed className={`size-5 text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'}`} />
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
                        <div className='w-[60%] min-w-[300px]'>
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
                                        `border-b-1 border-light-txt2 focus:border-b-2 focus:border-light-txt text-light-txt ${darkTheme && 'dark:border-dark-txt2 dark:focus:border-dark-txt dark:text-dark-txt'}`}  
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
                                        <Eye className={`size-5 text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'}`} />
                                    ): (
                                        <EyeClosed className={`size-5 text-light-txt2 ${darkTheme && 'dark:text-dark-txt2'}`} />
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
                        {/* input */}
                        <div className='w-[60%] min-w-[300px]'>
                            
                        </div>
                        <div className='flex items-center justify-center gap-8'>
                            <SecondaryButton 
                                text='Cancel' 
                                className='py-2 px-10' 
                                onClick={onClose}
                                disabled={loading}
                            />
                            <PrimaryButton 
                                text='Continue' 
                                className='py-2 px-10' 
                                onClick={setNewPassword}
                                loading={loading}
                            />
                        </div>
                    </div>
                )
            }
        </div>
    </div>
  )
}

export default ForgotPasswordModal