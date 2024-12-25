import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { auth, db } from '../../firebase';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const Form = styled.form`
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
    margin: 0 0 20px;
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

const PhoneInput = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8f9fa;
  border: 2px solid #eee;
  border-radius: 10px;
  padding: 2px;
  transition: all 0.3s ease;

  &:focus-within {
    border-color: #ff9a9e;
    background: white;
    box-shadow: 0 0 0 3px rgba(255, 154, 158, 0.1);
  }

  .country-code {
    padding: 10px 15px;
    color: #555;
    font-weight: 500;
    font-size: 16px;
    border-right: 2px solid #eee;
  }

  input {
    flex: 1;
    padding: 12px 15px;
    border: none;
    background: transparent;
    font-size: 16px;
    color: #333;
    width: 100%;

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: #aaa;
    }
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
  margin-top: 20px;

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

const InfoText = styled.p`
  color: #666;
  font-size: 15px;
  margin-bottom: 30px;
  text-align: center;
  line-height: 1.5;
`;

const AddPhone = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().phone) {
          navigate('/');
        } else {
          const userData = userDoc.data();
          if (userData && userData.createdAt) {
            const creationTime = new Date(userData.createdAt).getTime();
            const now = new Date().getTime();
            const fiveMinutes = 5 * 60 * 1000;
            setIsNewUser(now - creationTime < fiveMinutes);
          }
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        setError('Error loading user data. Please try again.');
      }
    };

    checkUserStatus();
  }, [navigate]);

  const validatePhone = (number) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(number);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validatePhone(phone)) {
      setError('Please enter a valid Indian phone number (10 digits starting with 6-9)');
      return;
    }

    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('No user logged in');
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', `+91${phone}`));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setError('This phone number is already registered');
        return;
      }

      await updateDoc(doc(db, 'users', userId), {
        phone: `+91${phone}`
      });

      toast.success('Phone number added successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error adding phone number:', error);
      setError('Failed to add phone number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <h2>{isNewUser ? 'Complete Your Profile' : 'Add Phone Number'}</h2>
        <InfoText>
          {isNewUser 
            ? 'Please add your phone number to complete registration and access the app' 
            : 'Add your phone number to enable all features'}
        </InfoText>

        <FormGroup>
          <Label>Phone Number</Label>
          <PhoneInput>
            <span className="country-code">+91</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) {
                  setPhone(value);
                }
              }}
              placeholder="Enter 10-digit number"
              required
            />
          </PhoneInput>
        </FormGroup>

        {error && <ErrorText>{error}</ErrorText>}

        <Button type="submit" disabled={loading}>
          {loading ? 'Adding Phone Number...' : 'Continue'}
        </Button>
      </Form>
    </Container>
  );
};

export default AddPhone;
