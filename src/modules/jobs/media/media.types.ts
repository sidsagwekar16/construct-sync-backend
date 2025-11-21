// Job Media Types

export interface JobPhoto {
  id: string;
  job_id: string;
  uploaded_by: string | null;
  photo_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  deleted_at: Date | null;
  created_at: Date;
}

export interface JobDocument {
  id: string;
  job_id: string;
  uploaded_by: string | null;
  document_name: string;
  document_url: string;
  document_type: string | null;
  deleted_at: Date | null;
  created_at: Date;
}

export interface JobPhotoResponse {
  id: string;
  jobId: string;
  uploadedBy: string | null;
  uploadedByName?: string;
  photoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  createdAt: Date;
}

export interface JobDocumentResponse {
  id: string;
  jobId: string;
  uploadedBy: string | null;
  uploadedByName?: string;
  documentName: string;
  documentUrl: string;
  documentType: string | null;
  createdAt: Date;
}

export interface UploadPhotoRequest {
  photoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
}

export interface UploadDocumentRequest {
  documentName: string;
  documentUrl: string;
  documentType?: string;
}

