import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSearch } from 'react-icons/fa';
import { getFirestore, collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';

const db = getFirestore();

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 30px;
  h1 {
    color: #2d3436;
    font-size: 2rem;
    margin-bottom: 10px;
    font-weight: 700;
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  padding: 8px 15px;
  margin-bottom: 20px;

  input {
    border: none;
    outline: none;
    width: 100%;
    margin-left: 10px;
    font-size: 0.9rem;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  th, td {
    padding: 15px;
    text-align: left;
    border-bottom: 1px solid #f1f2f6;
  }

  th {
    background: #f8f9fa;
    color: #2d3436;
    font-weight: 600;
    font-size: 0.9rem;
  }

  td {
    color: #636e72;
    font-size: 0.9rem;
  }

  tbody tr:hover {
    background: #f8f9fa;
  }
`;

const StatusBadge = styled.span`
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'completed': return '#e3fcef';
      case 'pending': return '#fff3e0';
      case 'cancelled': return '#ffe0e0';
      default: return '#f1f2f6';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'completed': return '#1bc5bd';
      case 'pending': return '#ff9800';
      case 'cancelled': return '#f44336';
      default: return '#636e72';
    }
  }};
`;

const ActionButton = styled.button`
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  background: ${props => props.variant === 'complete' ? '#1bc5bd' : '#ff6b6b'};
  color: white;
  cursor: pointer;
  margin-right: 5px;
  font-size: 0.8rem;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const ordersQuery = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(ordersQuery);
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Header>
        <h1>Order Management</h1>
      </Header>

      <SearchBar>
        <FaSearch color="#636e72" />
        <input
          type="text"
          placeholder="Search orders by ID, customer name, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchBar>

      <Table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(order => (
            <tr key={order.id}>
              <td>#{order.id.slice(0, 8)}</td>
              <td>{order.customerName || 'N/A'}</td>
              <td>{order.items?.length || 0} items</td>
              <td>{formatCurrency(order.total || 0)}</td>
              <td>
                <StatusBadge status={order.status}>
                  {order.status}
                </StatusBadge>
              </td>
              <td>{order.timestamp?.toDate().toLocaleDateString()}</td>
              <td>
                {order.status === 'pending' && (
                  <>
                    <ActionButton
                      variant="complete"
                      onClick={() => handleStatusUpdate(order.id, 'completed')}
                    >
                      Complete
                    </ActionButton>
                    <ActionButton
                      variant="cancel"
                      onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                    >
                      Cancel
                    </ActionButton>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default Orders;
