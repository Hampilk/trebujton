import React from 'react';
import styled, { keyframes } from 'styled-components';

interface SkeletonLoaderProps {
  count?: number;
  height?: number | string;
  width?: number | string;
}

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const SkeletonItem = styled.div<{ height?: number | string; width?: number | string }>`
  height: ${props => typeof props.height === 'number' ? `${props.height}px` : props.height || '20px'};
  width: ${props => typeof props.width === 'number' ? `${props.width}px` : props.width || '100%'};
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 25%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 75%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite;
  border-radius: 4px;
  margin-bottom: 12px;
`;

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 3,
  height = 20,
  width = '100%',
}) => {
  return (
    <div>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} height={height} width={width} />
      ))}
    </div>
  );
};
