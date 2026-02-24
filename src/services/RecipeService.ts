import { HttpError } from '@/middlewares/errorHandler';
import { Recipe } from '@/schemas/RecipeSchema';
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

const UPDATE_WHITELIST = new Set([
  'title',
  'shortDescription',
  'ingredients',
  'instructions',
  'mealType',
  'difficulty',
  'tags',
  'servings',
  'nutritionPerPortion',
  'duration',
  'durationType',
  'imageUrl',
  'nutritionValues',
  'isPublished',
]);

function pickAllowedUpdates(payload: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (UPDATE_WHITELIST.has(k)) out[k] = v;
  }
  return out;
}

export const recipeService = {
  async create(authorId: string, payload: any) {
    const doc = await Recipe.create({
      ...payload,
      authorId: new Types.ObjectId(authorId),
    });
    return doc;
  },

  async getById(requesterId: string | null, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid recipe id');

    const recipe = await Recipe.findById(id).lean();
    if (!recipe) throw new HttpError(404, 'Recipe not found');

    const isOwner = requesterId && String(recipe.authorId) === String(requesterId);
    if (!recipe.isPublished && !isOwner) throw new HttpError(403, 'Forbidden');

    return recipe;
  },

  async getBySlug(requesterId: string | null, slug: string) {
    const recipe = await Recipe.findOne({ slug }).lean();
    if (!recipe) throw new HttpError(404, 'Recipe not found');

    const isOwner = requesterId && String(recipe.authorId) === String(requesterId);
    if (!recipe.isPublished && !isOwner) throw new HttpError(403, 'Forbidden');

    return recipe;
  },

  async update(authorId: string, id: string, payload: any) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid recipe id');

    const updates = pickAllowedUpdates(payload);

    const recipe = await Recipe.findOneAndUpdate(
      { _id: id, authorId: new Types.ObjectId(authorId) },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();

    if (!recipe) throw new HttpError(404, 'Recipe not found (or not owner)');

    return recipe;
  },

  async remove(authorId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid recipe id');
    const res = await Recipe.deleteOne({ _id: id, authorId: new Types.ObjectId(authorId) });
    if (res.deletedCount === 0) throw new HttpError(404, 'Recipe not found (or not owner)');
    return { ok: true };
  },

  async list(requesterId: string | null, query: ListQuery) {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};

    // publication rule:
    // - public: only published
    // - authenticated: allow published + own drafts
    if (!requesterId) {
      filter.isPublished = true;
    } else {
      filter.$or = [{ isPublished: true }, { authorId: new Types.ObjectId(requesterId) }];
    }

    // explicit isPublished filter
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

    // text search
    const findQuery = Recipe.find(query.q ? { ...filter, $text: { $search: query.q } } : filter);

    // sort
    const sort: Record<string, SortOrder> =
      query.sort === 'rating'
        ? { rating: -1, reviewCount: -1 }
        : query.sort === 'duration'
          ? { duration: 1, createdAt: -1 }
          : { createdAt: -1 }; // default: newest

    findQuery.sort(sort).skip(skip).limit(limit);

    // If text search, you might want score
    if (query.q) {
      findQuery.select({ score: { $meta: 'textScore' } } as any);
      findQuery.sort({ score: { $meta: 'textScore' } } as any);
    }

    const [items, total] = await Promise.all([
      findQuery.lean(),
      Recipe.countDocuments(query.q ? { ...filter, $text: { $search: query.q } } : filter),
    ]);

    return {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  },
};
