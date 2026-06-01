import mongoose from 'mongoose';
import { Favorite } from '../schemas/FavoriteSchema';
import { HttpError } from '@/middlewares/errorHandler';
import { toFavoriteDto } from '../presenters/FavoritePresenter';

const FAVORITE_TARGET_MODELS: Record<'recipe' | 'product' | 'shop', string> = {
  recipe: 'recipe',
  product: 'product',
  shop: 'shop',
};

const getTargetModel = (targetType: 'recipe' | 'product' | 'shop') => {
  const modelName = FAVORITE_TARGET_MODELS[targetType];
  return mongoose.model(modelName);
};

/**
 * Adds a new favorite for a user.
 */
export const addFavorite = async (
  userId: string,
  targetType: 'recipe' | 'product' | 'shop',
  targetId: string,
) => {
  // Verify target exists in its respective collection
  const TargetModel = getTargetModel(targetType);
  const targetExists = await TargetModel.exists({ _id: targetId });

  if (!targetExists) {
    throw new HttpError(404, `${targetType}.notFound`);
  }

  try {
    const favorite = new Favorite({ userId, targetType, targetId });
    const savedFavorite = await favorite.save();
    return toFavoriteDto(savedFavorite);
  } catch (error: any) {
    if (error.code === 11000) {
      throw new HttpError(409, 'favorite.alreadyExists');
    }
    throw error;
  }
};

/**
 * Removes a favorite.
 */
export const removeFavorite = async (userId: string, targetType: string, targetId: string) => {
  const result = await Favorite.deleteOne({ userId, targetType, targetId });
  return result.deletedCount > 0;
};

/**
 * Lists favorites for a user by type with pagination.
 */
export const listFavorites = async (
  userId: string,
  targetType: 'recipe' | 'product' | 'shop' | undefined,
  page: number = 1,
  limit: number = 10,
) => {
  const skip = (page - 1) * limit;
  const query: any = { userId };

  if (targetType) {
    query.targetType = targetType;
  }

  const [items, total] = await Promise.all([
    Favorite.find(query)
      .lean()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('targetId'),
    Favorite.countDocuments(query),
  ]);

  return {
    items: items.map((item) => toFavoriteDto(item)),
    total,
    page,
    limit,
    hasNext: skip + items.length < total,
  };
};

/**
 * Checks if a specific item is favorited by a user.
 */
export const isFavorited = async (userId: string, targetType: string, targetId: string) => {
  const favoriteExists = await Favorite.exists({ userId, targetType, targetId });
  return { isFavorited: !!favoriteExists };
};
