import { HttpError } from '@/middlewares/errorHandler';
import { toRecipeDto } from '@/presenters/RecipePresenter';
import { Recipe } from '@/schemas/RecipeSchema';
import { productService } from '@/services/ProductService';
import { SortOrder, Types } from 'mongoose';

type ListQuery = {
  q?: string;
  mealType?: string;
  difficulty?: string;
  tag?: string; // single tag filter
  tags?: string[]; // multiple tags (any match)
  authorId?: string;
  isPublished?: string; // "true" | "false"
  minRating?: string;
  sort?: string; // "new" | "rating" | "duration"
  page?: string;
  limit?: string;
};

export const recipeService = {
  async create(authorId: string, payload: any) {
    const doc = await Recipe.create({
      ...payload,
      authorId: new Types.ObjectId(authorId),
    });

    return toRecipeDto(doc);
  },

  async getById(requesterId: string | null, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid recipe id');

    const recipe = await Recipe.findById(id)
      .populate('authorId', 'firstName lastName avatarPath')
      .lean();
    if (!recipe) throw new HttpError(404, 'Recipe not found');

    const isOwner = requesterId && String(recipe.authorId) === String(requesterId);
    if (!recipe.isPublished && !isOwner) throw new HttpError(403, 'Forbidden');

    return toRecipeDto(recipe);
  },

  async getBySlug(requesterId: string | null, slug: string) {
    const recipe = await Recipe.findOne({ slug })
      .populate('authorId', 'firstName lastName avatarPath')
      .lean();
    if (!recipe) throw new HttpError(404, 'Recipe not found');

    const isOwner = requesterId && String(recipe.authorId) === String(requesterId);
    if (!recipe.isPublished && !isOwner) throw new HttpError(403, 'Forbidden');

    return toRecipeDto(recipe);
  },

  async update(id: string, payload: any, requesterId: string, isAdmin: boolean) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid recipe id');

    const filter: any = { _id: id };

    if (!isAdmin) {
      filter.authorId = new Types.ObjectId(requesterId);
    }

    const recipe = await Recipe.findOneAndUpdate(
      filter,
      { $set: payload },
      { new: true, runValidators: true },
    ).lean();

    if (!recipe) throw new HttpError(404, 'recipe.notFound');

    return toRecipeDto(recipe);
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

    const tags: string[] = [];
    if (query.tag) tags.push(query.tag);
    if (Array.isArray(query.tags)) tags.push(...query.tags);
    if (tags.length > 0) filter.tags = { $in: tags };

    if (query.minRating != null) {
      const mr = Number(query.minRating);
      if (!Number.isNaN(mr)) filter.rating = { $gte: mr };
    }

    const mongoQuery = query.q ? { ...filter, $text: { $search: query.q } } : filter;
    const findQuery = Recipe.find(mongoQuery);

    const sort: Record<string, SortOrder> =
      query.sort === 'rating'
        ? { rating: -1, reviewCount: -1 }
        : query.sort === 'duration'
          ? { duration: 1, createdAt: -1 }
          : { createdAt: -1 };

    findQuery.sort(sort).skip(skip).limit(limit);

    if (query.q) {
      findQuery.select({ score: { $meta: 'textScore' } } as any);
      findQuery.sort({ score: { $meta: 'textScore' } } as any);
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
