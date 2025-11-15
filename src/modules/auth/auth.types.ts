// Auth types

import { UserRole } from '../../types/enums';

export interface User {
  id: string;
  company_id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  is_active: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
}

export interface LoginResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  companyId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ErrorReportRequest {
  errorMessage: string;
  errorStack?: string;
  userAgent?: string;
  url?: string;
  additionalInfo?: Record<string, any>;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  companyId: string;
}
