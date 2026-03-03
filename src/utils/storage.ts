export function getExtension(filename: string): string {
  const index = filename.lastIndexOf('.');
  return index === -1 ? '' : filename.slice(index).toLowerCase();
}

export function normalizeFolder(folder?: string): string {
  if (!folder) return '';
  return folder.replace(/^\/+|\/+$/g, '');
}
