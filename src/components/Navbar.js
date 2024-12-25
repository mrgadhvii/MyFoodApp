import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { FaBars, FaTimes, FaUser, FaShoppingCart, FaBell, FaComments, FaClipboardList, FaStar } from 'react-icons/fa';

const Nav = styled.nav`
  background-color: blueviolet;
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
`;

const MenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const Overlay = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: 250px;
    background-color: blueviolet;
    flex-direction: column;
    padding: 2rem;
    transform: ${({ isOpen }) => (isOpen ? 'translateX(0)' : 'translateX(100%)')};
    transition: transform 0.3s ease-in-out;
    z-index: 1000;
    overflow-y: auto;
  }
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  @media (max-width: 768px) {
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
    justify-content: flex-start;
    
    &:active {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  background: ${props => props.color || '#ff4444'};
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  min-width: 20px;
  text-align: center;
  
  @media (max-width: 768px) {
    position: relative;
    top: 0;
    right: 0;
    margin-left: 8px;
  }
`;

const CloseButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  position: absolute;
  top: 1rem;
  right: 1rem;
  cursor: pointer;
  z-index: 1001;
  padding: 0.5rem;
  
  @media (max-width: 768px) {
    display: block;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [newOrders, setNewOrders] = useState(0);
  const auth = getAuth();
  const db = getFirestore();
  const isOwner = auth.currentUser?.email === 'jaydevswebpannel@gmail.com';
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const cartRef = collection(db, 'cart');
    const q = query(cartRef, where('userId', '==', auth.currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalQuantity = 0;
      snapshot.forEach((doc) => {
        totalQuantity += doc.data().quantity || 0;
      });
      setCartCount(totalQuantity);
    });

    return () => unsubscribe();
  }, [auth.currentUser, db]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Listen for notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      setUnreadNotifications(snapshot.size);
    });

    // Listen for new orders (owner only)
    if (isOwner) {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('status', '==', 'pending'),
        where('seen', '==', false) // Only count unseen pending orders
      );

      const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        setNewOrders(snapshot.size);
      });

      return () => {
        unsubscribeNotifications();
        unsubscribeOrders();
      };
    }

    return () => unsubscribeNotifications();
  }, [auth.currentUser, db, isOwner]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };

  const openMenu = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden'; // Disable scrolling when menu is open
  };

  return (
    <Nav>
      <NavContainer>
        <Logo to="/">MrGadhvii</Logo>
        
        <MenuButton onClick={openMenu}>
          <FaBars />
        </MenuButton>

        <Overlay isOpen={isOpen} onClick={closeMenu} />
        
        <NavLinks isOpen={isOpen}>
          <CloseButton onClick={closeMenu}>
            <FaTimes />
          </CloseButton>

          <NavLink to="/profile" onClick={closeMenu}>
            <FaUser /> Profile
          </NavLink>

          {!isOwner && (
            <NavLink to="/cart" onClick={closeMenu}>
              <FaShoppingCart /> Cart
              {cartCount > 0 && <Badge color="#dc3545">{cartCount}</Badge>}
            </NavLink>
          )}

          <NavLink to="/orders" onClick={closeMenu}>
            <FaClipboardList /> Orders
            {isOwner && newOrders > 0 && <Badge color="#dc3545">{newOrders}</Badge>}
          </NavLink>

          <NavLink to="/chat" onClick={closeMenu}>
            <FaComments /> Chat
          </NavLink>

          {!isOwner && (
            <NavLink to="/notifications" onClick={closeMenu}>
              <FaBell /> Notifications
              {unreadNotifications > 0 && <Badge color="#dc3545">{unreadNotifications}</Badge>}
            </NavLink>
          )}

          <NavLink to="/reviews" onClick={closeMenu}>
            <FaStar /> Reviews
          </NavLink>

          <NavLink to="#" onClick={() => { closeMenu(); handleLogout(); }}>
            Logout
          </NavLink>
        </NavLinks>
      </NavContainer>
    </Nav>
  );
};

export default Navbar;