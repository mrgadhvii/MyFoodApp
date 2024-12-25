import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  writeBatch,
  increment
} from 'firebase/firestore';
import { format } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import { FaCheck, FaCheckDouble } from 'react-icons/fa';

const ChatWindow = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 600px;
  height: 80vh;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
`;

const ChatHeader = styled.div`
  padding: 15px;
  background: #075e54;
  color: white;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  margin: 0;
`;

const MessageList = styled.div`
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
  background: #e5ddd5;
  display: flex;
  flex-direction: column;
`;

const Message = styled.div`
  max-width: 70%;
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 7.5px;
  position: relative;
  align-self: ${props => props.sent ? 'flex-end' : 'flex-start'};
  background: ${props => props.sent ? '#dcf8c6' : 'white'};
  margin-bottom: 20px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    ${props => props.sent ? 'right: -8px' : 'left: -8px'};
    width: 0;
    height: 0;
    border-top: 6px solid ${props => props.sent ? '#dcf8c6' : 'white'};
    border-right: 6px solid transparent;
    border-left: 6px solid transparent;
    transform: ${props => props.sent ? 'rotate(-45deg)' : 'rotate(45deg)'};
  }
`;

const MessageTime = styled.span`
  position: absolute;
  bottom: -18px;
  right: 0;
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  gap: 2px;
`;

const MessageStatus = styled.span`
  font-size: 12px;
  margin-left: 5px;
  color: ${props => props.isRead ? '#0084ff' : '#999'};
`;

const InputContainer = styled.div`
  padding: 15px;
  background: #f0f0f0;
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Input = styled.input`
  flex-grow: 1;
  padding: 10px 15px;
  border: none;
  border-radius: 20px;
  outline: none;
  font-size: 1rem;

  &:focus {
    outline: none;
  }
`;

const SendButton = styled.button`
  background: #128c7e;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #075e54;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const ChatMessages = ({ chatId, recipientEmail, onClose }) => {
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const messageListRef = useRef(null);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = [];
      snapshot.forEach((doc) => {
        messagesList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setMessages(messagesList);
      scrollToBottom();

      // Mark messages as read
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        const message = doc.data();
        if (!message.read && message.senderId !== auth.currentUser.uid) {
          batch.update(doc.ref, { read: true });
        }
      });
      batch.commit();
    });

    return () => unsubscribe();
  }, [chatId, db, auth.currentUser]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const chatRef = doc(db, 'chats', chatId);
      
      await addDoc(messagesRef, {
        text: messageText,
        senderId: auth.currentUser.uid,
        senderEmail: auth.currentUser.email,
        timestamp: serverTimestamp(),
        read: false
      });

      // Update last message in chat
      await updateDoc(chatRef, {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        unreadCount: increment(1)
      });

      setMessageText('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  const getMessageStatus = (message) => {
    if (!message.read) {
      return <MessageStatus><FaCheck /></MessageStatus>;
    } else {
      return <MessageStatus isRead><FaCheckDouble /></MessageStatus>;
    }
  };

  return (
    <>
      <Overlay onClick={onClose} />
      <ChatWindow>
        <ChatHeader>
          <div>{recipientEmail}</div>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ChatHeader>

        <MessageList ref={messageListRef}>
          {messages.map((msg) => (
            <Message
              key={msg.id}
              sent={msg.senderId === auth.currentUser.uid}
            >
              {msg.text}
              <MessageTime>
                {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : ''}
                {msg.senderId === auth.currentUser.uid && getMessageStatus(msg)}
              </MessageTime>
            </Message>
          ))}
        </MessageList>

        <InputContainer>
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
          />
          <SendButton
            onClick={sendMessage}
            disabled={!messageText.trim()}
          >
            →
          </SendButton>
        </InputContainer>
      </ChatWindow>
    </>
  );
};

export default ChatMessages;
