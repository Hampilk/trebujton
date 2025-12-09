/**
 * Global Type Definitions
 * Common types used across the application
 */

export interface BaseEntity {
  id: string;
  [key: string]: any;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export type AnyObject = Record<string, any>;

export interface WithChildren {
  children?: React.ReactNode;
}
