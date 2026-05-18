import { Types } from 'mongoose';
import { IShopGroup } from '@/models/IShopGroup';
import { ShopGroup } from '@/schemas/ShopGroupSchema';
import { HttpError } from '@/middlewares/errorHandler';

export const shopGroupService = {
  /**
   * Create a new shop group.
   * Only shop owners can create groups.
   */
  async create(ownerId: string, payload: Partial<IShopGroup>) {
    const group = await ShopGroup.create({
      ...payload,
      ownerId: new Types.ObjectId(ownerId),
    });
    return group.toJSON();
  },

  /**
   * Get all active shop groups with populated shops and owner info.
   */
  async list() {
    const groups = await ShopGroup.find({ isActive: true })
      .populate('shops', 'name slug logo')
      .populate('ownerId', 'firstName lastName email')
      .lean();
    return groups;
  },

  /**
   * Get a shop group by ID.
   */
  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'shopGroup.invalidId');
    const group = await ShopGroup.findById(id)
      .populate('shops', 'name slug logo')
      .populate('ownerId', 'firstName lastName email')
      .lean();
    if (!group) throw new HttpError(404, 'shopGroup.notFound');
    return group;
  },

  /**
   * Get a shop group by slug.
   */
  async getBySlug(slug: string) {
    const group = await ShopGroup.findOne({ slug, isActive: true })
      .populate('shops', 'name slug logo')
      .populate('ownerId', 'firstName lastName email')
      .lean();
    if (!group) throw new HttpError(404, 'shopGroup.notFound');
    return group;
  },

  /**
   * Update a shop group. Only the owner or an admin can perform this.
   */
  async update(id: string, payload: Partial<IShopGroup>, requesterId: string, isAdmin: boolean) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'shopGroup.invalidId');
    const filter: any = { _id: id };
    if (!isAdmin) filter.ownerId = new Types.ObjectId(requesterId);

    const updated = await ShopGroup.findOneAndUpdate(
      filter,
      { $set: payload },
      { new: true, runValidators: true },
    ).lean();

    if (!updated) throw new HttpError(404, 'shopGroup.notFound');
    return updated;
  },

  /**
   * Hard delete a shop group.
   */
  async remove(id: string, requesterId: string, isAdmin: boolean) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'shopGroup.invalidId');
    const filter: any = { _id: id };
    if (!isAdmin) filter.ownerId = new Types.ObjectId(requesterId);

    const res = await ShopGroup.deleteOne(filter);
    if (res.deletedCount === 0) throw new HttpError(404, 'shopGroup.notFound');
    return { ok: true };
  },
};
