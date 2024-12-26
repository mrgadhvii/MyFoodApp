import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import QRCode from 'qrcode';
import Navbar from './Navbar';
import { toast } from 'react-toastify';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp, writeBatch, onSnapshot, deleteDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaShoppingCart, FaUtensils, FaShoppingBag, FaPlus, FaMicrophone, FaStop, FaPlay, FaPause } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

const CartContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const CartItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const CartItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const ItemDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;

  @media (max-width: 768px) {
    gap: 15px;
  }
`;

const ItemImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 10px;
  object-fit: cover;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ItemName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3436;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ItemPrice = styled.p`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #6c5ce7;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ItemActions = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 15px;
  }
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 4px;
  gap: 8px;
`;

const QuantityButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: ${props => props.disabled ? '#e9ecef' : 'white'};
  color: ${props => props.disabled ? '#adb5bd' : '#2d3436'};
  border-radius: 6px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 1.1rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover:not(:disabled) {
    background: #6c5ce7;
    color: white;
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 1rem;
  }
`;

const QuantityDisplay = styled.span`
  min-width: 24px;
  text-align: center;
  font-weight: 600;
  color: #2d3436;
  font-size: 1rem;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s ease;
  border-radius: 50%;

  &:hover {
    background: #fff5f5;
    color: #c0392b;
  }

  @media (max-width: 768px) {
    font-size: 1.1rem;
    padding: 6px;
  }
`;

const EmptyCart = styled.div`
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  h2 {
    color: #2d3436;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  p {
    color: #636e72;
    margin-bottom: 25px;
  }

  svg.cart-icon {
    font-size: 2.5rem;
    color: #6c5ce7;
    margin-bottom: 20px;
  }
`;

const OrderSummary = styled.div`
  margin-top: 30px;
  padding: 25px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  h3 {
    margin: 0 0 20px 0;
    color: #2d3436;
    font-size: 1.2rem;
  }

  @media (max-width: 768px) {
    padding: 20px;
    margin-top: 20px;
  }
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: ${props => props.total ? 'none' : '1px solid #f1f2f6'};
  font-size: ${props => props.total ? '1.2rem' : '1rem'};
  font-weight: ${props => props.total ? '600' : '400'};
  color: ${props => props.total ? '#2d3436' : '#636e72'};

  @media (max-width: 768px) {
    font-size: ${props => props.total ? '1.1rem' : '0.95rem'};
    padding: 10px 0;
  }
`;

const CheckoutButton = styled.button`
  width: 100%;
  padding: 15px;
  margin-top: 20px;
  background: #6c5ce7;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(108, 92, 231, 0.2);

  &:hover:not(:disabled) {
    background: #5f50d9;
    box-shadow: 0 4px 12px rgba(108, 92, 231, 0.3);
  }

  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 12px;
    font-size: 1rem;
  }
`;

const AddressSection = styled.div`
  margin: 20px 0;
  padding: 25px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  h3 {
    margin: 0 0 20px 0;
    color: #2d3436;
    font-size: 1.2rem;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    padding: 20px;
    margin: 15px 0;
  }
`;

const AddressOption = styled.div`
  padding: 15px;
  margin: 10px 0;
  border: 2px solid ${props => props.selected ? '#6c5ce7' : '#f1f2f6'};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.selected ? '#f8f7ff' : 'white'};

  &:hover {
    border-color: #6c5ce7;
    background: ${props => props.selected ? '#f8f7ff' : '#fafaff'};
  }

  .primary-badge {
    display: inline-block;
    color: #6c5ce7;
    font-size: 0.8rem;
    font-weight: 500;
    margin-top: 5px;
    background: #f8f7ff;
    padding: 4px 8px;
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const AddAddressLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #6c5ce7;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 15px;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #f8f7ff;
  }

  svg {
    font-size: 0.9rem;
  }
`;

const BrowseMenuButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #6c5ce7;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(108, 92, 231, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(108, 92, 231, 0.3);
    background: #5f4dd0;
  }

  svg {
    font-size: 1.1rem;
  }
