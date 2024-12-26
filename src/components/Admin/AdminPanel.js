import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaUsers, FaClipboardList, FaHamburger, FaChartBar, FaSearch } from 'react-icons/fa';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';

const auth = getAuth();
const db = getFirestore();

const AdminContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 30px;
  h1 {
    color: #2d3436;
    font-size: 2rem;
    margin-bottom: 10px;
    font-weight: 700;
  }
  p {
    color: #636e72;
    font-size: 1.1rem;
  }
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const DashboardCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
  }

  .icon {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
    background: ${props => props.iconBg || '#6c5ce7'};
  }

  .content {
    h3 {
      font-size: 1.8rem;
      color: #2d3436;
      margin: 0;
      font-weight: 700;
    }
    p {
      color: #636e72;
      margin: 5px 0 0 0;
      font-size: 0.9rem;
    }
  }
`;

const RecentSection = styled.div`
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;

  h2 {
    color: #2d3436;
    font-size: 1.3rem;
    margin: 0 0 20px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
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

  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #f1f2f6;
  }

  th {
    color: #2d3436;
    font-weight: 600;
    font-size: 0.9rem;
    background: #f8f9fa;
  }

  tr:hover {
    background: #f8f9fa;
  }

  td {
    color: #636e72;
    font-size: 0.9rem;
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

const AdminPanel = () => {
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    products: 0,
    revenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const productsSnapshot = await getDocs(collection(db, 'products'));

        let totalRevenue = 0;
        ordersSnapshot.forEach(doc => {
          const orderData = doc.data();
          if (orderData.status === 'completed') {
            totalRevenue += orderData.total || 0;
          }
        });

        setStats({
          users: usersSnapshot.size,
          orders: ordersSnapshot.size,
          products: productsSnapshot.size,
          revenue: totalRevenue
        });

        // Fetch recent orders
        const recentOrdersQuery = query(
          collection(db, 'orders'),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
        const recentOrdersData = recentOrdersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentOrders(recentOrdersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredOrders = recentOrders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <AdminContainer>
      <Header>
        <h1>Dashboard Overview</h1>
        <p>Welcome to your admin dashboard</p>
      </Header>

      <DashboardGrid>
        <DashboardCard iconBg="#6c5ce7">
          <div className="icon">
            <FaUsers />
          </div>
          <div className="content">
            <h3>{stats.users}</h3>
            <p>Total Users</p>
          </div>
        </DashboardCard>

        <DashboardCard iconBg="#00b894">
          <div className="icon">
            <FaClipboardList />
          </div>
          <div className="content">
            <h3>{stats.orders}</h3>
            <p>Total Orders</p>
          </div>
        </DashboardCard>

        <DashboardCard iconBg="#ffa502">
          <div className="icon">
            <FaHamburger />
          </div>
          <div className="content">
            <h3>{stats.products}</h3>
            <p>Total Products</p>
          </div>
        </DashboardCard>

        <DashboardCard iconBg="#ff7675">
          <div className="icon">
            <FaChartBar />
          </div>
          <div className="content">
            <h3>{formatCurrency(stats.revenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </DashboardCard>
      </DashboardGrid>

      <RecentSection>
        <h2>Recent Orders</h2>
        <SearchBar>
          <FaSearch color="#636e72" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={handleSearch}
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
              </tr>
            ))}
          </tbody>
        </Table>
      </RecentSection>
    </AdminContainer>
  );
};

export default AdminPanel;
