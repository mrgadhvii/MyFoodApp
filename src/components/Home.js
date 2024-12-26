import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getFirestore, collection, query, where, addDoc, updateDoc, serverTimestamp, getDocs, onSnapshot, writeBatch, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from './Navbar';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaTrash, FaStar, FaSearch, FaComments } from 'react-icons/fa';

const FOOD_CATEGORIES = [
  'All',
  'Popular',
  'Starters',
  'Main Course',
  'Biryani',
  'Breads',
  'Desserts',
  'Beverages'
];

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

const MenuSection = styled.section`
  padding: 40px 0;
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  overflow-x: auto;
  padding-bottom: 10px;

  &::-webkit-scrollbar {
    height: 5px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f2f6;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #6c5ce7;
    border-radius: 10px;
  }
`;

const CategoryTab = styled.button`
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  background: ${props => props.active ? '#6c5ce7' : '#f1f2f6'};
  color: ${props => props.active ? 'white' : '#2d3436'};
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? '#6c5ce7' : '#e1e1e1'};
  }
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const MenuItem = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const MenuImage = styled.div`
  width: 100%;
  height: 200px;
  background-image: url(${props => props.src || 'https://via.placeholder.com/300x200?text=No+Image'});
  background-size: cover;
  background-position: center;
`;

const MenuInfo = styled.div`
  padding: 15px;

  h3 {
    margin: 0;
    color: #2d3436;
    font-size: 1.1rem;
  }

  p {
    color: #636e72;
    font-size: 0.9rem;
    margin: 5px 0;
  }

  .price {
    color: #6c5ce7;
    font-weight: 600;
    font-size: 1.2rem;
  }
`;

const AddToCartButton = styled.button`
  width: 100%;
  padding: 10px;
  background: #6c5ce7;
  color: white;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #5f4dd0;
  }
`;

const UnreadBadge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
  min-width: 18px;
  text-align: center;
`;

const NavLinkContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const SearchSection = styled.div`
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 10px 20px;
  border-radius: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  padding: 8px;
  font-size: 1rem;
  outline: none;

  &::placeholder {
    color: #a0a0a0;
  }
`;

const SearchIcon = styled(FaSearch)`
  color: #6c5ce7;
  font-size: 1.2rem;
`;

const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ffd700;
  margin-top: 8px;
  font-size: 0.9rem;

  span {
    color: #666;
  }
