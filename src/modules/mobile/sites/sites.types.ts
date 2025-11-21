// Mobile Sites Types

import { SiteStatus, PriorityLevel } from '../../../types/enums';

export interface MobileSiteResponse {
  id: string;
  siteName: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: SiteStatus;
  location: string;
  jobs: number;
  workers: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListMobileSitesQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: SiteStatus;
}

export interface CreateMobileSiteRequest {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  status?: SiteStatus;
}

export interface UpdateMobileSiteRequest {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  status?: SiteStatus;
}

export interface MobileSiteWorkerResponse {
  id: string;
  name: string;
  role: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  lastSeen: string | null;
  clockedInAt: string | null;
}

export interface MobileSiteMediaResponse {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  album: string;
}

export interface MobileSiteMemoResponse {
  id: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  status: string;
  type: string;
  dueDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMobileSiteMemoRequest {
  title: string;
  description: string;
  priority?: PriorityLevel;
  status?: string;
  type?: string;
  dueDate?: string;
}

