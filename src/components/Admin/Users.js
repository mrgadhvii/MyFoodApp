import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { FaSearch, FaFilter } from 'react-icons/fa';

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
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  padding: 8px 15px;
  flex: 1;

  input {
    border: none;
    outline: none;
    width: 100%;
    margin-left: 10px;
    font-size: 0.9rem;
  }
`;

const FilterSelect = styled.select`
  padding: 8px 15px;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  background: white;
  color: #2d3436;
  font-size: 0.9rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #6c5ce7;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const Th = styled.th`
  text-align: left;
  padding: 15px;
  background: #f8f9fa;
  color: #2d3436;
  font-weight: 600;
  font-size: 0.9rem;
`;

const Td = styled.td`
  padding: 15px;
  border-top: 1px solid #f1f2f6;
  color: #636e72;
  font-size: 0.9rem;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${props => props.active ? '#e3ffe3' : '#ffe3e3'};
  color: ${props => props.active ? '#1db954' : '#ff4757'};
`;

const ActionButton = styled.button`
  background: ${props => props.active ? '#ffe3e3' : '#e3ffe3'};
  color: ${props => props.active ? '#ff4757' : '#1db954'};
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 40px;
  color: #636e72;
  font-size: 1rem;
`;

const USER_FILTERS = [
  { value: 'all', label: 'All Users' },
  { value: 'active', label: 'Active Users' },
  { value: 'inactive', label: 'Inactive Users' },
  { value: 'recent', label: 'Recent Users' }
];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? new Date(doc.data().createdAt.seconds * 1000) : new Date()
      }));
      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        active: !currentStatus
      });
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, active: !currentStatus }
          : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filterUsers = (users) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return users.filter(user => {
      const matchesSearch = 
        (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.phone || '').includes(searchTerm);

      switch (filter) {
        case 'active':
          return matchesSearch && user.active;
        case 'inactive':
          return matchesSearch && !user.active;
        case 'recent':
          return matchesSearch && user.createdAt >= oneWeekAgo;
        default:
          return matchesSearch;
      }
    });
  };

  const filteredUsers = filterUsers(users);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Header>
        <h1>User Management</h1>
      </Header>

      <Controls>
        <SearchBar>
          <FaSearch color="#636e72" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBar>

        <FilterSelect
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {USER_FILTERS.map(filter => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </FilterSelect>
      </Controls>

      {filteredUsers.length > 0 ? (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Joined On</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <Td>{user.name || 'N/A'}</Td>
                <Td>{user.email}</Td>
                <Td>{user.phone || 'N/A'}</Td>
                <Td>{formatDate(user.createdAt)}</Td>
                <Td>
                  <StatusBadge active={user.active}>
                    {user.active ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </Td>
                <Td>
                  <ActionButton
                    active={user.active}
                    onClick={() => toggleUserStatus(user.id, user.active)}
                  >
                    {user.active ? 'Deactivate' : 'Activate'}
                  </ActionButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <NoResults>
          No users found matching your search criteria
        </NoResults>
      )}
    </Container>
  );
};

export default Users;
