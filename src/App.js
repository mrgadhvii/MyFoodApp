import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import AddPhone from './components/Auth/AddPhone';
import Home from './components/Home';
import Cart from './components/Cart';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Orders from './components/Orders';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';
import Notifications from './components/Notifications';
import Reviews from './components/Reviews';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  body {
    background-color: #f5f5f5;
  }
`;

const AppContainer = styled.div`
  font-family: 'Poppins', sans-serif;
  min-height: 100vh;
`;

const ToastContainerStyled = styled(ToastContainer)`
  &&&.Toastify__toast-container {
    @media (max-width: 768px) {
      width: 90%;
      left: 50%;
      transform: translateX(-50%);
      bottom: 70px;
      top: auto !important;
      right: auto !important;
    }
  }
  
  .Toastify__toast {
    border-radius: 8px;
    font-size: 14px;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    
    @media (max-width: 768px) {
      margin-bottom: 4px;
      border-radius: 25px;
      font-size: 13px;
    }
  }

  .Toastify__toast-body {
    padding: 8px 4px;
    font-weight: 500;
  }

  .Toastify__toast-icon {
    margin-right: 12px;
  }

  .Toastify__progress-bar {
    height: 3px;
  }
`;

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <Router>
      <div className="App">
        <GlobalStyle />
        <ToastContainerStyled
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover={false}
          theme="colored"
          limit={3}
        />
        <AppContainer>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/add-phone" element={<AddPhone />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/reviews" element={<Reviews />} />
          </Routes>
        </AppContainer>
      </div>
    </Router>
  );
}

export default App;
