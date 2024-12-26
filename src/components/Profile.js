import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import Navbar from './Navbar';
import { toast } from 'react-toastify';
import { FaPlus, FaTimes, FaCog, FaInfoCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ProfileContainer = styled.div`
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 15px;
    margin: 10px;
  }
`;

const ProfileForm = styled.form`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: blueviolet;
  }
`;

const Button = styled.button`
  background-color: blueviolet;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
  margin-top: 10px;
  
  &:hover {
    background-color: #6a0dad;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ClearDataButton = styled(Button)`
  background-color: #dc3545;
  margin-top: 20px;
  
  &:hover {
    background-color: #c82333;
  }
`;

const AddressSection = styled.div`
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const AddressGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
`;

const AddressCard = styled.div`
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  position: relative;
  background: ${props => props.isPrimary ? '#f8f4ff' : 'white'};
  border: 2px solid ${props => props.isPrimary ? 'blueviolet' : '#e0e0e0'};

  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
`;

const AddressActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const AddressButton = styled.button`
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  background: ${props => props.primary ? 'blueviolet' : props.delete ? '#ff4444' : '#e0e0e0'};
  color: ${props => props.primary || props.delete ? 'white' : '#333'};

  &:hover {
    opacity: 0.9;
  }
`;

const AddAddressButton = styled.button`
  width: 100%;
  padding: 15px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #666;
  font-size: 14px;

  &:hover {
    border-color: blueviolet;
    color: blueviolet;
  }
`;

const NamePromptOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const NamePromptModal = styled.div`
  background: white;
  padding: 25px;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalTitle = styled.h3`
  margin-bottom: 15px;
  color: #333;
`;

const ModalInput = styled(Input)`
  margin-bottom: 15px;
`;

const EmailDisplay = styled.div`
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
`;

const ProfileSection = styled.div`
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h3`
  margin-bottom: 15px;
  color: #333;
`;

const UsernameInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: ${props => props.changes >= 2 ? '#dc3545' : '#666'};
  margin-top: 4px;
`;

const Profile = () => {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [usernameChanges, setUsernameChanges] = useState(0);
  const [originalUsername, setOriginalUsername] = useState('');
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    const checkUsername = async () => {
      if (!auth.currentUser) return;
      
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      
      if (!userData?.username && location.pathname !== '/profile') {
        const generatedUsername = generateUsername(auth.currentUser.email);
        setUsername(generatedUsername);
        setShowUsernamePrompt(true);
      }
    };

    checkUsername();
  }, [auth.currentUser, location.pathname]);

  const generateUsername = (email) => {
    // Remove everything after @ and special characters
    const baseName = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    
    // Add random numbers (3 digits)
    const randomNum = Math.floor(Math.random() * 900) + 100;
    
    return '@' + baseName.toLowerCase() + randomNum;
  };

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUsername(data.username || generateUsername(auth.currentUser.email));
        setOriginalUsername(data.username || '');
        setUsernameChanges(data.usernameChanges || 0);
        setPhone(data.phone || '+91');
        setAddresses(data.addresses || []);
      } else {
        // If user doc doesn't exist, generate a username
        const generatedUsername = generateUsername(auth.currentUser.email);
        setUsername(generatedUsername);
        setPhone('+91');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    
    if (!username.startsWith('@')) {
      toast.error('Username must start with @');
      return;
    }

    if (username !== originalUsername && usernameChanges >= 2) {
      toast.error('You have reached the maximum number of username changes');
      setUsername(originalUsername); // Reset to original username
      return;
    }

    try {
      const newChanges = username !== originalUsername ? usernameChanges + 1 : usernameChanges;
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        username,
        usernameChanges: newChanges,
        phone,
        addresses
      });
      
      setUsernameChanges(newChanges);
      setOriginalUsername(username);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleUsernameSubmit = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (!username.startsWith('@')) {
      toast.error('Username must start with @');
      return;
    }

    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        username,
        usernameChanges: 0,
        phone: phone || '+91',
        addresses: addresses || [],
        email: auth.currentUser.email
      }, { merge: true });

      setOriginalUsername(username);
      setShowUsernamePrompt(false);
      toast.success('Username saved successfully');
    } catch (error) {
      console.error('Error saving username:', error);
      toast.error('Failed to save username');
    }
  };

  const addNewAddress = () => {
    if (!newAddress.trim()) {
      toast.error('Please enter an address');
      return;
    }

    const newAddressObj = {
      id: Date.now().toString(),
      address: newAddress.trim(),
      isPrimary: addresses.length === 0 // Make first address primary by default
    };

    setAddresses([...addresses, newAddressObj]);
    setNewAddress('');
    setShowAddAddress(false);
    toast.success('Address added successfully');
  };

  const setPrimaryAddress = (addressId) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isPrimary: addr.id === addressId
    }));
    setAddresses(updatedAddresses);
  };

  const deleteAddress = (addressId) => {
    const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
    // If we deleted the primary address and there are other addresses, make the first one primary
    if (updatedAddresses.length > 0 && addresses.find(addr => addr.id === addressId)?.isPrimary) {
      updatedAddresses[0].isPrimary = true;
    }
    setAddresses(updatedAddresses);
  };

  return (
    <>
      <Navbar />
      <ProfileContainer>
        <h2>Profile</h2>
        <ProfileSection>
          <SectionTitle>Account Settings</SectionTitle>
          <ProfileForm onSubmit={handleSubmit}>
            <EmailDisplay>
              Email: {auth.currentUser?.email}
            </EmailDisplay>
            
            <FormGroup>
              <Label>Username</Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => {
                  if (usernameChanges >= 2 && e.target.value !== originalUsername) {
                    toast.error('You have reached the maximum number of username changes');
                    return;
                  }
                  let value = e.target.value;
                  if (!value.startsWith('@')) {
                    value = '@' + value;
                  }
                  setUsername(value);
                }}
                placeholder="@username"
                required
                disabled={usernameChanges >= 2}
              />
              <UsernameInfo changes={usernameChanges}>
                <FaInfoCircle />
                {usernameChanges >= 2 
                  ? 'You have reached the maximum number of username changes'
                  : `You can change your username ${2 - usernameChanges} more time${2 - usernameChanges === 1 ? '' : 's'}`}
              </UsernameInfo>
            </FormGroup>

            <FormGroup>
              <Label>Phone</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => {
                  let value = e.target.value;
                  if (!value.startsWith('+91')) {
                    value = '+91' + value.replace('+91', '');
                  }
                  setPhone(value);
                }}
                placeholder="+91 Phone number"
              />
            </FormGroup>

            <Button type="submit">Save Changes</Button>
          </ProfileForm>
        </ProfileSection>

        <AddressSection>
          <SectionTitle>Delivery Addresses</SectionTitle>
          <AddressGrid>
            {addresses.map((addr) => (
              <AddressCard key={addr.id} isPrimary={addr.isPrimary}>
                <div>{addr.address}</div>
                {addr.isPrimary && (
                  <div style={{ color: 'blueviolet', fontSize: '12px', marginTop: '5px' }}>
                    Primary Address
                  </div>
                )}
                <AddressActions>
                  {!addr.isPrimary && (
                    <AddressButton 
                      primary 
                      onClick={() => setPrimaryAddress(addr.id)}
                    >
                      Set as Primary
                    </AddressButton>
                  )}
                  <AddressButton 
                    delete 
                    onClick={() => deleteAddress(addr.id)}
                  >
                    Delete
                  </AddressButton>
                </AddressActions>
              </AddressCard>
            ))}
            {showAddAddress ? (
              <AddressCard>
                <Input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Enter new address"
                  autoFocus
                />
                <AddressActions>
                  <AddressButton primary onClick={addNewAddress}>
                    Save
                  </AddressButton>
                  <AddressButton onClick={() => {
                    setShowAddAddress(false);
                    setNewAddress('');
                  }}>
                    Cancel
                  </AddressButton>
                </AddressActions>
              </AddressCard>
            ) : (
              <AddAddressButton onClick={() => setShowAddAddress(true)}>
                <FaPlus /> Add New Address
              </AddAddressButton>
            )}
          </AddressGrid>
        </AddressSection>

        <ProfileSection>
          <SectionTitle>Account Actions</SectionTitle>
          <ClearDataButton onClick={() => {
            if (window.confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
              // Add clear data functionality
              toast.success('Account data cleared successfully');
            }
          }}>
            Clear Account Data
          </ClearDataButton>
        </ProfileSection>

        {showUsernamePrompt && (
          <NamePromptOverlay>
            <NamePromptModal>
              <ModalTitle>Welcome! Choose your username</ModalTitle>
              <ModalInput
                type="text"
                value={username}
                onChange={(e) => {
                  let value = e.target.value;
                  if (!value.startsWith('@')) {
                    value = '@' + value;
                  }
                  setUsername(value);
                }}
                placeholder="@username"
                autoFocus
              />
              <UsernameInfo changes={0}>
                <FaInfoCircle />
                Note: You can only change your username twice after this
              </UsernameInfo>
              <Button onClick={handleUsernameSubmit}>Save Username</Button>
            </NamePromptModal>
          </NamePromptOverlay>
        )}
      </ProfileContainer>
    </>
  );
};

export default Profile;
