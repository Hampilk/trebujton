import { PostgrestError, AuthError } from '@supabase/supabase-js';

export type ApiError = PostgrestError | AuthError | Error;

export const getErrorMessage = (error: ApiError): string => {
  if ('message' in error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const isAuthError = (error: ApiError): error is AuthError => {
  return 'status' in error && typeof error.status === 'number';
};

export const isPostgrestError = (error: ApiError): error is PostgrestError => {
  return 'code' in error && 'details' in error && 'hint' in error;
};

export const handleApiError = (error: ApiError): void => {
  const message = getErrorMessage(error);
  console.error('API Error:', message, error);
  
  // You can add toast notifications here
  // toast.error(message);
};
