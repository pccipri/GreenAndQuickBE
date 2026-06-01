import { toProductDto } from './ProductPresenter';
import { toRecipeDto } from './RecipePresenter';
import { toShopDto } from './ShopPresenter';
import { toDto } from './GenericPresenter';

export function toFavoriteDto(doc: any) {
  const favorite = doc.toObject ? doc.toObject() : { ...doc };
  favorite.id = favorite._id?.toString();
  delete favorite._id;

  if (favorite.targetId && typeof favorite.targetId === 'object') {
    const targetDoc = favorite.targetId;
    let target = null;

    switch (favorite.targetType) {
      case 'product':
        target = toProductDto(targetDoc);
        break;
      case 'shop':
        target = toShopDto(targetDoc);
        break;
      case 'recipe':
        target = toRecipeDto(targetDoc);
        break;
      default:
        target = toDto<any>(targetDoc);
    }

    favorite.target = target;
    favorite.targetId = target?.id ?? String(targetDoc._id || targetDoc.id);
  }

  return favorite;
}
