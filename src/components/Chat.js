import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, updateDoc, doc, writeBatch, setDoc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { FaCheck, FaCheckDouble, FaCheckCircle } from 'react-icons/fa';
import Navbar from './Navbar';
import ChatMessages from './ChatMessages';

const ChatContainer = styled.div`
  display: flex;
  height: calc(100vh - 60px);
  background: #f5f5f5;
`;

const ChatList = styled.div`
  width: 300px;
  min-width: 300px;
  background: white;
  border-right: 1px solid #ddd;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ChatItem = styled.div`
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: background 0.2s;
  background: ${props => props.active ? '#f0f0f0' : 'white'};

  &:hover {
    background: #f5f5f5;
  }
`;

const Avatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #6c757d;
  position: relative;
`;

const OnlineStatus = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.isOnline ? '#28a745' : '#dc3545'};
  position: absolute;
  bottom: 2px;
  right: 2px;
  border: 2px solid white;
`;

const OnlineStatusText = styled.span`
  font-size: 12px;
  color: ${props => props.isOnline ? '#28a745' : '#6c757d'};
  margin-left: 5px;
`;

const ChatInfo = styled.div`
  flex: 1;
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const ChatName = styled.div`
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const ChatTime = styled.div`
  font-size: 0.8rem;
  color: #6c757d;
`;

const LastMessage = styled.div`
  color: #666;
  font-size: 0.9rem;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MessagePreview = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
`;

const MessageStatus = styled.span`
  color: ${props => props.isRead ? '#34b7f1' : '#6c757d'};
  font-size: 1rem;
`;

const UnreadBadge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  background: ${props => props.color || '#dc3545'};
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  min-width: 20px;
  text-align: center;
`;

const NoChats = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
  text-align: center;
  padding: 20px;
`;

const StartChatButton = styled.button`
  margin-top: 15px;
  padding: 10px 20px;
  background: blueviolet;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background: #6a0dad;
  }
`;

const ClearButton = styled.button`
  background: transparent;
  border: 1px solid #dc3545;
  color: #dc3545;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 10px;
  
  &:hover {
    background: rgba(220, 53, 69, 0.1);
  }
`;

const VerifiedBadge = styled(FaCheckCircle)`
  color: #1da1f2;
  font-size: 1.2rem;
