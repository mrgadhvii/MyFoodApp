import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { auth, db } from '../../firebase';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const LoginForm = styled.form`
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
  }

  h2 {
    margin: 0 0 30px;
    color: #333;
    font-size: 28px;
    font-weight: 600;
    text-align: center;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 25px;
  position: relative;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.3s ease;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #eee;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: #f8f9fa;

  &:focus {
    outline: none;
    border-color: #ff9a9e;
    background: white;
    box-shadow: 0 0 0 3px rgba(255, 154, 158, 0.1);
  }

  &::placeholder {
    color: #aaa;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(90deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 7px 14px rgba(0,0,0,0.1);
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorText = styled.div`
  color: #ff4444;
  font-size: 14px;
  margin: 10px 0;
  text-align: center;
  padding: 10px;
  background: #fff1f1;
  border-radius: 8px;
  border: 1px solid #ffe0e0;
`;

const SuccessText = styled(ErrorText)`
  color: #28a745;
  background: #f1fff1;
  border: 1px solid #e0ffe0;
`;

const ForgotPasswordLink = styled.button`
  background: none;
  border: none;
  color: #ff9a9e;
  text-decoration: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  display: block;
  margin: 0 auto 20px;
  transition: all 0.3s ease;

  &:hover {
    color: #ff7e82;
    text-decoration: underline;
  }
`;

const SignupLink = styled(Link)`
  display: block;
  text-align: center;
  color: #666;
  text-decoration: none;
  font-size: 14px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;

  span {
    color: #ff9a9e;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: #999;
  font-size: 14px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #eee;
  }

  span {
    padding: 0 15px;
  }
`;

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const navigate = useNavigate();

  const validatePhone = (number) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(number);
  };

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError('Please enter both identifier (email/phone) and password');
      return;
    }

    setLoading(true);
    try {
      let userEmail;
      
      // Check if input is phone number
      if (validatePhone(identifier)) {
        // Query Firestore to find user with this phone number
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('phone', '==', `+91${identifier}`));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error('No account found with this phone number');
        }
        
        // Get the email associated with this phone number
        userEmail = querySnapshot.docs[0].data().email;
      } else {
        // Input is email
        userEmail = identifier;
      }

      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        // New user, create document
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userEmail,
          createdAt: new Date().toISOString(),
          addresses: []
        });
        // Redirect to add phone
        navigate('/add-phone');
      } else if (!userDoc.data().phone) {
        // Existing user but no phone, redirect to add phone
        navigate('/add-phone');
      } else {
        // User has phone number, proceed to home
        toast.success('Logged in successfully!');
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'An error occurred during login.';
      
      if (error.message === 'No account found with this phone number') {
        errorMessage = error.message;
      } else {
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage = 'Invalid email format.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password.';
            break;
          default:
            errorMessage = 'Failed to log in. Please try again.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!identifier) {
      setError('Please enter your email address');
      return;
    }

    // If it's a phone number, we need to find the associated email
    if (validatePhone(identifier)) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('phone', '==', `+91${identifier}`));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('No account found with this phone number');
          return;
        }
        
        // Get the email associated with this phone number
        identifier = querySnapshot.docs[0].data().email;
      } catch (error) {
        console.error('Error finding email:', error);
        setError('Error processing request. Please try again.');
        return;
      }
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, identifier);
      setResetEmailSent(true);
      setError('');
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send reset email.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        default:
          errorMessage = 'Error sending reset email. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={(e) => e.preventDefault()}>
        <h2>Welcome Back</h2>
        
        <FormGroup>
          <Label>Email or Phone Number</Label>
          <Input
            type="text"
            value={identifier}
            onChange={(e) => {
              if (validatePhone(e.target.value)) {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) {
                  setIdentifier(value);
                }
              } else {
                setIdentifier(e.target.value);
              }
            }}
            placeholder="Enter email or phone number"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </FormGroup>

        {error && <ErrorText>{error}</ErrorText>}
        {resetEmailSent && (
          <SuccessText>
            Password reset email sent! Please check your inbox.
          </SuccessText>
        )}

        <Button 
          type="button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>

        {!resetEmailSent && (
          <ForgotPasswordLink 
            type="button"
            onClick={handleForgotPassword}
            disabled={loading}
          >
            Forgot your password?
          </ForgotPasswordLink>
        )}

        <OrDivider>
          <span>OR</span>
        </OrDivider>

        <SignupLink to="/signup">
          Don't have an account? <span>Sign Up</span>
        </SignupLink>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login;
