import React, { useState} from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';

import { useAuthStore } from '../store/auth.store';

import PrimaryButton from '../components/PrimaryButton';
import ForgotPasswordModal from '../components/layout/ForgotPasswordModal';
import TextInput from '../components/TextInput';

/* 
 * Login Page
 * used to sign in to an existing account, needs email and password to log in

 * displays a login form and an additional infos on the side
*/
function LogInPage() {
  const { login, isLoggingIn } = useAuthStore();

  // management states
  const [displayModal, setDisplayModal] = useState(false); // forgot password modal visibility
  // form inputs texts
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  // form errors states
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: ""
  });

  // validate form before submitting
  const validateForm = () => {
    let isValid = true;
    let errors = {
      email: "",
      password: ""
    }
    // validate email (cannot be empty, and should be of correct format)
    if(!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if(!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      errors.email = "Invalid email format";
      isValid = false;
    }

    // validate password (cannot be empty, or under 8 characters)
    if(!formData.password.trim()) {
      errors.password = "Password is required";
      isValid = false;
    } else if(formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  }

  // handle login
  const handleSubmit = (event) => {
    event.preventDefault();

    const success = validateForm();

    if(success === true) login(formData);
  }

  return (
    <div className='min-h-screen flex flex-col md:flex-row'>
      {/* left side ** FORM ** */}
      <div className='bg-light-200 flex flex-1 flex-col justify-center items-center p-6 gap-6'>
        {/* logo */}
        <div className='flex flex-row justify-center items-center gap-2'>
          <img src='/assets/logo.svg' className='size-8' />
          <h1 className='font-outfit text-2xl font-bold text-light-txt'>LinkUp</h1>
        </div>
        
        {/* text */}
        <div>
          <h2 className='font-semibold text-center text-light-txt'>Welcome Back</h2>
          <span className='text-sm text-center text-light-txt2'>Sign in to your account</span>
        </div>
        
        {/* form */}
        <form onSubmit={handleSubmit} className='w-[75%] max-w-[370px] flex flex-col items-center justify-center gap-4'>
          {/* email input */}
          <TextInput
            label='Email'
            placeholder='you@example.com'
            isPassword={false}
            value={formData.email}
            onChange={(e) => {
              setFormData({...formData, email: e.target.value})
              if (formErrors.email) setFormErrors({ ...formErrors, email: ""});
            }}
            error={formErrors.email}
            darkTheme={false}
            fullWidth={true}
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
            darkTheme={false}
            fullWidth={true}
          />
          
          {/* submit button (login) */}
          <PrimaryButton 
            type="submit"
            text="Login"
            className='w-full p-3'
            loading={isLoggingIn}
          />
        </form>

        {/* link to signup page*/}
          <div className='text-center'>
              <p className='text-light-txt2'>
                Don&apos;t have an account? {" "}
                <Link to='/signup' className='text-primary hover:text-secondary hover:underline' >
                  Sign Up
                </Link>
              </p>
          </div>
      </div>

      {/* right side ** IMAGE ** */}
      <div className='bg-light-100 hidden md:flex flex-1 flex-col justify-center items-center p-6 gap-1'>
        {/* sub title */}
        <h2 className='text-xl font-semibold text-center text-light-txt'>
          Your Conversations, All in One Place
        </h2>

        {/* image */}
        <img src="/assets/Chatting-friend.gif" className='w-[70%]' />
        
        {/* text */}
        <span className='text-center text-light-txt2'>
          Sign in to continue your conversations and catch up with your messages.
        </span>
      </div>
      {/* forgot password modal */}
      <AnimatePresence>
      {
        displayModal && <ForgotPasswordModal onClose={() => setDisplayModal(false)} darkTheme={false} />
      }
      </AnimatePresence>
    </div>
  )
}

export default LogInPage