`;

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedChatData, setSelectedChatData] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const auth = getAuth();
  const db = getFirestore();
  console.log('Current user email:', auth.currentUser?.email);
  const isOwner = auth.currentUser?.email === 'jaydevswebpannel@gmail.com';
  console.log('Is owner:', isOwner);

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('No user logged in');
      return;
    }

    const chatsRef = collection(db, 'chats');
    console.log('Fetching chats for user:', auth.currentUser.email);
    
    const q = isOwner
      ? query(chatsRef, orderBy('lastMessageTime', 'desc'))
      : query(
          chatsRef,
          where('userId', '==', auth.currentUser.uid),
          orderBy('lastMessageTime', 'desc')
        );

    console.log('Is owner query:', isOwner);
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('Number of chats found:', snapshot.docs.length);
      const chatsList = [];
      
      for (const doc of snapshot.docs) {
        const chat = doc.data();
        console.log('Chat data:', chat);
        const messagesRef = collection(db, 'chats', doc.id, 'messages');
        const unreadQuery = query(
          messagesRef,
          where('read', '==', false),
          where('senderId', '!=', auth.currentUser.uid)
        );
        
        const unreadSnapshot = await getDocs(unreadQuery);
        const unreadCount = unreadSnapshot.size;
        
        chatsList.push({
          id: doc.id,
          ...chat,
          unreadCount
        });
      }
      
      setChats(chatsList);
    });

    return () => unsubscribe();
  }, [auth.currentUser, db, isOwner]);

  useEffect(() => {
    // Listen for online status
    const onlineRef = collection(db, 'online_status');
    const unsubscribeOnline = onSnapshot(onlineRef, (snapshot) => {
      const onlineStatus = {};
      snapshot.forEach((doc) => {
        onlineStatus[doc.id] = doc.data().lastSeen;
      });
      setOnlineUsers(onlineStatus);
    });

    // Update user's online status
    const updateOnlineStatus = async () => {
      if (auth.currentUser) {
        const userStatusRef = doc(db, 'online_status', auth.currentUser.uid);
        try {
          // Try to get the document first
          const docSnap = await getDoc(userStatusRef);
          
          if (!docSnap.exists()) {
            // If document doesn't exist, create it
            await setDoc(userStatusRef, {
              lastSeen: serverTimestamp(),
              online: true,
              userId: auth.currentUser.uid,
              email: auth.currentUser.email
            });
          } else {
            // If document exists, update it
            await updateDoc(userStatusRef, {
              lastSeen: serverTimestamp(),
              online: true
            });
          }
        } catch (error) {
          console.error('Error updating online status:', error);
        }
      }
    };

    const interval = setInterval(updateOnlineStatus, 30000);
    updateOnlineStatus();

    return () => {
      clearInterval(interval);
      unsubscribeOnline();
    };
  }, [db, auth.currentUser]);

  const handleChatClick = async (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    setSelectedChat(chatId);
    setSelectedChatData({
      id: chatId,
      recipientEmail: isOwner ? (chat.userName || chat.userEmail) : 'MrGadhvii Support',
      recipientId: isOwner ? chat.userId : 'owner'
    });
    setShowMessages(true);

    // Mark messages as read
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const unreadQuery = query(
      messagesRef,
      where('read', '==', false),
      where('senderId', '!=', auth.currentUser.uid)
    );
    
    const unreadSnapshot = await getDocs(unreadQuery);
    const batch = writeBatch(db);
    
    unreadSnapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();

    // Update chat unread count
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      unreadCount: 0
    });
  };

  const isUserOnline = (userId) => {
    if (!onlineUsers[userId]) return false;
    const lastSeen = onlineUsers[userId].toDate();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeen > fiveMinutesAgo;
  };

  const startNewChat = async () => {
    if (isOwner) return;

    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('userId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      let chatId;
      if (querySnapshot.empty) {
        const newChatRef = await addDoc(chatsRef, {
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email,
          userName: auth.currentUser.displayName || 'Anonymous User',
          lastMessageTime: serverTimestamp(),
          unreadCount: 0,
          lastMessageRead: null,
        });
        chatId = newChatRef.id;
      } else {
        chatId = querySnapshot.docs[0].id;
      }

      setSelectedChat(chatId);
      setSelectedChatData({
        id: chatId,
        recipientEmail: 'MrGadhvii Support'
      });
      setShowMessages(true);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat. Please try again.');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const clearChat = async (chatId, e) => {
    e.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to clear this chat?');
    if (!confirmed) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        messages: [],
        lastMessage: null,
        lastMessageTime: serverTimestamp()
      });
      toast.success('Chat cleared successfully');
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat');
    }
  };

  const renderOnlineStatus = (userId, inChatBox = false) => {
    const isOnline = isUserOnline(userId);
    if (inChatBox) {
      return <OnlineStatusText isOnline={isOnline}>
        {isOnline ? 'Online' : 'Offline'}
      </OnlineStatusText>;
    }
    return <OnlineStatus isOnline={isOnline} />;
  };

  const renderUnreadBadge = (chat) => {
    if (!chat) return null;
    const unreadCount = chat.unreadCount || 0;
    return unreadCount > 0 ? (
      <UnreadBadge color="#dc3545">{unreadCount}</UnreadBadge>
    ) : null;
  };

  if (!auth.currentUser) {
    return <div>Please login to access chat</div>;
  }

  return (
    <>
      <Navbar />
      <ChatContainer>
        <ChatList>
          {isOwner ? (
            chats.length > 0 ? (
              chats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  active={selectedChat === chat.id}
                  onClick={() => handleChatClick(chat.id)}
                >
                  <Avatar>
                    {getInitials(chat.userName || chat.userEmail)}
                    {renderOnlineStatus(chat.userId)}
                  </Avatar>
                  <ChatInfo>
                    <ChatName>
                      {chat.userName || chat.userEmail}
                    </ChatName>
                    <LastMessage>
                      {chat.lastMessage || 'No messages yet'}
                      {renderUnreadBadge(chat)}
                    </LastMessage>
                  </ChatInfo>
                </ChatItem>
              ))
            ) : (
              <NoChats>No customer chats yet</NoChats>
            )
          ) : (
            <ChatItem
              active={selectedChat !== null}
              onClick={() => {
                if (!selectedChat) {
                  startNewChat();
                }
              }}
            >
              <Avatar>
                MG
                <OnlineStatus isOnline={true} />
              </Avatar>
              <ChatInfo>
                <ChatName>
                  MrGadhvii Support <VerifiedBadge />
                </ChatName>
                <LastMessage>
                  {chats[0]?.lastMessage || 'Click to chat with support'}
                  {renderUnreadBadge(chats[0])}
                </LastMessage>
              </ChatInfo>
            </ChatItem>
          )}
        </ChatList>

        {showMessages && selectedChatData && (
          <ChatMessages 
            chatId={selectedChatData.id}
            recipientInfo={{
              name: selectedChatData.recipientName,
              email: selectedChatData.recipientEmail,
              online: isUserOnline(selectedChatData.recipientId)
            }}
            onClose={() => {
              setShowMessages(false);
              setSelectedChatData(null);
            }}
          />
        )}
      </ChatContainer>
    </>
  );
};

export default Chat;
