import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import Navbar from './Navbar';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const NotificationsContainer = styled.div`
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
`;

const NotificationCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-left: 4px solid ${props => {
    switch(props.status) {
      case 'approved': return 'blueviolet';
      case 'declined': return '#dc3545';
      case 'completed': return '#6a0dad';
      default: return '#f8f9fa';
    }
  }};
  opacity: ${props => props.read ? 0.7 : 1};
  transition: opacity 0.3s ease;
`;

const NotificationTitle = styled.h3`
  color: #333;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NotificationTime = styled.span`
  color: #666;
  font-size: 0.9em;
`;

const NotificationMessage = styled.p`
  color: #666;
  margin: 10px 0;
`;

const NoNotifications = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  background-color: ${props => {
    switch(props.status) {
      case 'approved': return 'blueviolet';
      case 'declined': return '#dc3545';
      case 'completed': return '#6a0dad';
      default: return '#f8f9fa';
    }
  }};
  color: white;
  margin-left: 10px;
`;

const ClearAllButton = styled.button`
  background-color: blueviolet;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 20px;
  
  &:hover {
    background-color: #6a0dad;
  }
`;

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    if (!auth.currentUser) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const notificationsList = [];
      const batch = writeBatch(db);
      let needsBatchCommit = false;

      snapshot.forEach((doc) => {
        const notification = { id: doc.id, ...doc.data() };
        notificationsList.push(notification);
        
        // Mark as read when viewed
        if (!notification.read) {
          batch.update(doc.ref, { read: true });
          needsBatchCommit = true;
        }
      });

      if (needsBatchCommit) {
        await batch.commit();
      }

      setNotifications(notificationsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser, db]);

  const clearAllNotifications = async () => {
    if (!auth.currentUser) return;

    try {
      const batch = writeBatch(db);
      notifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.delete(notificationRef);
      });
      await batch.commit();
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'approved': return 'Approved';
      case 'declined': return 'Declined';
      case 'completed': return 'Completed';
      default: return 'Pending';
    }
  };

  return (
    <>
      <Navbar />
      <NotificationsContainer>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Notifications</h2>
          {notifications.length > 0 && (
            <ClearAllButton onClick={clearAllNotifications}>
              Clear All
            </ClearAllButton>
          )}
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            Loading notifications...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#dc3545' }}>
            Error: {error}
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationCard 
              key={notification.id} 
              status={notification.status}
              read={notification.read}
            >
              <NotificationTitle>
                <div>
                  Order #{notification.orderId?.slice(-6)}
                  <StatusBadge status={notification.status}>
                    {getStatusText(notification.status)}
                  </StatusBadge>
                </div>
                <NotificationTime>
                  {format(notification.timestamp?.toDate(), 'MMM dd, yyyy HH:mm')}
                </NotificationTime>
              </NotificationTitle>
              <NotificationMessage>{notification.message}</NotificationMessage>
            </NotificationCard>
          ))
        ) : (
          <NoNotifications>
            <p>No notifications yet</p>
          </NoNotifications>
        )}
      </NotificationsContainer>
    </>
  );
};

export default Notifications;
