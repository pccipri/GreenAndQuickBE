import { DietaryTag } from '@/schemas/DietaryTagSchema';
import { Recipe } from '@/schemas/RecipeSchema';
import { HttpError } from '@/middlewares/errorHandler';
import { Types } from 'mongoose';

export const dietaryTagService = {
  async create(payload: any) {
    const doc = await DietaryTag.create(payload);
    return {
      _id: doc._id.toString(),
      key: doc.key,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },

  async list() {
    const tags = await DietaryTag.find().sort({ key: 1 }).lean();
    return tags.map((tag) => tag.key);
  },

  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'dietaryTag.invalidId');
    const tag = await DietaryTag.findById(id);
    if (!tag) throw new HttpError(404, 'dietaryTag.notFound');
    return tag;
  },

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'dietaryTag.invalidId');

    const tag = await DietaryTag.findById(id);
    if (!tag) throw new HttpError(404, 'dietaryTag.notFound');

    const linkedRecipes = await Recipe.countDocuments({ dietaryTags: tag.key });
    if (linkedRecipes > 0) throw new HttpError(409, 'dietaryTag.inUse');

    const deleted = await DietaryTag.findByIdAndDelete(id);
    if (!deleted) throw new HttpError(404, 'dietaryTag.notFound');
    return { ok: true };
  },
};
