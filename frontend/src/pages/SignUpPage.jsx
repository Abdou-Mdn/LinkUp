import React, { useState } from 'react'
import { Link } from 'react-router-dom';

import { useAuthStore } from '../store/auth.store';

import PrimaryButton from '../components/PrimaryButton';
import TextInput from '../components/TextInput';

/* 
 * SignUp Page
 * used to create a new account, needs name, email and password to sign up

 * displays a signup form and an additional infos on the side
*/
function SignUpPage() {
  const { signup, isSigningUp } = useAuthStore();

  // form inputs text
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  // form errors
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    password: ""
  });

  // validate form
  const validateForm = () => {
    let isValid = true;
    let errors = {
      name: "",
      email: "",
      password: ""
    }

    // validate name (cannot be empty)
    if(!formData.name.trim()) {
      errors.name = "Name is required";
      isValid = false;
    }

    // validate email (cannot be empty and should of correct format)
    if(!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if(!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      errors.email = "Invalid email format";
      isValid = false;
    }

    // validate password (cannot be empty or under 8 characters)
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

  // handle signup 
  const handleSubmit = (event) => {
    event.preventDefault();

    const success = validateForm();

    if(success === true) signup(formData);
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
          <h2 className='font-semibold text-center text-light-txt'>Get Started</h2>
          <span className='text-sm text-center text-light-txt2'>Create your free account</span>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className='w-[75%] max-w-[370px] flex flex-col items-center justify-center gap-4'>
          {/* name input */}
          <TextInput
            label='Name'
            isPassword={false}
            placeholder='John Doe'
            value={formData.name}
            onChange={(e) => {
              setFormData({...formData, name: e.target.value})
              if (formErrors.name) setFormErrors({ ...formErrors, name: ""});
            }}
            error={formErrors.name}
            darkTheme={false}
            fullWidth={true}
          />
          
          {/* email input */}
          <TextInput
            label='Email'
            isPassword={false}
            placeholder='you@example.com'
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
            darkTheme={false}
            fullWidth={true}
          />
          
          {/* submit button (sign up) */}
          <PrimaryButton 
            type="submit"
            text="Create Account"
            className='w-full p-3'
            loading={isSigningUp}
          />
        </form>

        {/* link to signup page*/}
          <div className='text-center'>
              <p className='text-light-txt2'>
                Already have an account? {" "}
                <Link to='/login' className='text-primary hover:text-secondary hover:underline' >
                  Log in
                </Link>
              </p>
          </div>
      </div>
      
      {/* right side ** IMAGE ** */}
      <div className='bg-light-100 hidden md:flex flex-1 flex-col justify-center items-center p-6 gap-1'>
        {/* sub title */}
        <h2 className='text-xl font-semibold text-center text-light-txt'>
          Join the LinkUp Community
        </h2>

        {/* image */}
        <img src="/assets/Texting.gif" className='w-[70%]' />
        
        {/* text */}
        <span className='text-center text-light-txt2'>
          Create your account and start connecting with friends, joining group chats, and being part of something real.
        </span>
      </div>
    </div>
  )
}

export default SignUpPage