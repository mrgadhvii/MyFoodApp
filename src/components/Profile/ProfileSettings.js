import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import Navbar from '../Navbar';

const Container = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: blueviolet;
  }
`;

const Button = styled.button`
  background: blueviolet;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const EmailDisplay = styled.div`
  padding: 0.8rem;
  background: #f5f5f5;
  border-radius: 4px;
  color: #666;
`;

const ProfileSettings = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUsernameChange, setLastUsernameChange] = useState(null);
  const [error, setError] = useState('');
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username || '');
          setEmail(auth.currentUser.email);
          setLastUsernameChange(userData.lastUsernameChange?.toDate() || null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      }
    };

    fetchUserProfile();
  }, [auth.currentUser, db]);

  const canChangeUsername = () => {
    if (!lastUsernameChange) return true;
    const daysSinceLastChange = (new Date() - lastUsernameChange) / (1000 * 60 * 60 * 24);
    return daysSinceLastChange >= 14;
  };

  const validateUsername = async (newUsername) => {
    if (!newUsername.startsWith('@')) {
      return 'Username must start with @';
    }

    if (newUsername.length < 4) {
      return 'Username must be at least 4 characters long';
    }

    // Check if username exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', newUsername));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const existingUser = querySnapshot.docs[0];
      if (existingUser.id !== auth.currentUser.uid) {
        return 'Username already exists';
      }
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setError('');

      // Don't allow changes if within 14 days
      if (!canChangeUsername()) {
        const daysLeft = Math.ceil(14 - (new Date() - lastUsernameChange) / (1000 * 60 * 60 * 24));
        throw new Error(`You can change your username in ${daysLeft} days`);
      }

      const validationError = await validateUsername(username);
      if (validationError) {
        throw new Error(validationError);
      }

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        username: username,
        lastUsernameChange: serverTimestamp()
      });

      setLastUsernameChange(new Date());
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!auth.currentUser) {
    return <div>Please login to access profile settings</div>;
  }

  return (
    <>
      <Navbar />
      <Container>
        <Title>Profile Settings</Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Email</Label>
            <EmailDisplay>{email}</EmailDisplay>
          </FormGroup>
          
          <FormGroup>
            <Label>Username</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              disabled={!canChangeUsername()}
            />
            {!canChangeUsername() && (
              <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Username can be changed every 14 days. 
                {lastUsernameChange && (
                  <span>
                    Next change available in {Math.ceil(14 - (new Date() - lastUsernameChange) / (1000 * 60 * 60 * 24))} days
                  </span>
                )}
              </div>
            )}
            {error && <div style={{ color: 'red', fontSize: '0.9rem', marginTop: '0.5rem' }}>{error}</div>}
          </FormGroup>

          <Button type="submit" disabled={loading || !canChangeUsername()}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </Form>
      </Container>
    </>
  );
};

export default ProfileSettings;
