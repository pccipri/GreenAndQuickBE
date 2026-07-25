import { Shop } from '@/schemas/ShopSchema';
import { Product } from '@/schemas/ProductSchema';
import { Category } from '@/schemas/CategorySchema';
import { toShopDto } from '@/presenters/ShopPresenter';
import { toProductDto } from '@/presenters/ProductPresenter';
import { HttpError } from '@/middlewares/errorHandler';
import { SortOrder, Types } from 'mongoose';

type ShopListQuery = {
  search?: string;
  category?: string; // category slug
  sort?: 'newest' | 'popular' | 'rating';
  page?: string;
  limit?: string;
};

export const shopService = {
  async create(ownerId: string, payload: any) {
    const existing = await Shop.findOne({ ownerId: new Types.ObjectId(ownerId) });
    if (existing) {
      throw new HttpError(409, 'shop.alreadyExistsForOwner');
    }

    const doc = await Shop.create({
      ...payload,
      ownerId: new Types.ObjectId(ownerId),
    });

    return toShopDto(doc);
  },

  async list(query: ShopListQuery) {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20) || 20));
    const skip = (page - 1) * limit;

    const filter: any = { isActive: true };

    // Category filtering: Find shops that have products in this category
    if (query.category) {
      const categoryDoc = await Category.findOne({ slug: query.category });
      if (categoryDoc) {
        const shopIds = await Product.distinct('shopId', { categoryId: categoryDoc._id });
        filter._id = { $in: shopIds };
      } else {
        // If category slug is invalid, return empty results
        return { items: [], page, limit, total: 0, pages: 0 };
      }
    }

    const mongoQuery = query.search ? { ...filter, $text: { $search: query.search } } : filter;
    const findQuery = Shop.find(mongoQuery);

    // Sorting
    const sort: Record<string, SortOrder> =
      query.sort === 'popular'
        ? { createdAt: -1, _id: -1 } // Placeholder for popular (could be based on product count or orders)
        : query.sort === 'rating'
          ? { averageRating: -1, reviewCount: -1, createdAt: -1, _id: -1 }
          : { createdAt: -1, _id: -1 };

    findQuery.sort(sort).skip(skip).limit(limit);

    if (query.search) {
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
      findQuery.populate('ownerId', 'firstName lastName avatarPath').lean(),
      Shop.countDocuments(mongoQuery),
    ]);

    return {
      items: items.map(toShopDto),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  async getBySlug(slug: string) {
    const doc = await Shop.findOne({ slug, isActive: true })
      .populate('ownerId', 'firstName lastName avatarPath')
      .lean();
    if (!doc) throw new HttpError(404, 'shop.notFound');

    // Get a preview of the latest 4 products
    const products = await Product.find({ shopId: doc._id, isAvailable: true })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    return {
      ...toShopDto(doc),
      products: products.map(toProductDto),
    };
  },

  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'shop.invalidId');
    const doc = await Shop.findById(id).lean();
    if (!doc) throw new HttpError(404, 'shop.notFound');
    return toShopDto(doc);
  },

  async update(id: string, payload: any, ownerId: string, isAdmin: boolean) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'shop.invalidId');

    const filter: any = { _id: id };
    if (!isAdmin) filter.ownerId = new Types.ObjectId(ownerId);

    const updated = await Shop.findOneAndUpdate(filter, { $set: payload }, { new: true }).lean();
    if (!updated) throw new HttpError(404, 'shop.notFound');

    return toShopDto(updated);
  },

  async softDelete(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'shop.invalidId');
    const deleted = await Shop.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!deleted) throw new HttpError(404, 'shop.notFound');
    return { ok: true };
  },
};
