// Site Memos Types

export interface SiteMemo {
  id: string;
  site_id: string;
  created_by: string | null;
  title: string | null;
  content: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface SiteMemoResponse {
  id: string;
  siteId: string;
  createdBy: string | null;
  createdByName?: string;
  title: string | null;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMemoRequest {
  title?: string;
  content: string;
}

export interface UpdateMemoRequest {
  title?: string;
  content?: string;
}



