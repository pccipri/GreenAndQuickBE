import { getPublicFileUrl } from '@/services/StorageService';
import { PUBLIC_IMAGE_BUCKET } from '@/utils/constants';

export function toDto<T>(doc: any, idFieldName: string = 'id'): T {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj[idFieldName] = obj._id.toString();
  delete obj._id;
  return obj as T;
}

export function toDtoWithImageUrl<T>(
  doc: any,
  imagePathFieldName: string,
  imageUrlFieldName: string = 'imageUrl',
  idFieldName: string = 'id',
): T {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj[idFieldName] = obj._id.toString();
  delete obj._id;

  if (obj[imagePathFieldName]) {
    obj[imageUrlFieldName] = getPublicFileUrl(PUBLIC_IMAGE_BUCKET, obj[imagePathFieldName]);
    delete obj[imagePathFieldName];
  } else {
    obj[imageUrlFieldName] = null;
  }

  return obj as T;
}
