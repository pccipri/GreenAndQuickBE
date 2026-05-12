import { ProductDto } from '@/models/IProduct';
import { getPublicFileUrl } from '@/services/StorageService';
import { PUBLIC_IMAGE_BUCKET } from '@/utils/constants';
import { toDto } from './GenericPresenter';

export function toProductDto(doc: any): ProductDto {
  const product = toDto<any>(doc);

  product.imageUrls = Array.isArray(product.images)
    ? product.images.map((imagePath: string) => getPublicFileUrl(PUBLIC_IMAGE_BUCKET, imagePath))
    : [];

  delete product.images;

  return product as ProductDto;
}
