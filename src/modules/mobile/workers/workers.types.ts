// Mobile Workers Types

export interface MobileWorkerResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListMobileWorkersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

