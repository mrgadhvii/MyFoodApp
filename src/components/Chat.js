import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
  arrayUnion,
  orderBy,
  startAt,
  endAt,
  limit,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { FaEllipsisV, FaThumbtack, FaTrash, FaBan, FaSearch, FaTimes, FaArrowLeft, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import ChatMessages from './ChatMessages';
import { format } from 'date-fns';

const ChatContainer = styled.div`
  display: flex;
  height: 100vh;
  background: #f0f2f5;
  @media (max-width: 768px) {
    flex-direction: column;
    height: calc(100vh - 60px); /* Adjust for mobile nav */
    margin-bottom: 60px;
  }
`;

const ChatListWrapper = styled.div`
  width: 350px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  @media (max-width: 768px) {
    width: 100%;
    height: 100%;
    display: ${props => props.hide ? 'none' : 'flex'};
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
  }
`;

const ChatHeader = styled.div`
  padding: 16px;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e0e0e0;
`;

const SearchBar = styled.div`
  padding: 12px;
  background: #f0f2f5;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 20px;
  background: white;
  outline: none;
  font-size: 15px;

  &::placeholder {
    color: #667781;
  }
`;

const ChatList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ChatItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  position: relative;
  background: ${props => props.active ? '#f0f2f5' : 'white'};
  border-bottom: 1px solid #f0f2f5;

  &:hover {
    background: #f5f6f6;
  }

  ${props => props.pinned && `
    background: #f0f8ff;
    &:hover {
      background: #e6f3ff;
    }
  `}
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #6c5ce7;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 12px;
  position: relative;
`;

const OnlineStatus = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #28a745;
  border: 2px solid white;
  position: absolute;
  bottom: 0;
  right: 0;
`;

const ChatInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChatName = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LastMessage = styled.div`
  color: #667781;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UnreadBadge = styled.div`
  background: #25d366;
  color: white;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-left: 8px;
  padding: 0 6px;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: #54656f;
  padding: 4px 8px;
  cursor: pointer;
  display: none;
  
  ${ChatItem}:hover & {
    display: block;
  }
`;

const MenuDropdown = styled.div`
  position: absolute;
  right: 16px;
  top: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 10;
`;

const MenuItem = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  &:hover {
    background: #f5f6f6;
  }
`;

const PinIcon = styled.span`
  margin-left: 8px;
`;

const MessageTime = styled.span`
  font-size: 12px;
  color: #667781;
  margin-left: 8px;
`;

const ChatMenu = styled.div`
  position: absolute;
  right: 16px;
  top: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 10;
`;

const DeleteButton = styled.button`
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.2s ease;
  opacity: 0;
  
  &:hover {
    background: #cc0000;
    transform: translateY(-50%) scale(1.1);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  ${ChatItem}:hover & {
    opacity: 1;
  }
`;

const ChatItemContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  
  &:hover ${DeleteButton} {
    opacity: 0.7;
  }
`;

const ChatItemWrapper = styled(ChatItem)`
  position: relative;
  padding-right: 50px;
`;

const CloseButton = styled.button`
  position: absolute;
  right: 20px;
  top: 20px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  font-size: 20px;
  z-index: 100;

  @media (max-width: 768px) {
    left: 20px;
    right: auto;
  }

  &:hover {
    color: #333;
  }
`;

const MessagesWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const SearchWrapper = styled.div`
  padding: 12px;
  background: #f0f2f5;
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.div`
  margin-left: 8px;
`;

const AddButton = styled.button`
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.2s ease;
  
  &:hover {
    background: #45a049;
    transform: translateY(-50%) scale(1.1);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }
`;

const RecommendedChatItem = styled(ChatItem)`
  position: relative;
  padding-right: 55px;  // Make room for the add button
`;

const SearchInstruction = styled.div`
  padding: 10px 15px;
  color: #6c5ce7;
  font-size: 0.9rem;
  text-align: center;
  background: #f8f7ff;
  border-bottom: 1px solid #e6e4ff;
`;

const ChatMessagesContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  @media (max-width: 768px) {
    width: 100%;
    height: ${props => props.showList ? '0' : '100%'};
    overflow: ${props => props.showList ? 'hidden' : 'auto'};
  }
`;

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [showRecommended, setShowRecommended] = useState(false);
  const [pinnedChats, setPinnedChats] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [usernames, setUsernames] = useState({});

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      setIsAdmin(userSnap.data()?.isAdmin || false);
    };
    checkAdminStatus();
  }, [auth.currentUser, db]);

  useEffect(() => {
    const initializeSupportChat = async () => {
      if (!auth.currentUser || isAdmin) return;

      const supportChatId = `support_${auth.currentUser.uid}`;
      const supportChatRef = doc(db, 'chats', supportChatId);
      const supportChatDoc = await getDoc(supportChatRef);

      if (!supportChatDoc.exists()) {
        await setDoc(supportChatRef, {
          users: [auth.currentUser.uid, 'jaydevswebpannel@gmail.com'],
          userEmail: 'jaydevswebpannel@gmail.com',
          userName: 'Support',
          lastMessage: 'Welcome! How can we help you?',
          lastMessageTime: serverTimestamp(),
          messages: [],
          unreadCount: {
            [auth.currentUser.uid]: 1,
            'jaydevswebpannel@gmail.com': 0
          },
          pinned: true
        });
      }
    };

    initializeSupportChat();
  }, [auth.currentUser, db, isAdmin]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchUsernames = async () => {
      const usersToFetch = new Set();
      chats.forEach(chat => {
        if (chat.users && Array.isArray(chat.users)) {
          chat.users.forEach(userId => {
            if (userId !== auth.currentUser.uid) {
              usersToFetch.add(userId);
            }
          });
        }
      });

      const usernamesData = {};
      for (const userId of usersToFetch) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            usernamesData[userId] = userData.username || userData.email?.split('@')[0] || 'User';
          }
        } catch (error) {
          console.error('Error fetching username:', error);
        }
      }
      setUsernames(usernamesData);
    };

    fetchUsernames();
  }, [chats, auth.currentUser, db]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchRecommendedUsers = async () => {
      try {
        console.log('Fetching recommended users...');
        if (!auth.currentUser) {
          console.log('No authenticated user');
          return;
        }

        const usersRef = collection(db, 'users');
        console.log('Current user:', auth.currentUser.uid);

        // Get all users except current user
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        
        // Map and filter users
        const users = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(user => user.id !== auth.currentUser.uid); // Filter out current user

        console.log('Found users:', users);

        // Filter out users who are already in chat list
        const filteredUsers = users.filter(user => {
          // Check if this user exists in any chat
          const isInChat = chats.some(chat => {
            const chatUsers = chat.users || [];
            return chatUsers.includes(user.id);
          });
          return !isInChat;
        });

        console.log('Filtered users:', filteredUsers);
        setRecommendedUsers(filteredUsers);

      } catch (error) {
        console.error('Error fetching recommended users:', error);
        toast.error('Failed to fetch recommended users');
      }
    };

    if (auth.currentUser) {
      console.log('Fetching recommended users due to chats/auth change');
      fetchRecommendedUsers();
    }
  }, [chats, auth.currentUser]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('users', 'array-contains', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        chatData.push({
          id: doc.id,
          ...data,
          unreadCount: data.unreadCount || {}
        });
      });
      setChats(chatData);
    });

    return () => unsubscribe();
  }, [auth.currentUser, db]);

  useEffect(() => {
    if (!searchQuery.trim() || !auth.currentUser) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      try {
        console.log('Searching for:', searchQuery);
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        
        const results = [];
        const searchLower = searchQuery.toLowerCase();
        
        querySnapshot.forEach((doc) => {
          // Skip current user
          if (doc.id === auth.currentUser.uid) return;
          
          const userData = doc.data();
          if (!userData || !userData.email) return;
          
          const username = (userData.username || '').toLowerCase();
          const email = userData.email.toLowerCase();
          
          if (username.includes(searchLower) || email.includes(searchLower)) {
            results.push({
              id: doc.id,
              username: userData.username || userData.email.split('@')[0],
              email: userData.email,
              photoURL: userData.photoURL || ''
            });
          }
        });

        console.log('Search results:', results);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Error searching users');
      }
    };

    const debounce = setTimeout(searchUsers, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery, auth.currentUser]);

  // Get other user's details from chat
  const getOtherUserDetails = (chat) => {
    if (!chat?.users || !chat?.userDetails || !auth.currentUser) return null;
    const otherUserId = chat.users.find(id => id !== auth.currentUser.uid);
    return otherUserId ? chat.userDetails[otherUserId] : null;
  };

  // Get other user's ID from chat
  const getOtherUserId = (chat) => {
    if (!chat?.users || !auth.currentUser) return null;
    return chat.users.find(id => id !== auth.currentUser.uid) || null;
  };

  // Format chat time
  const formatChatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Handle opening existing chat
  const handleChatClick = (chatId) => {
    console.log('Opening existing chat:', chatId);
    setSelectedChat(chatId);
    setShowMessages(true);
    clearUnreadCount(chatId);
  };

  // Create or open chat with user
  const createOrOpenChat = async (selectedUser, isRecommended = false) => {
    try {
      if (!auth.currentUser) {
        toast.error('Please sign in to start a chat');
        return;
      }

      const users = [auth.currentUser.uid, selectedUser.id].sort();
      const chatId = users.join('_');

      console.log('Starting chat with:', selectedUser.username);

      const chatDocRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatDocRef);

      if (!chatDoc.exists()) {
        console.log('Creating new chat');
        const timestamp = serverTimestamp();
        const newChat = {
          users: users,
          userDetails: {
            [auth.currentUser.uid]: {
              username: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
              photoURL: auth.currentUser.photoURL || '',
              email: auth.currentUser.email
            },
            [selectedUser.id]: {
              username: selectedUser.username,
              photoURL: selectedUser.photoURL || '',
              email: selectedUser.email
            }
          },
          messages: [],
          lastMessage: null,
          lastMessageTime: timestamp,
          createdAt: timestamp,
          unreadCount: {
            [auth.currentUser.uid]: 0,
            [selectedUser.id]: 0
          }
        };

        await setDoc(chatDocRef, newChat);
        console.log('New chat created:', chatId);

        // Add to local chats list
        const now = new Date();
        setChats(prevChats => {
          const localChat = {
            ...newChat,
            id: chatId,
            lastMessageTime: {
              toDate: () => now
            },
            createdAt: {
              toDate: () => now
            }
          };
          return [localChat, ...prevChats];
        });
      }

      // Clear search/recommended and show messages
      if (isRecommended) {
        setShowRecommended(false);
      } else {
        setSearchQuery('');
        setSearchResults([]);
      }
      
      setSelectedChat(chatId);
      setShowMessages(true);

      // Subscribe to chat updates
      const unsubscribe = onSnapshot(chatDocRef, (doc) => {
        if (doc.exists()) {
          const chatData = doc.data();
          setChats(prevChats => {
            const updatedChats = prevChats.map(c => 
              c.id === chatId ? { ...chatData, id: chatId } : c
            );
            if (!prevChats.find(c => c.id === chatId)) {
              updatedChats.unshift({ ...chatData, id: chatId });
            }
            return updatedChats;
          });
        }
      });

      // Clear unread count
      clearUnreadCount(chatId);

      return () => unsubscribe();

    } catch (error) {
      console.error('Error creating/opening chat:', error);
      toast.error('Failed to start chat. Please try again.');
    }
  };

  // Handle search result click
  const handleSearchResultClick = (user) => {
    createOrOpenChat(user, false);
  };

  // Handle recommended user click
  const handleRecommendedUserClick = async (user) => {
    try {
      console.log('Recommended user clicked:', user);
      
      if (!auth.currentUser) {
        toast.error('Please sign in to start a chat');
        return;
      }

      const users = [auth.currentUser.uid, user.id].sort();
      const chatId = users.join('_');

      console.log('Creating/opening chat:', chatId);

      // Check if chat exists
      const chatDocRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatDocRef);

      if (!chatDoc.exists()) {
        console.log('Creating new chat');
        const timestamp = serverTimestamp();
        const newChat = {
          users: users,
          userDetails: {
            [auth.currentUser.uid]: {
              username: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
              photoURL: auth.currentUser.photoURL || '',
              email: auth.currentUser.email
            },
            [user.id]: {
              username: user.username,
              photoURL: user.photoURL || '',
              email: user.email
            }
          },
          messages: [],
          lastMessage: null,
          lastMessageTime: timestamp,
          createdAt: timestamp,
          unreadCount: {
            [auth.currentUser.uid]: 0,
            [user.id]: 0
          }
        };

        // Create in Firestore
        await setDoc(chatDocRef, newChat);
        console.log('New chat created in Firestore');

        // Add to local chats list immediately
        const now = new Date();
        const localChat = {
          ...newChat,
          id: chatId,
          lastMessageTime: {
            toDate: () => now
          },
          createdAt: {
            toDate: () => now
          }
        };
        console.log('Adding to local chats:', localChat);
        setChats(prevChats => [localChat, ...prevChats]);
      } else {
        console.log('Chat already exists');
        const existingChatData = chatDoc.data();
        // Update local chats list with existing chat
        setChats(prevChats => {
          if (!prevChats.find(c => c.id === chatId)) {
            console.log('Adding existing chat to local list');
            return [{...existingChatData, id: chatId}, ...prevChats];
          }
          return prevChats;
        });
      }

      // Open chat
      console.log('Opening chat:', chatId);
      setSelectedChat(chatId);
      setShowMessages(true);
      setShowRecommended(false);

      // Set up real-time listener for chat updates
      console.log('Setting up chat listener');
      const unsubscribe = onSnapshot(chatDocRef, (doc) => {
        if (doc.exists()) {
          const chatData = doc.data();
          console.log('Received chat update:', chatData);
          setChats(prevChats => {
            const updatedChats = prevChats.map(c => 
              c.id === chatId ? { ...chatData, id: chatId } : c
            );
            if (!prevChats.find(c => c.id === chatId)) {
              console.log('Adding chat to local list from update');
              updatedChats.unshift({ ...chatData, id: chatId });
            }
            return updatedChats;
          });
        }
      });

      // Cleanup listener when component unmounts
      return () => {
        console.log('Cleaning up chat listener');
        unsubscribe();
      };

    } catch (error) {
      console.error('Error handling recommended user click:', error);
      toast.error('Failed to start chat. Please try again.');
    }
  };

  // Handle add recommended user click
  const handleAddRecommendedUser = async (e, user) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      console.log('Add button clicked for user:', user);

      if (!auth.currentUser) {
        toast.error('Please sign in to add user');
        return;
      }

      const users = [auth.currentUser.uid, user.id].sort();
      const chatId = users.join('_');

      // Check if chat already exists
      const chatDocRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatDocRef);

      if (chatDoc.exists()) {
        toast.info('Chat already exists!');
        setSelectedChat(chatId);
        setShowMessages(true);
        setShowRecommended(false);
        return;
      }

      // Create new chat
      console.log('Creating new chat with:', user.username);
      const timestamp = serverTimestamp();
      const newChat = {
        users: users,
        userDetails: {
          [auth.currentUser.uid]: {
            username: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
            photoURL: auth.currentUser.photoURL || '',
            email: auth.currentUser.email
          },
          [user.id]: {
            username: user.username,
            photoURL: user.photoURL || '',
            email: user.email
          }
        },
        messages: [],
        lastMessage: null,
        lastMessageTime: timestamp,
        createdAt: timestamp,
        unreadCount: {
          [auth.currentUser.uid]: 0,
          [user.id]: 0
        }
      };

      // Save to Firestore
      await setDoc(chatDocRef, newChat);
      console.log('Chat created in Firestore');

      // Add to local state
      const now = new Date();
      const localChat = {
        ...newChat,
        id: chatId,
        lastMessageTime: {
          toDate: () => now
        },
        createdAt: {
          toDate: () => now
        }
      };

      setChats(prevChats => [localChat, ...prevChats]);
      setSelectedChat(chatId);
      setShowMessages(true);
      setShowRecommended(false);
      toast.success(`Added ${user.username} to chat list!`);

    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user. Please try again.');
    }
  };

  // Handle delete chat
  const handleDeleteChat = async (e, chatId) => {
    try {
      e.preventDefault();
      e.stopPropagation();

      if (!auth.currentUser) {
        toast.error('Please sign in to delete chat');
        return;
      }

      const confirmed = window.confirm('Are you sure you want to delete this chat?');
      if (!confirmed) return;

      console.log('Deleting chat:', chatId);

      // Delete from Firestore
      const chatRef = doc(db, 'chats', chatId);
      await deleteDoc(chatRef);

      // Remove from local state
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));

      // If this was the selected chat, clear it
      if (selectedChat === chatId) {
        setSelectedChat(null);
        setShowMessages(false);
      }

      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat. Please try again.');
    }
  };

  // Render chat list
  const renderChatList = () => {
    if (!chats?.length) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          No chats yet
        </div>
      );
    }

    return chats.map(chat => {
      const otherUser = chat.users?.find(userId => userId !== auth.currentUser?.uid);
      const userDetails = chat.userDetails?.[otherUser] || {};
      const unreadCount = chat.unreadCount?.[auth.currentUser?.uid] || 0;

      return (
        <ChatItemWrapper
          key={chat.id}
          onClick={() => {
            setSelectedChat(chat.id);
            setShowMessages(true);
            clearUnreadCount(chat.id);
          }}
          className={selectedChat === chat.id ? 'selected' : ''}
        >
          <Avatar>
            {userDetails.photoURL ? (
              <img src={userDetails.photoURL} alt={userDetails.username} />
            ) : (
              (userDetails.username || userDetails.email || '?')[0].toUpperCase()
            )}
          </Avatar>
          <ChatInfo>
            <ChatName>
              {userDetails.username || userDetails.email?.split('@')[0] || 'Unknown User'}
            </ChatName>
            <LastMessage>
              {chat.lastMessage || 'No messages yet'}
              {chat.lastMessageTime && ` • ${formatChatTime(chat.lastMessageTime)}`}
            </LastMessage>
          </ChatInfo>
          {unreadCount > 0 && <UnreadBadge>{unreadCount}</UnreadBadge>}
          <DeleteButton
            onClick={(e) => handleDeleteChat(e, chat.id)}
            title="Delete chat"
          >
            <FaTrash size={12} />
          </DeleteButton>
        </ChatItemWrapper>
      );
    });
  };

  // Render search results
  const renderSearchResults = () => {
    if (searchResults.length === 0 && searchQuery.trim()) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          No users found
        </div>
      );
    }

    return searchResults.map(user => (
      <ChatItem
        key={user.id}
        onClick={() => handleSearchResultClick(user)}
      >
        <Avatar>
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.username} />
          ) : (
            (user.username || user.email || '?')[0].toUpperCase()
          )}
        </Avatar>
        <ChatInfo>
          <ChatName>
            {user.username || user.email.split('@')[0]}
          </ChatName>
          <LastMessage>
            {user.email}
          </LastMessage>
        </ChatInfo>
      </ChatItem>
    ));
  };

  // Render recommended users list
  const renderRecommendedUsers = () => {
    if (recommendedUsers.length === 0) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          No recommendations available
        </div>
      );
    }

    return (
      <>
        <div style={{ padding: '10px 20px', color: '#666', fontSize: '14px' }}>
          Recommended Users
        </div>
        {recommendedUsers.map(user => (
          <RecommendedChatItem
            key={user.id}
            onClick={() => {
              console.log('Viewing user profile:', user);
            }}
          >
            <Avatar>
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.username} />
              ) : (
                (user.username || user.email || '?')[0].toUpperCase()
              )}
            </Avatar>
            <ChatInfo>
              <ChatName>
                {user.username || user.email?.split('@')[0]}
              </ChatName>
              <LastMessage>
                {user.email || 'Recommended User'}
              </LastMessage>
            </ChatInfo>
            <AddButton
              onClick={(e) => handleAddRecommendedUser(e, user)}
              title="Add to chat list"
            >
              <FaPlus />
            </AddButton>
          </RecommendedChatItem>
        ))}
      </>
    );
  };

  const clearUnreadCount = async (chatId) => {
    if (!auth.currentUser || !chatId) return;
    
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`unreadCount.${auth.currentUser.uid}`]: 0
      });
    } catch (error) {
      console.error('Error clearing unread count:', error);
    }
  };

  const findExistingChat = async (userId1, userId2) => {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('users', 'array-contains', userId1)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.find(doc => {
        const chatData = doc.data();
        return chatData.users && chatData.users.includes(userId2);
      });
    } catch (error) {
      console.error('Error finding existing chat:', error);
      return null;
    }
  };

  const isUserOnline = (userId) => {
    if (!userId || !onlineUsers[userId]) return false;
    const lastSeen = onlineUsers[userId];
    if (!lastSeen) return false;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeen.toDate() > fiveMinutesAgo;
  };

  const togglePinChat = async (chatId) => {
    setPinnedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const blockUser = async (userId) => {
    setBlockedUsers(prev => [...prev, userId]);
    toast.success('User blocked successfully');
  };

  const handleLongPress = (chatId) => {
    const timer = setTimeout(() => {
      setMenuOpen(chatId);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleClose = () => {
    setShowMessages(false);
    setSelectedChat(null);
  };

  const handleSearchFocus = () => {
    setShowRecommended(true);
  };

  const handleSearchBlur = () => {
    if (!searchQuery) {
      setShowRecommended(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowRecommended(false);
    setSearchResults([]);
  };

  const totalUnreadCount = useMemo(() => {
    if (!auth.currentUser) return 0;
    
    return chats.reduce((total, chat) => {
      const unreadCount = chat.unreadCount?.[auth.currentUser?.uid] || 0;
      return total + unreadCount;
    }, 0);
  }, [chats, auth.currentUser]);

  useEffect(() => {
    if (typeof totalUnreadCount === 'number') {
      localStorage.setItem('totalUnreadCount', totalUnreadCount.toString());
      // Dispatch custom event for nav to update badge
      window.dispatchEvent(new CustomEvent('unreadCountUpdated', { 
        detail: { count: totalUnreadCount }
      }));
    }
  }, [totalUnreadCount]);

  const startChat = async (userId, username, photoURL) => {
    try {
      console.log('Starting chat with recommended user:', { userId, username, photoURL });
      
      if (!auth.currentUser) {
        console.log('No authenticated user');
        toast.error('Please sign in to start a chat');
        return;
      }

      const users = [auth.currentUser.uid, userId].sort();
      const chatId = users.join('_');
      console.log('Generated chatId:', chatId);

      // Check if chat exists
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      console.log('Existing chat found:', chatDoc.exists());

      if (!chatDoc.exists()) {
        console.log('Creating new chat document');
        const timestamp = serverTimestamp();
        const newChat = {
          users: users,
          userDetails: {
            [auth.currentUser.uid]: {
              username: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
              photoURL: auth.currentUser.photoURL || '',
              email: auth.currentUser.email
            },
            [userId]: {
              username: username,
              photoURL: photoURL || '',
              email: ''  // We might not have email for recommended users
            }
          },
          messages: [],
          lastMessage: null,
          lastMessageTime: timestamp,
          createdAt: timestamp,
          unreadCount: {
            [auth.currentUser.uid]: 0,
            [userId]: 0
          }
        };

        await setDoc(chatRef, newChat);
        console.log('New chat created successfully');

        // Add to local chats list
        const now = new Date();
        setChats(prevChats => {
          console.log('Updating local chats list');
          const localChat = {
            ...newChat,
            id: chatId,
            lastMessageTime: {
              toDate: () => now
            },
            createdAt: {
              toDate: () => now
            }
          };
          return [localChat, ...prevChats];
        });
      }

      console.log('Opening chat:', chatId);
      setSelectedChat(chatId);
      setShowMessages(true);
      setShowRecommended(false);

      // Subscribe to chat updates
      console.log('Setting up real-time listener');
      const unsubscribe = onSnapshot(chatRef, (doc) => {
        if (doc.exists()) {
          console.log('Received chat update:', doc.data());
          const chatData = doc.data();
          setChats(prevChats => {
            const updatedChats = prevChats.map(c => 
              c.id === chatId ? { ...chatData, id: chatId } : c
            );
            if (!prevChats.find(c => c.id === chatId)) {
              updatedChats.unshift({ ...chatData, id: chatId });
            }
            return updatedChats;
          });
        }
      });

      // Clear unread count
      clearUnreadCount(chatId);
      console.log('Chat setup complete');

      return () => {
        console.log('Cleaning up chat listener');
        unsubscribe();
      };

    } catch (error) {
      console.error('Error in startChat:', error);
      toast.error('Failed to start chat. Please try again.');
    }
  };

  return (
    <ChatContainer>
      <ChatListWrapper style={{ display: showMessages ? 'none' : 'block' }}>
        <ChatHeader>
          <Avatar>
            {auth.currentUser?.email[0].toUpperCase()}
          </Avatar>
        </ChatHeader>
        
        <SearchInstruction>
          Search @MrGadhvii for chat with owner
        </SearchInstruction>
        
        <SearchWrapper>
          <SearchInput
            type="text"
            placeholder="Search users by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
          {(searchQuery || showRecommended) && (
            <SearchIcon onClick={clearSearch} style={{ cursor: 'pointer' }}>
              <FaTimes />
            </SearchIcon>
          )}
          {!searchQuery && !showRecommended && (
            <SearchIcon>
              <FaSearch />
            </SearchIcon>
          )}
        </SearchWrapper>

        <ChatList>
          {(searchQuery || showRecommended) ? (
            <div>
              {searchQuery ? (
                renderSearchResults()
              ) : (
                renderRecommendedUsers()
              )}
            </div>
          ) : (
            renderChatList()
          )}
        </ChatList>
      </ChatListWrapper>

      {showMessages && selectedChat && (
        <ChatMessagesContainer showList={showMessages}>
          <ChatHeader>
            <CloseButton onClick={handleClose} title="Back to chat list">
              <FaArrowLeft />
            </CloseButton>
            {selectedChat && (
              <div style={{ textAlign: 'center' }}>
                <h3>{usernames[getOtherUserId(chats.find(c => c.id === selectedChat))] || 'Chat'}</h3>
              </div>
            )}
          </ChatHeader>
          <ChatMessages chatId={selectedChat} />
        </ChatMessagesContainer>
      )}
    </ChatContainer>
  );
};

export default Chat;
