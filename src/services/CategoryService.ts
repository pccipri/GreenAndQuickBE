import { Category } from '@/schemas/CategorySchema';
import { Product } from '@/schemas/ProductSchema';
import { toCategoryDto } from '@/presenters/CategoryPresenter';
import { HttpError } from '@/middlewares/errorHandler';
import { Types } from 'mongoose';

export const categoryService = {
  async create(payload: any) {
    const doc = await Category.create(payload);
    return toCategoryDto(doc);
  },

  async list() {
    const categories = await Category.find().sort({ name: 1 });
    return categories.map(toCategoryDto);
  },

  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'category.invalidId');
    const category = await Category.findById(id);
    if (!category) throw new HttpError(404, 'category.notFound');
    return toCategoryDto(category);
  },

  async update(id: string, payload: any) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'category.invalidId');
    const updated = await Category.findByIdAndUpdate(id, { $set: payload }, { new: true });
    if (!updated) throw new HttpError(404, 'category.notFound');
    return toCategoryDto(updated);
  },

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'category.invalidId');

    const productCount = await Product.countDocuments({ categoryId: id });
    if (productCount > 0) throw new HttpError(409, 'category.hasLinkedProducts');

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) throw new HttpError(404, 'category.notFound');
    return { ok: true };
  },
};
