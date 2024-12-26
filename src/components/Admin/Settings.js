import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSave } from 'react-icons/fa';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const db = getFirestore();

const Container = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 30px;
  h1 {
    color: #2d3436;
    font-size: 2rem;
    margin-bottom: 10px;
    font-weight: 700;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
`;

const Section = styled.div`
  margin-bottom: 30px;

  h2 {
    color: #2d3436;
    font-size: 1.2rem;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f1f2f6;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    color: #2d3436;
    font-weight: 500;
  }

  input, textarea, select {
    width: 100%;
    padding: 10px;
    border: 1px solid #e1e1e1;
    border-radius: 8px;
    font-size: 0.9rem;
    margin-bottom: 5px;

    &:focus {
      outline: none;
      border-color: #6c5ce7;
    }
  }

  .helper-text {
    font-size: 0.8rem;
    color: #636e72;
  }
`;

const SaveButton = styled.button`
  background: #6c5ce7;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Settings = () => {
  const [settings, setSettings] = useState({
    restaurantName: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    deliveryFee: '',
    minOrderAmount: '',
    maxDeliveryDistance: '',
    operatingHours: {
      start: '09:00',
      end: '22:00'
    },
    taxRate: '',
    currency: 'INR'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        ...settings,
        updatedAt: new Date()
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    }
    setSaving(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Header>
        <h1>Settings</h1>
      </Header>

      <form onSubmit={handleSubmit}>
        <Card>
          <Section>
            <h2>Restaurant Information</h2>
            <FormGroup>
              <label>Restaurant Name</label>
              <input
                type="text"
                name="restaurantName"
                value={settings.restaurantName}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <label>Description</label>
              <textarea
                name="description"
                value={settings.description}
                onChange={handleChange}
                rows="3"
              />
            </FormGroup>

            <FormGroup>
              <label>Address</label>
              <textarea
                name="address"
                value={settings.address}
                onChange={handleChange}
                rows="2"
                required
              />
            </FormGroup>

            <FormGroup>
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                required
              />
            </FormGroup>
          </Section>

          <Section>
            <h2>Delivery Settings</h2>
            <FormGroup>
              <label>Delivery Fee (₹)</label>
              <input
                type="number"
                name="deliveryFee"
                value={settings.deliveryFee}
                onChange={handleChange}
                min="0"
                required
              />
            </FormGroup>

            <FormGroup>
              <label>Minimum Order Amount (₹)</label>
              <input
                type="number"
                name="minOrderAmount"
                value={settings.minOrderAmount}
                onChange={handleChange}
                min="0"
                required
              />
            </FormGroup>

            <FormGroup>
              <label>Maximum Delivery Distance (km)</label>
              <input
                type="number"
                name="maxDeliveryDistance"
                value={settings.maxDeliveryDistance}
                onChange={handleChange}
                min="0"
                required
              />
            </FormGroup>
          </Section>

          <Section>
            <h2>Operating Hours</h2>
            <FormGroup>
              <label>Opening Time</label>
              <input
                type="time"
                name="operatingHours.start"
                value={settings.operatingHours.start}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <label>Closing Time</label>
              <input
                type="time"
                name="operatingHours.end"
                value={settings.operatingHours.end}
                onChange={handleChange}
                required
              />
            </FormGroup>
          </Section>

          <Section>
            <h2>Financial Settings</h2>
            <FormGroup>
              <label>Tax Rate (%)</label>
              <input
                type="number"
                name="taxRate"
                value={settings.taxRate}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                required
              />
            </FormGroup>

            <FormGroup>
              <label>Currency</label>
              <select
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                required
              >
                <option value="INR">Indian Rupee (₹)</option>
              </select>
            </FormGroup>
          </Section>
        </Card>

        <SaveButton type="submit" disabled={saving}>
          <FaSave />
          {saving ? 'Saving...' : 'Save Settings'}
        </SaveButton>
      </form>
    </Container>
  );
};

export default Settings;
