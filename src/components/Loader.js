import React from 'react';
import styled, { keyframes } from 'styled-components';

const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f5f5f5;
`;

const typing = keyframes`
  from { width: 0 }
  to { width: 100% }
`;

const blink = keyframes`
  50% { border-color: transparent }
`;

const TypeWriter = styled.div`
  font-family: 'Courier New', Courier, monospace;
  font-size: 2em;
  font-weight: bold;
  color: blueviolet;
  
  &::after {
    content: 'MrGadhvii';
    display: block;
    width: 0;
    animation: ${typing} 2s steps(9) infinite,
               ${blink} .5s step-end infinite alternate;
    white-space: nowrap;
    overflow: hidden;
    border-right: 3px solid;
  }
`;

const SubText = styled.p`
  margin-top: 20px;
  color: #666;
  font-size: 1.2em;
`;

const Loader = () => {
  return (
    <LoaderContainer>
      <TypeWriter />
      <SubText>Loading amazing food for you...</SubText>
    </LoaderContainer>
  );
};

export default Loader;
