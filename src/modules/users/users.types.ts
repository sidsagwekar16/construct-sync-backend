// Users types

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

export interface WorkerResponse {
  id: string;
  companyId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkerRequest {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

// Response returned when a worker is first created – includes a temporary password
// so that admins can share it with the worker (no password is ever stored in plain text).
export interface CreateWorkerResponse extends WorkerResponse {
  temporaryPassword: string;
}

export interface UpdateWorkerRequest {
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: UserRole;
  isActive?: boolean;
}

export interface ListWorkersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}
