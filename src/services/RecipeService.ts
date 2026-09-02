import { HttpError } from '@/middlewares/errorHandler';
import { toRecipeDto } from '@/presenters/RecipePresenter';
import { Recipe } from '@/schemas/RecipeSchema';
import { Product } from '@/schemas/ProductSchema';
import { Favorite } from '@/schemas/FavoriteSchema';
import { Review } from '@/schemas/ReviewSchema';
import { productService } from '@/services/ProductService';
import mongoose from 'mongoose';
import type { SortOrder } from 'mongoose';
import { Types } from 'mongoose';

const RECOMMENDATION_LIMIT = 4;
const HIGHLY_RATED_THRESHOLD = 4;

type ListQuery = {
  q?: string;
  mealType?: string;
  difficulty?: string;
  dietaryTag?: string; // single dietary tag filter
  dietaryTags?: string[] | string; // multiple dietary tags (AND match)
  authorId?: string;
  isPublished?: string; // "true" | "false"
  minRating?: string;
  maxDuration?: string;
  sort?: string; // "new" | "rating" | "duration"
  page?: string;
  limit?: string;
};

export function normalizeDietaryTags(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return [
      ...new Set(
        value.flatMap((item) =>
          String(item)
            .split(',')
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean),
        ),
      ),
    ];
  }

  return [
    ...new Set(
      String(value)
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export function getDurationInMinutes(duration: number, durationType?: string) {
  if (durationType === 'HOURS') return duration * 60;
  return duration;
}

export const recipeService = {
  async create(authorId: string, payload: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // validate linked product ids if present
      if (Array.isArray(payload.ingredients)) {
        const ids = payload.ingredients
          .map((i: any) => i.linkedProductId)
          .filter(Boolean)
          .map(String);

        for (const id of ids) {
          if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'recipe.invalidProductId');
          const exists = await Product.exists({ _id: id }).session(session);
          if (!exists) throw new HttpError(404, 'product.notFound');
        }
      }

      const [created] = await Recipe.create(
        [{ ...payload, authorId: new Types.ObjectId(authorId) }],
        { session },
      );

      const doc = await Recipe.findById(created._id)
        .populate('authorId', 'firstName lastName avatarPath')
        .populate('ingredients.linkedProductId', 'name price shopId')
        .session(session)
        .lean();

      await session.commitTransaction();
      return toRecipeDto(doc);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async getById(requesterId: string | null, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid recipe id');

    const recipe = await Recipe.findById(id)
      .populate('authorId', 'firstName lastName avatarPath')
      .populate('ingredients.linkedProductId', 'name price shopId')
      .lean();
    if (!recipe) throw new HttpError(404, 'Recipe not found');

    const isOwner = requesterId && String(recipe.authorId) === String(requesterId);
    if (!recipe.isPublished && !isOwner) throw new HttpError(403, 'Forbidden');

    return toRecipeDto(recipe);
  },

  async getBySlug(requesterId: string | null, slug: string) {
    const recipe = await Recipe.findOne({ slug })
      .populate('authorId', 'firstName lastName avatarPath')
      .populate('ingredients.linkedProductId', 'name price shopId')
      .lean();
    if (!recipe) throw new HttpError(404, 'Recipe not found');

    const isOwner = requesterId && String(recipe.authorId) === String(requesterId);
    if (!recipe.isPublished && !isOwner) throw new HttpError(403, 'Forbidden');

    return toRecipeDto(recipe);
  },

  async update(id: string, payload: any, requesterId: string, isAdmin: boolean) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid recipe id');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const filter: any = { _id: id };

      if (!isAdmin) {
        filter.authorId = new Types.ObjectId(requesterId);
      }

      // validate linked product ids if present
      if (Array.isArray(payload.ingredients)) {
        const ids = payload.ingredients
          .map((i: any) => i.linkedProductId)
          .filter(Boolean)
          .map(String);

        for (const id of ids) {
          if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'recipe.invalidProductId');
          const exists = await Product.exists({ _id: id }).session(session);
          if (!exists) throw new HttpError(404, 'product.notFound');
        }
      }

      const recipe = await Recipe.findOneAndUpdate(
        filter,
        { $set: payload },
        { new: true, runValidators: true, session },
      )
        .populate('authorId', 'firstName lastName avatarPath')
        .populate('ingredients.linkedProductId', 'name price shopId')
        .lean();

      if (!recipe) throw new HttpError(404, 'recipe.notFound');

      await session.commitTransaction();
      return toRecipeDto(recipe);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async remove(id: string, requesterId: string, isAdmin: boolean) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid recipe id');
    const filter: any = { _id: id };
    if (!isAdmin) filter.authorId = new Types.ObjectId(requesterId);

    const res = await Recipe.deleteOne(filter);
    if (res.deletedCount === 0) throw new HttpError(404, 'recipe.notFound');
    return { ok: true };
  },

  async list(requesterId: string | null, query: ListQuery) {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (!requesterId) {
      filter.isPublished = true;
    } else {
      filter.$or = [{ isPublished: true }, { authorId: new Types.ObjectId(requesterId) }];
    }

    if (query.isPublished === 'true') filter.isPublished = true;
    if (query.isPublished === 'false') filter.isPublished = false;

    if (query.mealType) filter.mealType = query.mealType;
    if (query.difficulty) filter.difficulty = query.difficulty;

    if (query.authorId && Types.ObjectId.isValid(query.authorId)) {
      filter.authorId = new Types.ObjectId(query.authorId);
    }

    const dietaryTags = [
      ...normalizeDietaryTags(query.dietaryTag),
      ...normalizeDietaryTags(query.dietaryTags as any),
    ];

    if (dietaryTags.length > 0) {
      filter.dietaryTags = { $all: [...new Set(dietaryTags)] };
    }

    if (query.minRating != null) {
      const mr = Number(query.minRating);
      if (!Number.isNaN(mr)) filter.averageRating = { $gte: mr };
    }

    if (query.maxDuration != null) {
      const maxDuration = Number(query.maxDuration);
      if (!Number.isNaN(maxDuration)) {
        filter.$expr = {
          $lte: [
            {
              $cond: [
                { $eq: ['$durationType', 'HOURS'] },
                { $multiply: ['$duration', 60] },
                '$duration',
              ],
            },
            maxDuration,
          ],
        };
      }
    }

    const mongoQuery = query.q ? { ...filter, $text: { $search: query.q } } : filter;
    const findQuery = Recipe.find(mongoQuery);

    const sort: Record<string, SortOrder> =
      query.sort === 'rating'
        ? { averageRating: -1, reviewCount: -1, createdAt: -1, _id: -1 }
        : query.sort === 'duration'
          ? { duration: 1, createdAt: -1, _id: -1 }
          : { createdAt: -1, _id: -1 };

    findQuery.sort(sort).skip(skip).limit(limit);

    if (query.q) {
      findQuery.select({ score: { $meta: 'textScore' } } as any);
      const textSort =
        query.sort === 'rating'
          ? ({
              score: { $meta: 'textScore' },
              averageRating: -1,
              reviewCount: -1,
              createdAt: -1,
              _id: -1,
            } as any)
          : ({ score: { $meta: 'textScore' }, createdAt: -1, _id: -1 } as any);
      findQuery.sort(textSort);
    }

    const [items, total] = await Promise.all([
      findQuery.populate('authorId', 'firstName lastName avatarPath').lean(),
      Recipe.countDocuments(mongoQuery),
    ]);

    return {
      items: items.map(toRecipeDto),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Rule-based recommendations for a recipe (Feature 12) — no ML, derived from mealType/dietaryTags/rating.
   */
  async getRecommendations(recipeId: string, requesterId: string | null) {
    if (!Types.ObjectId.isValid(recipeId)) throw new HttpError(400, 'recipe.invalidId');

    const recipe = await Recipe.findOne({ _id: recipeId, isPublished: true }).lean();
    if (!recipe) throw new HttpError(404, 'recipe.notFound');

    const excludedIds = new Set<string>([String(recipe._id)]);

    if (requesterId) {
      const [favorited, reviewed] = await Promise.all([
        Favorite.find({ userId: requesterId, targetType: 'recipe' }).select('targetId').lean(),
        Review.find({ targetType: 'recipe', authorId: requesterId }).select('targetId').lean(),
      ]);
      favorited.forEach((f: any) => excludedIds.add(String(f.targetId)));
      reviewed.forEach((r: any) => excludedIds.add(String(r.targetId)));
    }

    const results: any[] = [];
    const excludedObjectIds = () => [...excludedIds].map((id) => new Types.ObjectId(id));
    const dietaryTags = recipe.dietaryTags ?? [];

    // Priority 1: same mealType + at least one overlapping dietary tag
    if (dietaryTags.length > 0) {
      const priority1 = await Recipe.find({
        _id: { $nin: excludedObjectIds() },
        isPublished: true,
        mealType: recipe.mealType,
        dietaryTags: { $in: dietaryTags },
      })
        .sort({ averageRating: -1, reviewCount: -1 })
        .limit(RECOMMENDATION_LIMIT)
        .populate('authorId', 'firstName lastName avatarPath')
        .lean();

      results.push(...priority1);
      priority1.forEach((r: any) => excludedIds.add(String(r._id)));
    }

    // Priority 2: same mealType + highly rated (fallback)
    if (results.length < RECOMMENDATION_LIMIT) {
      const priority2 = await Recipe.find({
        _id: { $nin: excludedObjectIds() },
        isPublished: true,
        mealType: recipe.mealType,
        averageRating: { $gte: HIGHLY_RATED_THRESHOLD },
      })
        .sort({ averageRating: -1, reviewCount: -1 })
        .limit(RECOMMENDATION_LIMIT - results.length)
        .populate('authorId', 'firstName lastName avatarPath')
        .lean();

      results.push(...priority2);
      priority2.forEach((r: any) => excludedIds.add(String(r._id)));
    }

    // Priority 3: same mealType, sorted by rating (last resort)
    if (results.length < RECOMMENDATION_LIMIT) {
      const priority3 = await Recipe.find({
        _id: { $nin: excludedObjectIds() },
        isPublished: true,
        mealType: recipe.mealType,
      })
        .sort({ averageRating: -1, reviewCount: -1 })
        .limit(RECOMMENDATION_LIMIT - results.length)
        .populate('authorId', 'firstName lastName avatarPath')
        .lean();

      results.push(...priority3);
    }

    return results.slice(0, RECOMMENDATION_LIMIT).map(toRecipeDto);
  },

  /**
   * Fetches matched products for a list of ingredient names in parallel.
   * @param recipeId The ID of the recipe.
   * @param ingredients Array of ingredient names to search for.
   * @returns Array of ingredient matches.
   */
  async shopRecipeIngredients(recipeId: string, ingredients: string[]) {
    if (!Types.ObjectId.isValid(recipeId)) throw new HttpError(400, 'recipe.invalidId');

    const uniqueIngredients = [...new Set(ingredients)];

    const results = await Promise.all(
      uniqueIngredients.map(async (ingredient) => {
        const { items, total } = await productService.searchProductsByIngredient(ingredient, 5);
        return {
          ingredient,
          matches: items,
          foundCount: total,
        };
      }),
    );

    return results;
  },
};
