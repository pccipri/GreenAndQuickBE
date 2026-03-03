import { getExtension, normalizeFolder } from '@/utils/storage';
import { randomUUID } from 'node:crypto';
import { deleteFile, getPublicFileUrl, replaceFile, uploadFile } from './StorageService';
import { PUBLIC_IMAGE_BUCKET } from '@/utils/constants';

type UploadPublicImageInput = {
  file: Buffer | Uint8Array | ArrayBuffer;
  originalFilename: string;
  mimeType: string;
  folder?: string;
};

type UploadPublicImageResult = {
  path: string;
  publicUrl: string;
};

type ReplacePublicImageInput = {
  path: string;
  file: Buffer | Uint8Array | ArrayBuffer;
  mimeType: string;
};

export async function uploadPublicImage(
  input: UploadPublicImageInput,
): Promise<UploadPublicImageResult> {
  const extension = getExtension(input.originalFilename);
  const filename = `${randomUUID()}${extension}`;
  const folder = normalizeFolder(input.folder);
  const path = folder ? `${folder}/${filename}` : filename;

  await uploadFile({
    bucket: PUBLIC_IMAGE_BUCKET,
    path,
    file: input.file,
    mimeType: input.mimeType,
  });

  return {
    path,
    publicUrl: getPublicFileUrl(PUBLIC_IMAGE_BUCKET, path),
  };
}

export async function replacePublicImage(
  input: ReplacePublicImageInput,
): Promise<{ path: string; publicUrl: string }> {
  await replaceFile({
    bucket: PUBLIC_IMAGE_BUCKET,
    path: input.path,
    file: input.file,
    mimeType: input.mimeType,
  });

  return {
    path: input.path,
    publicUrl: getPublicFileUrl(PUBLIC_IMAGE_BUCKET, input.path),
  };
}

export async function deletePublicImage(path: string): Promise<void> {
  await deleteFile(PUBLIC_IMAGE_BUCKET, path);
}

export function getPublicImageUrl(path: string): string {
  return getPublicFileUrl(PUBLIC_IMAGE_BUCKET, path);
}
