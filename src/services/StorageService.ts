import { supabase } from '@/libs/supabase/supabase';
import {
  ListFilesInput,
  ReplaceFileInput,
  UploadFileInput,
  FileObject,
} from '@/models/generic/Storage';

export async function uploadFile({
  bucket,
  path,
  file,
  mimeType,
  upsert = false,
  cacheControl,
}: UploadFileInput): Promise<void> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: mimeType,
    upsert,
    cacheControl,
  });

  if (error) {
    throw new Error(`Failed to upload file to "${bucket}": ${error.message}`);
  }
}

export async function replaceFile({
  bucket,
  path,
  file,
  mimeType,
  cacheControl,
}: ReplaceFileInput): Promise<void> {
  const { error } = await supabase.storage.from(bucket).update(path, file, {
    contentType: mimeType,
    cacheControl,
  });

  if (error) {
    throw new Error(`Failed to replace file in "${bucket}": ${error.message}`);
  }
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Failed to delete file from "${bucket}": ${error.message}`);
  }
}

export async function deleteFiles(bucket: string, paths: string[]): Promise<void> {
  if (paths.length === 0) {
    return;
  }

  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw new Error(`Failed to delete files from "${bucket}": ${error.message}`);
  }
}

export async function deleteFolder(bucket: string, folderPath: string): Promise<void> {
  const normalizedFolderPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;

  let allFilePathsToDelete: string[] = [];
  let offset = 0;
  const limit = 100; // Supabase list limit per request
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.storage.from(bucket).list(normalizedFolderPath, {
      limit: limit,
      offset: offset,
    });

    if (error) {
      throw new Error(`Failed to list files in folder "${bucket}/${folderPath}": ${error.message}`);
    }

    if (data && data.length > 0) {
      allFilePathsToDelete = allFilePathsToDelete.concat(
        data.map((file: FileObject) => `${normalizedFolderPath}${file.name}`),
      );
      offset += data.length;
      hasMore = data.length === limit; // If data.length is less than limit, it means it's the last page
    } else {
      hasMore = false; // No more files or folder is empty
    }
  }

  await deleteFiles(bucket, allFilePathsToDelete);
}

export async function downloadFile(bucket: string, path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error) {
    throw new Error(`Failed to download file from "${bucket}": ${error.message}`);
  }

  return data;
}

export async function createSignedDownloadUrl(
  bucket: string,
  path: string,
  expiresInSeconds: number,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    throw new Error(`Failed to create signed URL for "${bucket}": ${error.message}`);
  }

  return data.signedUrl;
}

export function getPublicFileUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function listFiles({
  bucket,
  folder = '',
  limit = 100,
  offset = 0,
  search,
  sortBy = { column: 'name', order: 'asc' },
}: ListFilesInput) {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit,
    offset,
    search,
    sortBy,
  });

  if (error) {
    throw new Error(`Failed to list files in "${bucket}": ${error.message}`);
  }

  return data;
}
