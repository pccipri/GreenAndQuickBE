import { Product } from '@/schemas/ProductSchema';
import { Category } from '@/schemas/CategorySchema';
import { toProductDto } from '@/presenters/ProductPresenter';
import { HttpError } from '@/middlewares/errorHandler';
import { SortOrder, Types } from 'mongoose';

export type ProductListQuery = {
  search?: string;
  category?: string; // slug
  shopId?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
  available?: string | boolean;
  minPrice?: string | number;
  maxPrice?: string | number;
  page?: string | number;
  limit?: string | number;
};

export const productService = {
  async create(payload: any) {
    const doc = await Product.create(payload);
    return toProductDto(doc);
  },

  async list(query: ProductListQuery) {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.shopId && Types.ObjectId.isValid(query.shopId)) {
      filter.shopId = new Types.ObjectId(query.shopId);
    }

    if (query.category) {
      const categoryDoc = await Category.findOne({ slug: query.category });
      if (categoryDoc) {
        filter.categoryId = categoryDoc._id;
      } else {
        return { items: [], page, limit, total: 0, pages: 0 };
      }
    }

    if (query.available === 'true' || query.available === true) {
      filter.isAvailable = true;
      filter.stock = { $gt: 0 };
    }

    if (query.minPrice != null) {
      const minPrice = Number(query.minPrice);
      if (!Number.isNaN(minPrice)) {
        filter.price = { ...(filter.price ?? {}), $gte: minPrice };
      }
    }

    if (query.maxPrice != null) {
      const maxPrice = Number(query.maxPrice);
      if (!Number.isNaN(maxPrice)) {
        filter.price = { ...(filter.price ?? {}), $lte: maxPrice };
      }
    }

    const mongoQuery = query.search ? { ...filter, $text: { $search: query.search } } : filter;
    const findQuery = Product.find(mongoQuery);

    // Sorting logic
    const sort: Record<string, SortOrder> = { createdAt: -1, _id: -1 };
    if (query.sort === 'price_asc') sort.price = 1;
    if (query.sort === 'price_desc') sort.price = -1;
    if (query.sort === 'rating') {
      sort.averageRating = -1;
      sort.reviewCount = -1;
    }
    // "popular" is a placeholder for now, using createdAt

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
      findQuery.populate('shopId', 'name slug logo').lean(),
      Product.countDocuments(mongoQuery),
    ]);

    return {
      items: items.map(toProductDto),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'product.invalidId');
    const doc = await Product.findById(id).populate('shopId', 'name slug logo').lean();
    if (!doc) throw new HttpError(404, 'product.notFound');
    return toProductDto(doc);
  },

  async getBySlug(shopId: string, slug: string) {
    const doc = await Product.findOne({ shopId, slug }).populate('shopId', 'name slug logo').lean();
    if (!doc) throw new HttpError(404, 'product.notFound');
    return toProductDto(doc);
  },

  async update(id: string, payload: any, shopOwnerId: string, isAdmin: boolean) {
    const product = await Product.findById(id);
    if (!product) throw new HttpError(404, 'product.notFound');

    if (!isAdmin) {
      const shop = await product.populate('shopId');
      if ((shop.shopId as any).ownerId.toString() !== shopOwnerId) {
        throw new HttpError(403, 'auth.forbidden');
      }
    }

    const updated = await Product.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
    return toProductDto(updated);
  },

  async remove(id: string) {
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) throw new HttpError(404, 'product.notFound');
    return { ok: true };
  },

  /**
   * Searches for products by ingredient name using text index.
   * Filters for available and in-stock products.
   * @param query The search query (ingredient name).
   * @param limit The maximum number of results to return (default 10, max 30).
   * @returns An array of product DTOs.
   */
  async searchProductsByIngredient(query: string, limit: number = 10) {
    const effectiveLimit = Math.min(30, Math.max(1, limit));

    const filter = {
      $text: { $search: query },
      isAvailable: true,
      stock: { $gt: 0 },
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select({ score: { $meta: 'textScore' } as any }) // Select text score for relevance
        .sort({ score: { $meta: 'textScore' } as any }) // Sort by text score
        .populate('shopId', 'name slug logo') // Populate shop details
        .limit(effectiveLimit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      items: products.map(toProductDto),
      total,
    };
  },
};
