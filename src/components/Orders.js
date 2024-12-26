import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc, addDoc, orderBy, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import Navbar from './Navbar';
import { toast } from 'react-toastify';
import ReviewDialog from './ReviewDialog';
import { FaStar, FaPlay, FaPause, FaPhoneAlt, FaEnvelope, FaUser, FaMapMarkerAlt } from 'react-icons/fa';

const OrdersContainer = styled.div`
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
`;

const OrderCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
`;

const OrderTitle = styled.h3`
  color: #333;
  margin: 0;
`;

const OrderStatus = styled.span`
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.9em;
  background-color: ${props => {
    switch(props.status) {
      case 'pending': return '#f8f9fa';
      case 'approved': return 'blueviolet';
      case 'declined': return '#dc3545';
      case 'completed': return '#32CD32';
      default: return '#f8f9fa';
    }
  }};
  color: ${props => props.status === 'pending' ? '#333' : 'white'};
  box-shadow: ${props => props.status === 'completed' ? '0 2px 8px rgba(50, 205, 50, 0.2)' : 'none'};
  background: ${props => props.status === 'completed' ? 
    'linear-gradient(135deg, #32CD32 0%, #228B22 100%)' : 
    props.status === 'pending' ? '#f8f9fa' :
    props.status === 'approved' ? 'blueviolet' :
    props.status === 'declined' ? '#dc3545' : '#f8f9fa'
  };
`;

const OrderDetails = styled.div`
  margin: 15px 0;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
  color: #666;
`;

const UserInfoSection = styled.div`
  margin: 15px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
`;

const UserInfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 0.9rem;

  svg {
    color: blueviolet;
  }
`;

const ActionButton = styled.button`
  padding: 8px 15px;
  margin: 0 5px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: ${props => {
    switch(props.action) {
      case 'approve': return 'blueviolet';
      case 'decline': return '#dc3545';
      case 'complete': return '#32CD32';
      default: return '#f8f9fa';
    }
  }};
  background: ${props => props.action === 'complete' ? 
    'linear-gradient(135deg, #32CD32 0%, #228B22 100%)' : 
    props.action === 'approve' ? 'blueviolet' :
    props.action === 'decline' ? '#dc3545' : '#f8f9fa'
  };
  color: white;
  transition: all 0.3s ease;
  box-shadow: ${props => props.action === 'complete' ? '0 2px 8px rgba(50, 205, 50, 0.2)' : 'none'};
  
  &:hover {
    opacity: 0.9;
    transform: ${props => props.action === 'complete' ? 'translateY(-2px)' : 'none'};
    box-shadow: ${props => props.action === 'complete' ? '0 4px 15px rgba(50, 205, 50, 0.3)' : 'none'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
`;

const ReviewButton = styled.button`
  padding: 10px 20px;
  margin: 0 5px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  background: linear-gradient(135deg, #8a2be2 0%, #6a0dad 100%);
  color: white;
  font-weight: 500;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
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
    font-size: 1.1rem;
  }
`;

