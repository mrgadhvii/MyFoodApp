import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getFirestore, collection, query, where, addDoc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { toast } from 'react-toastify';

const HomeContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  h2 {
    text-align: center;
    color: #333;
    margin-bottom: 30px;
  }
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px;
`;

const MenuItem = styled.div`
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-5px);
  }
`;

const ItemImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const ItemDetails = styled.div`
  padding: 15px;
`;

const ItemName = styled.h3`
  margin: 0;
  color: #333;
  font-size: 1.2rem;
`;

const ItemPrice = styled.p`
  color: #e91e63;
  font-weight: bold;
  font-size: 1.1rem;
  margin: 10px 0;
`;

const AddToCartButton = styled.button`
  width: 100%;
  padding: 10px;
  background: #8a2be2;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;

  &:hover {
    background: #7a1dd1;
  }
`;

const LoadingText = styled.div`
  text-align: center;
  color: #666;
  font-size: 1.2rem;
  margin-top: 50px;
`;

const Home = () => {
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();

  // Hardcoded menu items
  const menuItems = [
    {
      id: '1',
      name: 'Paneer Butter Masala',
      price: 299,
      image: 'https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_508,h_320,c_fill/rqxv3gbmmbqzucxu6qkz'
    },
    {
      id: '2',
      name: 'Butter Chicken',
      price: 349,
      image: 'https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_508,h_320,c_fill/yfyo8aklppbwdplv7ofp'
    },
    {
      id: '3',
      name: 'Dal Makhani',
      price: 249,
      image: 'https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_508,h_320,c_fill/sfw4n6c7ftvrmjvfxcc3'
    },
    {
      id: '4',
      name: 'Veg Biryani',
      price: 279,
      image: 'https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_508,h_320,c_fill/hm9alpsl6gp9yimgkzw1'
    },
    {
      id: '5',
      name: 'Chicken Biryani',
      price: 329,
      image: 'https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_508,h_320,c_fill/xqwpuhgnsaf18te7zvtv'
    },
    {
      id: '6',
      name: 'Masala Dosa',
      price: 199,
      image: 'https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_508,h_320,c_fill/specials/3/mtbhhy0jio5zruqp4g1t'
    }
  ];

  const addToCart = async (item) => {
    console.log('Add to Cart called for item:', item);
    if (!auth.currentUser) {
      console.log('User is not logged in');
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      console.log('Getting cart reference...');
      const cartRef = collection(db, 'cart');
      console.log('Creating cart query...');
      const cartQuery = query(
        cartRef,
        where('userId', '==', auth.currentUser.uid),
        where('itemId', '==', item.id)
      );
      console.log('Getting cart snapshot...');
      const cartSnapshot = await getDocs(cartQuery);
      
      if (cartSnapshot.empty) {
        console.log('Item not found in cart, adding new item...');
        await addDoc(cartRef, {
          userId: auth.currentUser.uid,
          itemId: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: 1,
          timestamp: serverTimestamp()
        });
        console.log('Item added to cart successfully!');
        toast.success('Item added to cart successfully!');
      } else {
        console.log('Item found in cart, updating quantity...');
        const cartItemDoc = cartSnapshot.docs[0];
        const currentQuantity = cartItemDoc.data().quantity || 0;
        await updateDoc(cartItemDoc.ref, {
          quantity: currentQuantity + 1
        });
        console.log('Item quantity updated in cart!');
        toast.success('Item quantity updated in cart!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart: ' + error.message);
    }
  };

  return (
    <>
      <Navbar />
      <HomeContainer>
        <h2>Our Menu</h2>
        {loading ? (
          <LoadingText>Loading menu...</LoadingText>
        ) : (
          <MenuGrid>
            {menuItems.map((item) => (
              <MenuItem key={item.id}>
                <ItemImage src={item.image} alt={item.name} />
                <ItemDetails>
                  <ItemName>{item.name}</ItemName>
                  <ItemPrice>₹{item.price}</ItemPrice>
                  <AddToCartButton onClick={() => addToCart(item)}>
                    Add to Cart
                  </AddToCartButton>
                </ItemDetails>
              </MenuItem>
            ))}
          </MenuGrid>
        )}
      </HomeContainer>
    </>
  );
};

export default Home;
