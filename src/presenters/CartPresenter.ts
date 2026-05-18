import { getPublicFileUrl } from '@/services/StorageService';
import { PUBLIC_IMAGE_BUCKET } from '@/utils/constants';

export function toCartDto(cartDoc: any) {
  const cart = cartDoc.toObject ? cartDoc.toObject() : cartDoc;

  return {
    id: cart._id.toString(),
    userId: cart.userId.toString(),
    items: cart.items.map((item: any) => {
      const product = item.productId;
      const hasProductDetails = product && typeof product === 'object';

      return {
        productId: hasProductDetails ? product._id.toString() : item.productId.toString(),
        shopId: item.shopId.toString(),
        quantity: item.quantity,
        priceAtAdd: item.priceAtAdd,
        // Populated product details
        name: hasProductDetails ? product.name : null,
        slug: hasProductDetails ? product.slug : null,
        imageUrl:
          hasProductDetails && product.images?.[0]
            ? getPublicFileUrl(PUBLIC_IMAGE_BUCKET, product.images[0])
            : null,
        isAvailable: hasProductDetails ? product.isAvailable : false,
        stock: hasProductDetails ? product.stock : 0,
      };
    }),
    updatedAt: cart.updatedAt,
  };
}