const ClearAllButton = styled.button`
  padding: 10px 20px;
  margin-bottom: 20px;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(255, 68, 68, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(255, 68, 68, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const OrdersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const auth = getAuth();
  const db = getFirestore();
  const isOwner = auth.currentUser?.email === 'jaydevswebpannel@gmail.com';

  useEffect(() => {
    // Cleanup audio on component unmount
    return () => {
    };
  }, []);

  const handleStatusChange = async (orderId, userId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: newStatus,
        lastUpdated: serverTimestamp()
      });

      // Create notification for status change
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        userId: userId,
        type: 'ORDER_STATUS',
        orderId: orderId,
        status: newStatus,
        read: false,
        timestamp: serverTimestamp()
      });

      if (newStatus === 'completed') {
        // Update order to indicate it can be reviewed
        await updateDoc(orderRef, {
          canReview: true,
          reviewed: false
        });
      }

      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleReviewClick = (order) => {
    setSelectedOrder(order);
    setShowReviewDialog(true);
  };

  const clearAllOrders = async () => {
    if (!isOwner) return;
    
    try {
      setIsClearing(true);
      const ordersRef = collection(db, 'orders');
      const snapshot = await getDocs(ordersRef);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      toast.success('All orders cleared successfully');
    } catch (error) {
      console.error('Error clearing orders:', error);
      toast.error('Failed to clear orders');
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    let unsubscribe;

    const fetchOrders = async () => {
      if (!auth.currentUser) {
        console.log('No authenticated user');
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const ordersRef = collection(db, 'orders');
        let ordersQuery;

        if (isOwner) {
          console.log('Fetching all orders for owner');
          ordersQuery = query(
            ordersRef,
            orderBy('timestamp', 'desc')
          );
        } else {
          console.log('Fetching user specific orders');
          try {
            ordersQuery = query(
              ordersRef,
              where('userId', '==', auth.currentUser.uid),
              orderBy('timestamp', 'desc')
            );
          } catch (indexError) {
            console.log('Index not ready, falling back to simple query');
            ordersQuery = query(
              ordersRef,
              where('userId', '==', auth.currentUser.uid)
            );
          }
        }

        unsubscribe = onSnapshot(ordersQuery, 
          async (snapshot) => {
            console.log('Snapshot received, document count:', snapshot.size);
            
            const batch = writeBatch(db);
            let needsBatchCommit = false;
            
            let ordersList = snapshot.docs.map(doc => {
              const data = doc.data();
              console.log('Order data:', { id: doc.id, ...data });

              // Mark new orders as seen when owner views them
              if (isOwner && data.status === 'pending' && data.seen === false) {
                batch.update(doc.ref, { seen: true });
                needsBatchCommit = true;
              }

              return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate() || new Date(),
                status: data.status || 'pending',
                items: data.items || []
              };
            });

            if (needsBatchCommit) {
              await batch.commit();
            }

            // If we're using the fallback query, sort manually
            if (!ordersQuery._query.orderBy) {
              ordersList = ordersList.sort((a, b) => b.timestamp - a.timestamp);
            }

            console.log('Processed orders:', ordersList);
            setOrders(ordersList);
            setLoading(false);
          },
          (error) => {
            console.error('Error in orders snapshot:', error);
            if (error.message.includes('requires an index')) {
              setError('Please wait while we set up the database. This may take a few minutes.');
            } else {
              setError(error.message);
            }
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error setting up orders query:', error);
        if (error.message.includes('requires an index')) {
          setError('Please wait while we set up the database. This may take a few minutes.');
        } else {
          setError(error.message);
        }
        setLoading(false);
      }
    };

    fetchOrders();

    return () => {
      if (unsubscribe) {
        console.log('Cleaning up orders subscription');
        unsubscribe();
      }
    };
  }, [auth.currentUser, db, isOwner]);

  if (loading) {
    return (
      <>
        <Navbar />
        <OrdersContainer>
          <h2>Loading orders...</h2>
        </OrdersContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <OrdersContainer>
          <h2>Error loading orders</h2>
          <p>{error}</p>
        </OrdersContainer>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <OrdersContainer>
        <OrdersHeader>
          <h2>{isOwner ? 'All Orders' : 'Your Orders'}</h2>
          {isOwner && (
            <ClearAllButton 
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all orders? This action cannot be undone.')) {
                  clearAllOrders();
                }
              }}
              disabled={isClearing || orders.length === 0}
            >
              {isClearing ? 'Clearing...' : 'Clear All Orders'}
            </ClearAllButton>
          )}
        </OrdersHeader>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            {isOwner ? 'No orders yet' : 'You haven\'t placed any orders yet'}
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id}>
              <OrderHeader>
                <OrderTitle>Order #{order.id.slice(-6)}</OrderTitle>
                <OrderStatus status={order.status}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </OrderStatus>
              </OrderHeader>

              {isOwner && (
                <UserInfoSection>
                  <UserInfoItem>
                    <FaUser />
                    <span>{order.userName || 'No name provided'}</span>
                  </UserInfoItem>
                  <UserInfoItem>
                    <FaEnvelope />
                    <span>{order.userEmail}</span>
                  </UserInfoItem>
                  <UserInfoItem>
                    <FaPhoneAlt />
                    <span>{order.userPhone || 'No phone provided'}</span>
                  </UserInfoItem>
                  <UserInfoItem>
                    <FaMapMarkerAlt />
                    <span>{order.address}</span>
                  </UserInfoItem>
                </UserInfoSection>
              )}

              <OrderDetails>
                {order.items.map((item, index) => (
                  <OrderItem key={index}>
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </OrderItem>
                ))}
                <OrderItem style={{ fontWeight: 'bold', marginTop: '10px' }}>
                  <span>Total</span>
                  <span>₹{order.total}</span>
                </OrderItem>
              </OrderDetails>

              {isOwner ? (
                <ActionButtons>
                  {order.status === 'pending' && (
                    <>
                      <ActionButton
                        action="approve"
                        onClick={() => handleStatusChange(order.id, order.userId, 'approved')}
                      >
                        Approve
                      </ActionButton>
                      <ActionButton
                        action="decline"
                        onClick={() => handleStatusChange(order.id, order.userId, 'declined')}
                      >
                        Decline
                      </ActionButton>
                    </>
                  )}
                  {order.status === 'approved' && (
                    <ActionButton
                      action="complete"
                      onClick={() => handleStatusChange(order.id, order.userId, 'completed')}
                    >
                      Mark as Completed
                    </ActionButton>
                  )}
                </ActionButtons>
              ) : (
                <ActionButtons>
                  {!isOwner && (
                    <ActionButtons>
                      {order.status === 'completed' && !order.reviewed && (
                        <ReviewButton
                          onClick={() => handleReviewClick(order)}
                        >
                          <FaStar /> Rate Order
                        </ReviewButton>
                      )}
                    </ActionButtons>
                  )}
                </ActionButtons>
              )}
            </OrderCard>
          ))
        )}
      </OrdersContainer>

      {showReviewDialog && selectedOrder && (
        <ReviewDialog
          order={selectedOrder}
          onClose={() => {
            setShowReviewDialog(false);
            setSelectedOrder(null);
          }}
          onSubmit={async (rating, review) => {
            try {
              // Add review to reviews collection
              const reviewsRef = collection(db, 'reviews');
              await addDoc(reviewsRef, {
                orderId: selectedOrder.id,
                userId: auth.currentUser.uid,
                itemId: selectedOrder.items[0].id, // Assuming single item orders for now
                rating,
                review,
                userName: selectedOrder.userName,
                timestamp: serverTimestamp()
              });

              // Update order to mark as reviewed
              const orderRef = doc(db, 'orders', selectedOrder.id);
              await updateDoc(orderRef, {
                reviewed: true
              });

              toast.success('Thank you for your review!');
              setShowReviewDialog(false);
              setSelectedOrder(null);
            } catch (error) {
              console.error('Error submitting review:', error);
              toast.error('Failed to submit review. Please try again.');
            }
          }}
        />
      )}
    </>
  );
};

export default Orders;
