import React from 'react';
import styled from 'styled-components';
import theme from 'styled-theming';

interface DataStateMessageProps {
  state: 'loading' | 'error' | 'empty';
  message?: string;
  error?: Error | null;
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
  text-align: center;
  color: ${theme('theme', {
    light: 'var(--text)',
    dark: 'var(--text)'
  })};
`;

const Message = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text);
`;

const ErrorMessage = styled(Message)`
  color: var(--error, #f44336);
`;

export const DataStateMessage: React.FC<DataStateMessageProps> = ({
  state,
  message,
  error,
}) => {
  if (state === 'loading') {
    return (
      <Container>
        <Message>Loading...</Message>
      </Container>
    );
  }

  if (state === 'error') {
    return (
      <Container>
        <ErrorMessage>
          {message || (error ? error.message : 'An error occurred')}
        </ErrorMessage>
      </Container>
    );
  }

  if (state === 'empty') {
    return (
      <Container>
        <Message>{message || 'No data available'}</Message>
      </Container>
    );
  }

  return null;
};
