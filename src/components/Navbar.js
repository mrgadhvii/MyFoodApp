import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { FaShoppingCart, FaUser, FaBell, FaClipboardList, FaComments, FaStar, FaBars, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Nav = styled.nav`
  background: blueviolet;
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 1000;
  @media (max-width: 768px) {
    padding: 0.8rem;
  }
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media (max-width: 768px) {
    position: relative;
  }
`;

const Logo = styled(Link)`
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
    flex-direction: column;
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: 250px;
    background-color: blueviolet;
    padding: 4rem 2rem 2rem;
    gap: 2rem;
    box-shadow: -2px 0 5px rgba(0,0,0,0.2);
    transition: transform 0.3s ease-in-out;
    transform: ${({ isOpen }) => (isOpen ? 'translateX(0)' : 'translateX(100%)')};
  }
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;

  &:hover {
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    font-size: 1.1rem;
    width: 100%;
    padding: 0.5rem 0;
  }
`;

const NavLinkContainer = styled.div`
  position: relative;
  display: inline-block;
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

const MenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 1001;

  @media (max-width: 768px) {
    display: block;
    position: ${({ isOpen }) => (isOpen ? 'fixed' : 'relative')};
    right: ${({ isOpen }) => (isOpen ? '1rem' : '0')};
  }
`;

const CloseButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  position: absolute;
  top: 1rem;
  right: 1rem;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Badge = styled.span`
  background-color: ${props => props.color || '#dc3545'};
  color: white;
  border-radius: 50%;
  padding: 0.2rem 0.5rem;
  font-size: 0.8rem;
  position: absolute;
  top: -8px;
  right: -12px;
`;

const ProfileContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const ProfileButton = styled.button`
  background: none;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1rem;

  &:hover {
    opacity: 0.8;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  min-width: 200px;
  display: ${props => props.show ? 'block' : 'none'};
  z-index: 1000;

  @media (max-width: 768px) {
    position: static;
    background: transparent;
    box-shadow: none;
    min-width: auto;
    width: 100%;
  }
`;

const DropdownItem = styled.div`
  padding: 0.8rem 1rem;
  color: ${props => props.isDesktop ? '#333' : 'white'};
  transition: background-color 0.2s;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background-color: ${props => props.isDesktop ? '#f5f5f5' : 'rgba(255,255,255,0.1)'};
  }

  @media (max-width: 768px) {
    color: white;
    padding: 1rem;
  }
`;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [username, setUsername] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  const location = useLocation();
  const isOwner = auth.currentUser?.email === 'jaydevswebpannel@gmail.com';

  useEffect(() => {
    const fetchUsername = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username || '@user');
        }
      }
    };
    fetchUsername();
  }, [auth.currentUser, db]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Cart count listener
    const cartRef = collection(db, 'cart');
    const cartQuery = query(cartRef, where('userId', '==', auth.currentUser.uid));
    const unsubscribeCart = onSnapshot(cartQuery, (snapshot) => {
      setCartCount(snapshot.docs.length);
    });

    // Notifications listener
    const notificationsRef = collection(db, 'notifications');
    const notifQuery = query(
      notificationsRef,
      where('userId', '==', auth.currentUser.uid),
      where('read', '==', false)
    );
    const unsubscribeNotif = onSnapshot(notifQuery, (snapshot) => {
      setUnreadNotifications(snapshot.docs.length);
    });

    return () => {
      unsubscribeCart();
      unsubscribeNotif();
    };
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleDropdownClick = (path) => {
    navigate(path);
    closeMenu();
  };

  return (
    <Nav>
      <NavContainer>
        <Logo to="/">MrGadhvii</Logo>
        <NavLinks isOpen={isOpen}>
          {isOpen && <CloseButton onClick={() => setIsOpen(false)}><FaTimes /></CloseButton>}
          
          {auth.currentUser && (
            <>
              {isOwner && (
                <NavLinkContainer>
                  <NavLink to="/admin" onClick={() => setIsOpen(false)}>
                    <FaUser /> Admin Panel
                  </NavLink>
                </NavLinkContainer>
              )}

              <NavLinkContainer>
                <NavLink to="/cart" onClick={() => setIsOpen(false)}>
                  <FaShoppingCart /> Cart
                  {cartCount > 0 && <Badge>{cartCount}</Badge>}
                </NavLink>
              </NavLinkContainer>

              <NavLinkContainer>
                <NavLink to="/orders" onClick={() => setIsOpen(false)}>
                  <FaClipboardList /> Orders
                </NavLink>
              </NavLinkContainer>

              <NavLinkContainer>
                <NavLink to="/chat" onClick={() => setIsOpen(false)}>
                  <FaComments /> Chat
                  {unreadCount > 0 && <UnreadBadge>{unreadCount}</UnreadBadge>}
                </NavLink>
              </NavLinkContainer>

              <NavLinkContainer>
                <NavLink to="/notifications" onClick={() => setIsOpen(false)}>
                  <FaBell />
                  {unreadNotifications > 0 && <UnreadBadge>{unreadNotifications}</UnreadBadge>}
                </NavLink>
              </NavLinkContainer>

              <ProfileContainer ref={dropdownRef}>
                <ProfileButton onClick={toggleDropdown}>
                  <FaUser />
                  {username || 'Profile'}
                </ProfileButton>
                <DropdownMenu show={showDropdown}>
                  <DropdownItem onClick={() => handleDropdownClick('/profile')} isDesktop>
                    <FaUser /> Profile
                  </DropdownItem>
                  <DropdownItem onClick={handleLogout} isDesktop>
                    Sign Out
                  </DropdownItem>
                </DropdownMenu>
              </ProfileContainer>
            </>
          )}
        </NavLinks>
        {!isOpen && (
          <MenuButton onClick={() => setIsOpen(true)}>
            <FaBars />
          </MenuButton>
        )}
      </NavContainer>
    </Nav>
  );
};

export default Navbar;