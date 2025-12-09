/**
 * Utility function to extract error message from various error types
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unknown error occurred';
};

/**
 * Handles API errors and returns user-friendly messages
 */
export const handleApiError = (error: unknown): string => {
  const message = getErrorMessage(error);
  
  // Handle specific Supabase error codes
  if (message.includes('PGRST116')) {
    return 'The requested resource was not found';
  }
  
  if (message.includes('42501')) {
    return 'You do not have permission to access this resource';
  }
  
  if (message.includes('23505')) {
    return 'This record already exists';
  }
  
  if (message.includes('23503')) {
    return 'This action cannot be completed due to related records';
  }
  
  if (message.includes('23502')) {
    return 'Required information is missing';
  }
  
  // Return the original message if no specific handling
  return message;
};