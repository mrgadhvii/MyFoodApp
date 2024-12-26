import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaHome, FaClipboardList, FaHamburger, FaUsers, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { getAuth, signOut } from 'firebase/auth';

const auth = getAuth();

const NavContainer = styled.div`
  background: white;
  padding: 15px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #6c5ce7;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 10px;

  @media (max-width: 768px) {
    gap: 5px;
  }
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: ${props => props.active ? '#6c5ce7' : '#636e72'};
  padding: 8px 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  background: ${props => props.active ? '#f8f7ff' : 'transparent'};
  transition: all 0.2s ease;

  &:hover {
    background: #f8f7ff;
    color: #6c5ce7;
  }

  svg {
    font-size: 1.1rem;
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    
    span {
      display: none;
    }
  }
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: #636e72;
  padding: 8px 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #fff5f5;
    color: #e74c3c;
  }

  svg {
    font-size: 1.1rem;
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    span {
      display: none;
    }
  }
`;

const AdminNav = () => {
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <NavContainer>
      <NavContent>
        <Logo>Admin Panel</Logo>
        <NavLinks>
          <NavLink to="/admin" active={location.pathname === '/admin' ? 1 : 0}>
            <FaHome />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/orders" active={location.pathname === '/admin/orders' ? 1 : 0}>
            <FaClipboardList />
            <span>Orders</span>
          </NavLink>
          <NavLink to="/admin/products" active={location.pathname === '/admin/products' ? 1 : 0}>
            <FaHamburger />
            <span>Products</span>
          </NavLink>
          <NavLink to="/admin/users" active={location.pathname === '/admin/users' ? 1 : 0}>
            <FaUsers />
            <span>Users</span>
          </NavLink>
          <NavLink to="/admin/settings" active={location.pathname === '/admin/settings' ? 1 : 0}>
            <FaCog />
            <span>Settings</span>
          </NavLink>
          <LogoutButton onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </LogoutButton>
        </NavLinks>
      </NavContent>
    </NavContainer>
  );
};

export default AdminNav;
