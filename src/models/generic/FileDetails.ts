export interface UploadBucketFileInput {
  file: Buffer | Uint8Array | ArrayBuffer;
  originalFilename: string;
  mimeType: string;
  folder?: string;
}

export interface ReplaceBucketFileInput {
  path: string;
  file: Buffer | Uint8Array | ArrayBuffer;
  mimeType: string;
}

export interface UploadPublicImageResult {
  path: string;
  publicUrl: string;
}

export interface UploadPrivateDocumentResult {
  path: string;
}
