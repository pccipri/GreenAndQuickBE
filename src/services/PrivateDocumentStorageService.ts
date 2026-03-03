import { randomUUID } from 'node:crypto';
import {
  uploadFile,
  replaceFile,
  deleteFile,
  createSignedDownloadUrl,
  downloadFile,
} from './StorageService';
import { getExtension, normalizeFolder } from '@/utils/storage';
import { PRIVATE_DOCUMENT_BUCKET } from '@/utils/constants';

type UploadPrivateDocumentInput = {
  file: Buffer | Uint8Array | ArrayBuffer;
  originalFilename: string;
  mimeType: string;
  folder?: string;
};

type UploadPrivateDocumentResult = {
  path: string;
};

type ReplacePrivateDocumentInput = {
  path: string;
  file: Buffer | Uint8Array | ArrayBuffer;
  mimeType: string;
};

export async function uploadPrivateDocument(
  input: UploadPrivateDocumentInput,
): Promise<UploadPrivateDocumentResult> {
  const extension = getExtension(input.originalFilename);
  const filename = `${randomUUID()}${extension}`;
  const folder = normalizeFolder(input.folder);
  const path = folder ? `${folder}/${filename}` : filename;

  await uploadFile({
    bucket: PRIVATE_DOCUMENT_BUCKET,
    path,
    file: input.file,
    mimeType: input.mimeType,
  });

  return { path };
}

export async function replacePrivateDocument(
  input: ReplacePrivateDocumentInput,
): Promise<{ path: string }> {
  await replaceFile({
    bucket: PRIVATE_DOCUMENT_BUCKET,
    path: input.path,
    file: input.file,
    mimeType: input.mimeType,
  });

  return { path: input.path };
}

export async function deletePrivateDocument(path: string): Promise<void> {
  await deleteFile(PRIVATE_DOCUMENT_BUCKET, path);
}

export async function getPrivateDocumentDownloadUrl(
  path: string,
  expiresInSeconds = 60 * 10,
): Promise<string> {
  return createSignedDownloadUrl(PRIVATE_DOCUMENT_BUCKET, path, expiresInSeconds);
}

export async function downloadPrivateDocument(path: string): Promise<Blob> {
  return downloadFile(PRIVATE_DOCUMENT_BUCKET, path);
}