`;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCart = async () => {
      if (!auth.currentUser) return;

      const cartQuery = query(
        collection(db, 'cart'),
        where('userId', '==', auth.currentUser.uid)
      );

      const unsubscribe = onSnapshot(cartQuery, (snapshot) => {
        const items = [];
        let cartTotal = 0;
        
        snapshot.forEach((doc) => {
          const item = { id: doc.id, ...doc.data() };
          items.push(item);
          cartTotal += item.price * item.quantity;
        });
        
        setCartItems(items);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    loadCart();
    fetchUserAddresses();
  }, [auth.currentUser, db]);

  const fetchUserAddresses = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setAddresses(userData.addresses || []);
        // Set primary address as selected by default
        const primaryAddress = userData.addresses?.find(addr => addr.isPrimary);
        if (primaryAddress) {
          setSelectedAddressId(primaryAddress.id);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      const cartRef = doc(db, 'cart', itemId);
      if (newQuantity <= 0) {
        await deleteDoc(cartRef);
      } else {
        await updateDoc(cartRef, { quantity: newQuantity });
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const removeFromCart = (itemId) => {
    updateQuantity(itemId, 0);
  };

  const placeOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    try {
      setIsSubmitting(true);
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      
      const orderData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName: userData?.name || '',
        userPhone: userData?.phone || '',
        items: cartItems,
        total: calculateTotal(),
        status: 'pending',
        timestamp: serverTimestamp(),
        address: addresses.find(addr => addr.id === selectedAddressId)?.address || '',
        seen: false
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      // Clear cart after successful order
      const batch = writeBatch(db);
      cartItems.forEach(item => {
        const cartItemRef = doc(db, 'cart', item.id);
        batch.delete(cartItemRef);
      });
      await batch.commit();

      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const clearEntireCart = async () => {
    try {
      const batch = writeBatch(db);
      const cartQuery = query(collection(db, 'cart'), where('userId', '==', auth.currentUser.uid));
      const cartDocs = await getDocs(cartQuery);
      
      cartDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      toast.success('Cart cleared successfully');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  return (
    <>
      <Navbar />
      <CartContainer>
        {loading ? (
          <EmptyCart>
            <h2>Loading your cart...</h2>
          </EmptyCart>
        ) : error ? (
          <EmptyCart>
            <h2>{error}</h2>
          </EmptyCart>
        ) : cartItems.length === 0 ? (
          <EmptyCart>
            <FaShoppingCart className="cart-icon" />
            <h2>Your cart is empty</h2>
            <p>Add some delicious items to your cart</p>
            <BrowseMenuButton to="/">
              <FaUtensils /> Browse Menu
            </BrowseMenuButton>
          </EmptyCart>
        ) : (
          <>
            <CartItems>
              {cartItems.map(item => (
                <CartItem key={item.id}>
                  <ItemDetails>
                    <ItemImage src={item.image} alt={item.name} />
                    <ItemInfo>
                      <ItemName>{item.name}</ItemName>
                      <ItemPrice>₹{item.price}</ItemPrice>
                    </ItemInfo>
                  </ItemDetails>
                  <ItemActions>
                    <QuantityControl>
                      <QuantityButton 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </QuantityButton>
                      <QuantityDisplay>{item.quantity}</QuantityDisplay>
                      <QuantityButton onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        +
                      </QuantityButton>
                    </QuantityControl>
                    <DeleteButton onClick={() => removeFromCart(item.id)}>
                      <FaTrash />
                    </DeleteButton>
                  </ItemActions>
                </CartItem>
              ))}
            </CartItems>

            <AddressSection>
              <h3>Delivery Address</h3>
              {addresses.map(addr => (
                <AddressOption
                  key={addr.id}
                  selected={addr.id === selectedAddressId}
                  onClick={() => setSelectedAddressId(addr.id)}
                >
                  {addr.address}
                  {addr.isPrimary && (
                    <div className="primary-badge">
                      Primary Address
                    </div>
                  )}
                </AddressOption>
              ))}
              <AddAddressLink to="/profile">
                <FaPlus /> Add New Address
              </AddAddressLink>
            </AddressSection>

            <OrderSummary>
              <h3>Order Summary</h3>
              <SummaryItem>
                <span>Subtotal:</span>
                <span>₹{calculateTotal()}</span>
              </SummaryItem>
              <SummaryItem>
                <span>Delivery Fee:</span>
                <span>₹40</span>
              </SummaryItem>
              <SummaryItem total>
                <span>Total:</span>
                <span>₹{calculateTotal() + 40}</span>
              </SummaryItem>
            </OrderSummary>

            <CheckoutButton
              onClick={placeOrder}
              disabled={isSubmitting || !selectedAddressId}
            >
              {isSubmitting ? (
                'Placing Order...'
              ) : (
                <>
                  <FaShoppingBag /> Place Order
                </>
              )}
            </CheckoutButton>
          </>
        )}
      </CartContainer>
    </>
  );
};

export default Cart;
