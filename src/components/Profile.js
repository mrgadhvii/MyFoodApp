import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getAuth, updateProfile, updateEmail } from 'firebase/auth';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import Navbar from './Navbar';
import { toast } from 'react-toastify';
import { FaPlus } from 'react-icons/fa';

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

const Profile = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setName(data.name || '');
        setPhone(data.phone || '');
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        name,
        phone,
        addresses
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
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
        <h2>Profile Settings</h2>
        <ProfileForm onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </FormGroup>
          <FormGroup>
            <Label>Phone</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your phone number"
            />
          </FormGroup>

          <AddressSection>
            <h3>Delivery Addresses</h3>
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
                  />
                  <AddressActions>
                    <AddressButton primary onClick={addNewAddress}>
                      Add
                    </AddressButton>
                    <AddressButton onClick={() => setShowAddAddress(false)}>
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

          <Button type="submit">Save Changes</Button>
        </ProfileForm>
      </ProfileContainer>
    </>
  );
};

export default Profile;
