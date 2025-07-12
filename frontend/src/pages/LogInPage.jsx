import React, { useState} from 'react';
import { Eye, EyeClosed } from 'lucide-react';
import { Link } from 'react-router-dom';

import PrimaryButton from '../components/PrimaryButton';
import { useAuthStore } from '../store/auth.store';

function LogInPage() {
  const { login, isLoggingIn } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: ""
  });

  const validateForm = () => {
    let isValid = true;
    let errors = {
      email: "",
      password: ""
    }
    if(!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if(!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      errors.email = "Invalid email format";
      isValid = false;
    }

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

  const handleSubmit = (event) => {
    event.preventDefault();

    const success = validateForm();

    if(success === true) login(formData);
  }

  const handleGoogleLogin = () => {}

  return (
    <div className='min-h-screen flex flex-col md:flex-row'>
      {/* left side ** FORM ** */}
      <div className='bg-light-200 flex flex-1 flex-col justify-center items-center p-6 gap-6'>
        {/* logo */}
        <div className='flex flex-row justify-center items-center gap-2'>
          <img src='/assets/logo.svg' className='size-8' />
          <h1 className='font-outfit text-2xl font-bold text-light-txt'>LinkUp</h1>
        </div>
        <div>
          <h2 className='font-semibold text-center text-light-txt'>Welcome Back</h2>
          <span className='text-sm text-center text-light-txt2'>Sign in to your account</span>
        </div>

        {/* google login button */}
        <button
          onClick={handleGoogleLogin}
          className='w-[75%] max-w-[370px] flex flex-row gap-4 items-center justify-center bg-light-100 text-light-txt p-2 rounded-4xl cursor-pointer border-2 border-transparent hover:border-secondary'
        >
          <img src='/assets/google-logo.svg' className='size-5' />
          Log in with Google 
        </button>

        {/* form */}
        <form onSubmit={handleSubmit} className='w-[75%] max-w-[370px] flex flex-col gap-4'>
          {/* email input */}
          <div className='w-full'>
            <label htmlFor='email' className='font-outfit text-xs text-light-txt2 pl-1'>
              Email
            </label>                
            <input 
              id='email'
              type="text"
              autoComplete='off'
              className={`p-1 w-full outline-0 
                ${ formErrors.email ? 'border-b-2 border-danger text-danger' : 
                  'border-b-1 border-light-txt2 focus:border-b-2 focus:border-light-txt text-light-txt'}  
              `} 
              placeholder='you@example.com'
              value={formData.email}
              onChange={(e) => {
                setFormData({...formData, email: e.target.value})
                if (formErrors.email) setFormErrors({ ...formErrors, email: ""});
              }}
            />
            <span className={`text-xs ${formErrors.email ? 'text-danger' : 'text-transparent'}`}>
              { formErrors.email || "placeholder" }
            </span>
          </div>
          {/* password input */}
          <div className='w-full'>
            <label htmlFor='password' className='font-outfit text-xs text-light-txt2 pl-1'>
              Password
            </label>   
            <div className='relative'>             
              <input 
                id='password'
                type={showPassword ? "text" : "password"}
                autoComplete='off'
                className={`p-1 w-full outline-0 
                ${ formErrors.password ? 'border-b-2 border-danger text-danger' : 
                  'border-b-1 border-light-txt2 focus:border-b-2 focus:border-light-txt text-light-txt'}  
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
            <span className={`text-xs ${formErrors.password ? 'text-danger' : 'text-transparent'}`}>
              { formErrors.password || "placeholder" }
            </span>
          </div>
          <PrimaryButton 
            type="submit"
            text="Login"
            loading={isLoggingIn}
          />
        </form>
        {/* link to login page*/}
          <div className='text-center'>
              <p className='text-light-txt2'>
                Don&apos;t have an account? {" "}
                <Link to='/signup' className='text-primary underline' >
                  Sign Up
                </Link>
              </p>
          </div>
      </div>
      {/* right side ** IMAGE ** */}
      <div className='bg-light-100 hidden md:flex flex-1 flex-col justify-center items-center p-6 gap-1'>
        <h2 className='text-xl font-semibold text-center text-light-txt'>
          Your Conversations, All in One Place
        </h2>
        <img src="/assets/Chatting-friend.gif" className='w-[70%]' />
        <span className='text-center text-light-txt2'>
          Sign in to continue your conversations and catch up with your messages.
        </span>
      </div>
    </div>
  )
}

export default LogInPage