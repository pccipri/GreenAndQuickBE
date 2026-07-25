import { DietaryTag } from '@/schemas/DietaryTagSchema';
import { Recipe } from '@/schemas/RecipeSchema';
import { HttpError } from '@/middlewares/errorHandler';
import { Types } from 'mongoose';
import type { ICreateDietaryTagDTO } from '@/models/IDietaryTag';
import { MongoServerError } from 'mongodb';

export const dietaryTagService = {
  async create(payload: ICreateDietaryTagDTO) {
    const normalizedKey = payload.key.trim().toLowerCase();

    const existing = await DietaryTag.findOne({ key: normalizedKey }).lean();
    if (existing) throw new HttpError(409, 'dietaryTag.alreadyExists');

    try {
      const doc = await DietaryTag.create({ key: normalizedKey });
      return {
        _id: doc._id.toString(),
        key: doc.key,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new HttpError(409, 'dietaryTag.alreadyExists');
      }
      throw error;
    }
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