`;

const Home = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemReviews, setItemReviews] = useState({});
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuItems();
    fetchReviews();
    if (!auth.currentUser) return;

    const cartRef = collection(db, 'cart');
    const q = query(cartRef, where('userId', '==', auth.currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      let total = 0;
      snapshot.forEach((doc) => {
        const item = doc.data();
        count += item.quantity;
        total += item.price * item.quantity;
      });
      setCartCount(count);
      setCartTotal(total);
    });

    return () => unsubscribe();
  }, [auth.currentUser, db]);

  useEffect(() => {
    // Get initial count from localStorage
    const storedCount = localStorage.getItem('totalUnreadCount');
    if (storedCount) {
      setUnreadCount(parseInt(storedCount, 10));
    }

    // Listen for updates to unread count
    const handleUnreadCountUpdate = (event) => {
      setUnreadCount(event.detail.count);
    };

    window.addEventListener('unreadCountUpdated', handleUnreadCountUpdate);

    return () => {
      window.removeEventListener('unreadCountUpdated', handleUnreadCountUpdate);
    };
  }, []);

  const fetchReviews = async () => {
    const reviewsRef = collection(db, 'reviews');
    const reviewsQuery = query(reviewsRef, orderBy('timestamp', 'desc'));
    
    const snapshot = await getDocs(reviewsQuery);
    const reviewsData = {};
    
    snapshot.forEach((doc) => {
      const review = doc.data();
      if (review.itemId) {
        if (!reviewsData[review.itemId]) {
          reviewsData[review.itemId] = {
            total: 0,
            count: 0
          };
        }
        reviewsData[review.itemId].total += review.rating;
        reviewsData[review.itemId].count += 1;
      }
    });

    // Calculate averages
    Object.keys(reviewsData).forEach(itemId => {
      reviewsData[itemId].average = 
        (reviewsData[itemId].total / reviewsData[itemId].count).toFixed(1);
    });

    setItemReviews(reviewsData);
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'products'));
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(items);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleAddToCart = async (item) => {
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
          image: item.imageUrl,
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

  const clearCart = async () => {
    try {
      const cartRef = collection(db, 'cart');
      const q = query(cartRef, where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'All' || 
      (selectedCategory === 'Popular' && item.isPopular) ||
      item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Navbar>
        <ul>
          <NavLinkContainer>
            <Link to="/cart">
              <FaShoppingCart />
              {cartCount > 0 && <UnreadBadge>{cartCount}</UnreadBadge>}
            </Link>
          </NavLinkContainer>
          <NavLinkContainer>
            <Link to="/reviews">
              <FaStar style={{ fontSize: '24px', color: '#ffa502' }} />
            </Link>
          </NavLinkContainer>
          <NavLinkContainer>
            <Link to="/chat">
              <FaComments />
              {unreadCount > 0 && <UnreadBadge>{unreadCount}</UnreadBadge>}
            </Link>
          </NavLinkContainer>
          {auth.currentUser ? (
            <NavLinkContainer>
              <button onClick={() => navigate('/profile')}>Profile</button>
            </NavLinkContainer>
          ) : (
            <NavLinkContainer>
              <button onClick={() => navigate('/login')}>Login</button>
            </NavLinkContainer>
          )}
        </ul>
      </Navbar>
      <HomeContainer>
        <MenuSection>
          <h2>Our Menu</h2>
          <SearchSection>
            <SearchBar>
              <SearchIcon />
              <SearchInput
                type="text"
                placeholder="Search by name, category, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchBar>
          </SearchSection>

          <CategoryTabs>
            {FOOD_CATEGORIES.map(category => (
              <CategoryTab
                key={category}
                active={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </CategoryTab>
            ))}
          </CategoryTabs>

          <MenuGrid>
            {filteredItems.map(item => (
              <MenuItem key={item.id}>
                <MenuImage src={item.imageUrl} />
                <MenuInfo>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <p className="price">{formatCurrency(item.price)}</p>
                  {itemReviews[item.id] && (
                    <Rating>
                      <FaStar />
                      <span>
                        {itemReviews[item.id].average} 
                        ({itemReviews[item.id].count} reviews)
                      </span>
                    </Rating>
                  )}
                  <AddToCartButton onClick={() => handleAddToCart(item)}>
                    Add to Cart
                  </AddToCartButton>
                </MenuInfo>
              </MenuItem>
            ))}
          </MenuGrid>
        </MenuSection>

        {auth.currentUser && auth.currentUser.email === 'jaydevswebpannel@gmail.com' && (
          <Link to="/admin" style={{ display: 'none', textAlign: 'center', margin: '20px auto', padding: '10px 20px', background: '#6c5ce7', color: 'white', borderRadius: '5px', textDecoration: 'none', fontWeight: '600', maxWidth: '200px' }}>
            Go to Admin Panel
          </Link>
        )}
      </HomeContainer>

      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'center', padding: '0 20px', zIndex: '1000' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#8a2be2', padding: '8px 20px', borderRadius: '50px', boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)' }}>
            <button style={{ background: 'none', color: 'white', border: 'none', borderRadius: '50px', padding: '8px 20px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'transform 0.2s ease' }} onClick={() => navigate('/cart')}>
              <FaShoppingCart />
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', background: 'white', color: '#8a2be2', borderRadius: '50%', padding: '2px 8px' }}>{cartCount}</span>
              <span>₹{cartTotal}</span>
            </button>
            <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.3)' }} />
            <button style={{ background: 'none', border: 'none', color: 'white', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', transition: 'all 0.2s ease', opacity: '0.8' }} onClick={clearCart} title="Clear cart">
              <FaTrash />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
