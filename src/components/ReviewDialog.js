import React, { useState } from 'react';
import styled from 'styled-components';
import { FaStar } from 'react-icons/fa';
import { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const DialogContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  text-align: center;
  color: #333;
`;

const StarsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const StarButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 24px;
  color: ${props => props.filled ? '#ffd700' : '#ddd'};
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 20px;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: blueviolet;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 12px;
  background: blueviolet;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background: #8a2be2;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ReviewDialog = ({ orderId, orderItems, onClose, userId, userName }) => {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const db = getFirestore();

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('Please write a review');
      return;
    }

    if (!orderId || !userId) {
      console.error('Missing required fields:', { orderId, userId });
      toast.error('Missing order information. Please try again.');
      return;
    }

    setSubmitting(true);
    try {
      // Create the review document
      const reviewData = {
        orderId,
        userId,
        userName: userName || 'Anonymous User',
        rating,
        text: text.trim(),
        orderItems: orderItems || [],
        timestamp: serverTimestamp(),
        status: 'active'
      };

      console.log('Submitting review:', reviewData);
      const reviewRef = await addDoc(collection(db, 'reviews'), reviewData);
      
      // Update the order to mark it as reviewed
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        reviewed: true,
        reviewId: reviewRef.id
      });

      toast.success('Thank you for your review!');
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogOverlay onClick={e => e.target === e.currentTarget && onClose()}>
      <DialogContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <Title>Rate Your Order</Title>

        <StarsContainer>
          {[1, 2, 3, 4, 5].map((star) => (
            <StarButton
              key={star}
              onClick={() => setRating(star)}
              filled={star <= rating}
            >
              <FaStar />
            </StarButton>
          ))}
        </StarsContainer>

        <TextArea
          placeholder="Write your review here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <SubmitButton 
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </SubmitButton>
      </DialogContent>
    </DialogOverlay>
  );
};

export default ReviewDialog;
