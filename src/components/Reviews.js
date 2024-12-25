import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { FaStar } from 'react-icons/fa';
import Navbar from './Navbar';

const ReviewsContainer = styled.div`
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
`;

const StatsContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const OverallRating = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
`;

const AverageScore = styled.div`
  font-size: 48px;
  font-weight: bold;
  color: blueviolet;
`;

const RatingBreakdown = styled.div`
  flex: 1;
`;

const RatingBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 5px 0;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const RatingLabel = styled.div`
  min-width: 60px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
`;

const Progress = styled.div`
  height: 100%;
  background: ${props => props.active ? 'blueviolet' : '#ddd'};
  width: ${props => props.width}%;
  transition: width 0.3s ease;
`;

const RatingCount = styled.div`
  min-width: 50px;
  text-align: right;
  color: #666;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin: 20px 0;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  border: 1px solid blueviolet;
  background: ${props => props.active ? 'blueviolet' : 'white'};
  color: ${props => props.active ? 'white' : 'blueviolet'};
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? '#8a2be2' : '#f8f4ff'};
  }
`;

const ReviewCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const UserName = styled.div`
  font-weight: 500;
`;

const Stars = styled.div`
  display: flex;
  gap: 2px;
  color: #ffd700;
`;

const ReviewDate = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const ReviewText = styled.p`
  margin: 10px 0;
  color: #333;
`;

const OrderDetails = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
`;

const NoReviews = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    breakdown: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    }
  });
  const db = getFirestore();

  useEffect(() => {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewsList = [];
      let totalRating = 0;
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      snapshot.forEach((doc) => {
        const review = { id: doc.id, ...doc.data() };
        reviewsList.push(review);
        totalRating += review.rating;
        breakdown[review.rating]++;
      });

      setReviews(reviewsList);
      setStats({
        average: reviewsList.length > 0 ? (totalRating / reviewsList.length).toFixed(1) : 0,
        total: reviewsList.length,
        breakdown
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const filteredReviews = filter === 0 
    ? reviews 
    : reviews.filter(review => review.rating === filter);

  if (loading) {
    return (
      <>
        <Navbar />
        <ReviewsContainer>
          <h1>Loading reviews...</h1>
        </ReviewsContainer>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ReviewsContainer>
        <h1>Customer Reviews</h1>
        
        <StatsContainer>
          <OverallRating>
            <AverageScore>{stats.average}</AverageScore>
            <RatingBreakdown>
              {[5, 4, 3, 2, 1].map(rating => {
                const count = stats.breakdown[rating];
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                
                return (
                  <RatingBar key={rating} onClick={() => setFilter(rating)}>
                    <RatingLabel>
                      {rating} <FaStar color="#ffd700" />
                    </RatingLabel>
                    <ProgressBar>
                      <Progress 
                        width={percentage} 
                        active={filter === rating}
                      />
                    </ProgressBar>
                    <RatingCount>{count}</RatingCount>
                  </RatingBar>
                );
              })}
            </RatingBreakdown>
          </OverallRating>
        </StatsContainer>

        <FilterContainer>
          <FilterButton 
            active={filter === 0} 
            onClick={() => setFilter(0)}
          >
            All Reviews ({stats.total})
          </FilterButton>
          {[5, 4, 3, 2, 1].map(rating => (
            <FilterButton
              key={rating}
              active={filter === rating}
              onClick={() => setFilter(rating)}
            >
              {rating} Star{rating !== 1 && 's'} ({stats.breakdown[rating]})
            </FilterButton>
          ))}
        </FilterContainer>

        {filteredReviews.length > 0 ? (
          filteredReviews.map(review => (
            <ReviewCard key={review.id}>
              <ReviewHeader>
                <UserName>{review.userName}</UserName>
                <Stars>
                  {[...Array(5)].map((_, index) => (
                    <FaStar
                      key={index}
                      color={index < review.rating ? '#ffd700' : '#ddd'}
                    />
                  ))}
                </Stars>
              </ReviewHeader>
              <ReviewDate>
                {new Date(review.timestamp.toDate()).toLocaleDateString()}
              </ReviewDate>
              <ReviewText>{review.text}</ReviewText>
              <OrderDetails>
                Order: {review.orderItems.map(item => item.name).join(', ')}
              </OrderDetails>
            </ReviewCard>
          ))
        ) : (
          <NoReviews>
            {filter === 0 
              ? 'No reviews yet' 
              : `No ${filter}-star reviews yet`}
          </NoReviews>
        )}
      </ReviewsContainer>
    </>
  );
};

export default Reviews;
