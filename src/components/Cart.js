import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import QRCode from 'qrcode';
import Navbar from './Navbar';
import { toast } from 'react-toastify';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp, writeBatch, onSnapshot, deleteDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaShoppingCart, FaUtensils, FaShoppingBag, FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const CartContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const CartItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CartItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin: 10px 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ItemImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
`;

const ItemDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ItemName = styled.h3``;

const ItemPrice = styled.p``;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const QuantityButton = styled.button`
  background: #f0f0f0;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background: #e0e0e0;
  }
`;

const QuantityDisplay = styled.span``;

const DeleteButton = styled.button`
  background: #ff4444;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background: #cc0000;
  }
`;

const PaymentSection = styled.div`
  margin-top: 20px;
`;

const PaymentOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PaymentOption = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const OrderSummary = styled.div`
  margin-top: 20px;
`;

const TotalAmount = styled.p`
  font-size: 1.5em;
  font-weight: bold;
  text-align: right;
  margin: 20px 0;
`;

const PlaceOrderButton = styled.button`
  width: 100%;
  padding: 15px;
  margin-top: 20px;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #32CD32 0%, #228B22 100%);
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(50, 205, 50, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(50, 205, 50, 0.3);
    background: linear-gradient(135deg, #3CD63C 0%, #2AA22A 100%);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(50, 205, 50, 0.2);
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  svg {
    font-size: 1.2rem;
  }
`;

const LoadingText = styled.p`
  font-size: 1.5em;
  font-weight: bold;
  text-align: center;
  margin: 20px 0;
`;

const ErrorText = styled.p`
  font-size: 1.5em;
  font-weight: bold;
  text-align: center;
  margin: 20px 0;
  color: red;
`;

const EmptyCartContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  min-height: 400px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 20px;
`;

const EmptyCartIcon = styled.div`
  font-size: 5rem;
  color: #8a2be2;
  margin-bottom: 20px;
  opacity: 0.8;
`;

const EmptyCartText = styled.h2`
  color: #333;
  font-size: 1.8rem;
  margin-bottom: 10px;
  font-weight: 500;
`;

const EmptyCartSubText = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 30px;
`;

const ShopNowButton = styled.button`
  padding: 12px 30px;
  background: linear-gradient(135deg, #8a2be2 0%, #6a0dad 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(138, 43, 226, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(138, 43, 226, 0.3);
    background: linear-gradient(135deg, #9d3cf7 0%, #7b1ec4 100%);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(138, 43, 226, 0.2);
  }

  svg {
    font-size: 1.2rem;
  }
`;

const AddMoreButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #f8f4ff;
  color: blueviolet;
  text-decoration: none;
  border-radius: 8px;
  margin: 15px 0;
  font-weight: 500;
  border: 2px dashed blueviolet;
  transition: all 0.3s ease;

  &:hover {
    background: #f0e6ff;
    transform: translateY(-2px);
  }

  svg {
    font-size: 1.2rem;
  }
`;

const AddressSelect = styled.div`
  margin: 15px 0;
`;

const AddressOption = styled.div`
  padding: 12px;
  border: 2px solid ${props => props.selected ? 'blueviolet' : '#e0e0e0'};
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  background: ${props => props.selected ? '#f8f4ff' : 'white'};
  transition: all 0.2s ease;

  &:hover {
    border-color: blueviolet;
  }
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 1.1rem;
  ${props => props.total && `
    font-size: 1.3rem;
    font-weight: bold;
  `}
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
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
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

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
      
      const orderRef = await addDoc(collection(db, 'orders'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        items: cartItems,
        total: calculateTotal(),
        address: selectedAddress.address,
        status: 'pending',
        timestamp: serverTimestamp(),
        seen: false
      });

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
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <>
      <Navbar />
      <CartContainer>
        <h2>Shopping Cart</h2>
        {loading ? (
          <LoadingText>Loading cart...</LoadingText>
        ) : error ? (
          <ErrorText>{error}</ErrorText>
        ) : cartItems.length === 0 ? (
          <EmptyCartContainer>
            <EmptyCartIcon>
              <FaShoppingCart />
            </EmptyCartIcon>
            <EmptyCartText>Your cart is empty</EmptyCartText>
            <EmptyCartSubText>Add some delicious items to your cart!</EmptyCartSubText>
            <ShopNowButton onClick={() => navigate('/')}>
              <FaUtensils /> Order Now
            </ShopNowButton>
          </EmptyCartContainer>
        ) : (
          <>
            <CartItems>
              {cartItems.map((item) => (
                <CartItem key={item.id}>
                  <ItemImage src={item.image} alt={item.name} />
                  <ItemDetails>
                    <ItemName>{item.name}</ItemName>
                    <ItemPrice>₹{item.price}</ItemPrice>
                    <QuantityControl>
                      <QuantityButton onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        -
                      </QuantityButton>
                      <QuantityDisplay>{item.quantity}</QuantityDisplay>
                      <QuantityButton onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        +
                      </QuantityButton>
                    </QuantityControl>
                  </ItemDetails>
                  <DeleteButton onClick={() => removeFromCart(item.id)}>
                    <FaTrash />
                  </DeleteButton>
                </CartItem>
              ))}
            </CartItems>

            <AddMoreButton to="/">
              <FaPlus /> Add More Items
            </AddMoreButton>

            <AddressSelect>
              <h3>Select Delivery Address</h3>
              {addresses.map(addr => (
                <AddressOption
                  key={addr.id}
                  selected={addr.id === selectedAddressId}
                  onClick={() => setSelectedAddressId(addr.id)}
                >
                  {addr.address}
                  {addr.isPrimary && (
                    <div style={{ color: 'blueviolet', fontSize: '12px', marginTop: '5px' }}>
                      Primary Address
                    </div>
                  )}
                </AddressOption>
              ))}
              <Link 
                to="/profile" 
                style={{ 
                  display: 'block', 
                  color: 'blueviolet', 
                  marginTop: '10px',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}
              >
                <FaPlus style={{ marginRight: '5px' }} /> Add New Address
              </Link>
            </AddressSelect>

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

            <PlaceOrderButton
              onClick={handlePlaceOrder}
              disabled={isSubmitting || !selectedAddressId}
            >
              {isSubmitting ? (
                'Placing Order...'
              ) : (
                <>
                  <FaShoppingBag /> Place Order
                </>
              )}
            </PlaceOrderButton>
          </>
        )}
      </CartContainer>
    </>
  );
};

export default Cart;
