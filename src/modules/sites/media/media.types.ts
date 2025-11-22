// Site Media Types

export interface SiteMedia {
  id: string;
  site_id: string;
  uploaded_by: string | null;
  media_type: string | null;
  media_url: string;
  thumbnail_url: string | null;
  deleted_at: Date | null;
  created_at: Date;
}

export interface SiteMediaResponse {
  id: string;
  siteId: string;
  uploadedBy: string | null;
  uploadedByName?: string;
  mediaType: string | null;
  mediaUrl: string;
  thumbnailUrl: string | null;
  createdAt: Date;
}

export interface UploadMediaRequest {
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType?: 'photo' | 'video' | 'document' | 'audio';
}



