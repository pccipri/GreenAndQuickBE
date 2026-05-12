import { ShopDto } from '@/models/IShop';
import { getPublicFileUrl } from '@/services/StorageService';
import { PUBLIC_IMAGE_BUCKET } from '@/utils/constants';
import { toDto } from './GenericPresenter';

export function toShopDto(doc: any): ShopDto {
  const shop = toDto<any>(doc);

  shop.logoUrl = shop.logo ? getPublicFileUrl(PUBLIC_IMAGE_BUCKET, shop.logo) : null;
  shop.coverImageUrl = shop.coverImage
    ? getPublicFileUrl(PUBLIC_IMAGE_BUCKET, shop.coverImage)
    : null;

  delete shop.logo;
  delete shop.coverImage;

  return shop as ShopDto;
}
