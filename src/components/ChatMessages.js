import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
  getDoc,
  setDoc,
  writeBatch,
  increment
} from 'firebase/firestore';
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa';
import { format } from 'date-fns';

const MessagesContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  position: relative;
  
  @media (max-width: 768px) {
    width: 100%;
    height: 100vh;
  }
`;

const MessagesHeader = styled.div`
  padding: 16px;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e0e0e0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #54656f;
  cursor: pointer;
  padding: 8px;
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MessagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
`;

const MessageBubble = styled.div`
  max-width: 65%;
  padding: 8px 12px;
  border-radius: 8px;
  position: relative;
  word-wrap: break-word;
  
  ${props => props.sent ? `
    background: #dcf8c6;
    align-self: flex-end;
    border-top-right-radius: 0;
  ` : `
    background: white;
    align-self: flex-start;
    border-top-left-radius: 0;
  `}
`;

const MessageTime = styled.span`
  font-size: 11px;
  color: #667781;
  float: right;
  margin-left: 8px;
  margin-top: 2px;
`;

const MessageStatus = styled.span`
  font-size: 12px;
  color: ${props => props.isRead ? '#34b7f1' : '#aaa'};
  margin-left: 4px;
`;

const InputContainer = styled.div`
  padding: 16px;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 24px;
  outline: none;
  font-size: 15px;
  background: white;
  
  &::placeholder {
    color: #667781;
  }
`;

const SendButton = styled.button`
  background: none;
  border: none;
  color: #54656f;
  cursor: pointer;
  padding: 8px;
  
  &:disabled {
    color: #b3b3b3;
    cursor: not-allowed;
  }
`;

const formatMessageTime = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return '';
  try {
    return format(timestamp.toDate(), 'HH:mm');
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

const Message = ({ message, isOwnMessage }) => {
  const [isRead, setIsRead] = useState(false);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    if (!isOwnMessage || !message?.id || !message?.receiverId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'chats', message.chatId, 'messages', message.id), 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setIsRead(data.readBy?.includes(message.receiverId) || false);
        }
      }
    );

    return () => unsubscribe();
  }, [message?.id, message?.receiverId, isOwnMessage, db]);

  return (
    <MessageBubble sent={isOwnMessage}>
      {message.text}
      <MessageTime>
        {formatMessageTime(message.timestamp)}
        {isOwnMessage && (
          <MessageStatus isRead={isRead}>
            {isRead ? '✓✓' : '✓'}
          </MessageStatus>
        )}
      </MessageTime>
    </MessageBubble>
  );
};

const ChatMessages = ({ chatId, onBack, showBackButton = true, isBlocked }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUserId, setOtherUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    if (!chatId || !auth.currentUser) return;

    const [user1, user2] = chatId.split('_');
    const otherId = user1 === auth.currentUser.uid ? user2 : user1;
    setOtherUserId(otherId);
  }, [chatId, auth.currentUser]);

  useEffect(() => {
    if (!chatId || !auth.currentUser || !otherUserId) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const newMessages = [];
      const batch = writeBatch(db);
      let unreadCount = 0;

      snapshot.docs.forEach(doc => {
        const messageData = doc.data();
        const timestamp = messageData.timestamp || serverTimestamp();
        
        if (!messageData.readBy?.includes(auth.currentUser.uid) && 
            messageData.senderId !== auth.currentUser.uid) {
          batch.update(doc.ref, {
            readBy: arrayUnion(auth.currentUser.uid)
          });
          unreadCount++;
        }
        newMessages.push({
          id: doc.id,
          chatId,
          ...messageData,
          timestamp,
          receiverId: messageData.senderId === auth.currentUser.uid ? otherUserId : auth.currentUser.uid
        });
      });

      // Update unread count in chat document
      if (unreadCount > 0) {
        const chatRef = doc(db, 'chats', chatId);
        batch.update(chatRef, {
          [`unreadCount.${auth.currentUser.uid}`]: 0
        });
      }

      await batch.commit();
      setMessages(newMessages);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    return () => unsubscribe();
  }, [chatId, auth.currentUser, db, otherUserId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isBlocked) return;

    const messageText = newMessage.trim(); 
    setNewMessage(''); 

    const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
    const chatRef = doc(db, 'chats', chatId);

    const batch = writeBatch(db);

    batch.set(messageRef, {
      text: messageText,
      senderId: auth.currentUser.uid,
      receiverId: otherUserId,
      timestamp: serverTimestamp(),
      readBy: [auth.currentUser.uid]
    });

    batch.update(chatRef, {
      lastMessage: messageText,
      lastMessageTime: serverTimestamp(),
      [`unreadCount.${otherUserId}`]: increment(1)
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); 
    }
  };

  return (
    <MessagesContainer>
      <MessagesHeader>
        {showBackButton && (
          <BackButton onClick={onBack}>
            <FaArrowLeft /> Back
          </BackButton>
        )}
      </MessagesHeader>
      
      <MessagesList>
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            isOwnMessage={message.senderId === auth.currentUser?.uid}
          />
        ))}
        <div ref={messagesEndRef} />
      </MessagesList>
      
      <InputContainer>
        <MessageInput
          type="text"
          placeholder={isBlocked ? "You can't send messages to this user" : "Type a message"}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          disabled={isBlocked}
        />
        <SendButton
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || isBlocked}
        >
          <FaPaperPlane />
        </SendButton>
      </InputContainer>
    </MessagesContainer>
  );
};

export default ChatMessages;
