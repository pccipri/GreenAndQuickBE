export type StorageFileBody = Buffer | Uint8Array | ArrayBuffer;

export type FileObject = {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
};

export type UploadFileInput = {
  bucket: string;
  path: string;
  file: StorageFileBody;
  mimeType: string;
  upsert?: boolean;
  cacheControl?: string;
};

export type ReplaceFileInput = {
  bucket: string;
  path: string;
  file: StorageFileBody;
  mimeType: string;
  cacheControl?: string;
};

export type ListFilesInput = {
  bucket: string;
  folder?: string;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: {
    column: 'name' | 'updated_at' | 'created_at' | 'last_accessed_at';
    order: 'asc' | 'desc';
  };
};
