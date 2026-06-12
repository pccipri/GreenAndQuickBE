import { Types } from 'mongoose';
import { IShopGroup } from '@/models/IShopGroup';
import { IShopGroupInvitation } from '@/models/IShopGroupInvitation';
import { ShopGroup } from '@/schemas/ShopGroupSchema';
import { ShopGroupInvitation } from '@/schemas/ShopGroupInvitationSchema';
import { Shop } from '@/schemas/ShopSchema'; // Assuming ShopSchema exists
import { HttpError } from '@/middlewares/errorHandler';
import mongoose from 'mongoose';
import { normalizeNameAndSlug } from '@/middlewares/normalizeNameAndSlug';
import {
  toShopGroupInvitationDto,
  toShopGroupInvitationDtos,
} from '@/presenters/ShopGroupInvitationPresenter';

export const shopGroupService = {
  /**
   * Create a new shop group.
   * Only shop owners can create groups. The creator's shop is automatically added as the first member.
   */
  async create(ownerUserId: string, payload: Partial<IShopGroup>) {
    const ownerShop = await Shop.findOne({ ownerId: new Types.ObjectId(ownerUserId) });
    if (!ownerShop) {
      throw new HttpError(404, 'shopGroup.ownerShopNotFound');
    }

    const slug = normalizeNameAndSlug(payload.name!); // Assuming name is always provided and validated by Zod

    try {
      const group = await ShopGroup.create({
        ...payload,
        ownerId: new Types.ObjectId(ownerUserId),
        shops: [ownerShop._id], // Add owner's shop as the first member
        slug,
      });
      return group.toJSON();
    } catch (error: any) {
      if (error.code === 11000 && error.keyPattern?.slug) {
        throw new HttpError(409, 'shopGroup.slugAlreadyExists');
      }
      throw error;
    }
  },

  /**
   * Get all active shop groups with populated shops and owner info. Supports search and pagination.
   */
  async list(search?: string, page: number = 1, limit: number = 10) {
    const filter: any = { isActive: true };
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [groups, total] = await Promise.all([
      ShopGroup.find(filter)
        .populate('shops', 'name slug logo')
        .populate('ownerId', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .lean(),
      ShopGroup.countDocuments(filter),
    ]);

    return {
      groups: groups.map((g: any) => ({
        ...g,
        shopCount: g.shops.length,
        pickupCity: g.pickupAddress.city,
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
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
   * If name is updated, slug is regenerated.
   */
  async update(
    id: string,
    payload: Partial<IShopGroup>,
    requesterUserId: string,
    isAdmin: boolean,
  ) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'shopGroup.invalidId');
    const filter: any = { _id: id };
    if (!isAdmin) filter.ownerId = new Types.ObjectId(requesterUserId);

    if (payload.name) {
      payload.slug = normalizeNameAndSlug(payload.name);
    }

    const updated = await ShopGroup.findOneAndUpdate(
      filter,
      { $set: payload }, // Use $set to allow partial updates
      { new: true, runValidators: true },
    ).lean();

    if (!updated) throw new HttpError(404, 'shopGroup.notFound');
    return updated;
  },

  /**
   * Soft delete (deactivate) a shop group.
   * Only the owner or an admin can perform this.
   */
  async deactivateGroup(id: string, requesterUserId: string, isAdmin: boolean) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'shopGroup.invalidId');
    const filter: any = { _id: id };
    if (!isAdmin) filter.ownerId = new Types.ObjectId(requesterUserId);

    const res = await ShopGroup.findOneAndUpdate(
      filter,
      { $set: { isActive: false } },
      { new: true },
    );
    if (!res) throw new HttpError(404, 'shopGroup.notFound');
    return { message: 'Shop group deactivated successfully' };
  },

  /**
   * Add a shop to a group.
   */
  async joinGroup(groupId: string, shopId: string) {
    if (!Types.ObjectId.isValid(groupId)) throw new HttpError(400, 'shopGroup.invalidGroupId');
    if (!Types.ObjectId.isValid(shopId)) throw new HttpError(400, 'shopGroup.invalidShopId');

    const updatedGroup = await ShopGroup.findOneAndUpdate(
      { _id: groupId, isActive: true },
      { $addToSet: { shops: new Types.ObjectId(shopId) } },
      { new: true },
    );

    if (!updatedGroup) throw new HttpError(404, 'shopGroup.notFound');
    return updatedGroup.toJSON();
  },

  /**
   * Remove a shop from a group.
   * Group owner cannot remove their own shop unless they delete the group.
   */
  async leaveGroup(groupId: string, shopId: string, requesterUserId: string) {
    if (!Types.ObjectId.isValid(groupId)) throw new HttpError(400, 'shopGroup.invalidGroupId');
    if (!Types.ObjectId.isValid(shopId)) throw new HttpError(400, 'shopGroup.invalidShopId');

    const group = await ShopGroup.findById(groupId);
    if (!group) throw new HttpError(404, 'shopGroup.notFound');

    const requesterShop = await Shop.findOne({ ownerId: new Types.ObjectId(requesterUserId) });
    if (!requesterShop) throw new HttpError(404, 'shopGroup.requesterShopNotFound');

    // Check if the requester is the group owner
    const isGroupOwner = group.ownerId.equals(requesterUserId);

    // If the shop to be removed is the owner's shop, and the requester is the owner, prevent leaving
    if (
      group.shops.includes(new Types.ObjectId(shopId)) &&
      group.ownerId.equals(requesterUserId) &&
      new Types.ObjectId(shopId).equals(requesterShop._id)
    ) {
      throw new HttpError(403, 'shopGroup.ownerCannotLeaveOwnGroup');
    }

    // Only group owner or the shop itself can remove a member
    if (!isGroupOwner && !new Types.ObjectId(shopId).equals(requesterShop._id)) {
      throw new HttpError(403, 'shopGroup.notAuthorizedToRemoveMember');
    }

    const updatedGroup = await ShopGroup.findByIdAndUpdate(
      groupId,
      { $pull: { shops: new Types.ObjectId(shopId) } },
      { new: true },
    );

    if (!updatedGroup) throw new HttpError(404, 'shopGroup.notFound');
    return updatedGroup.toJSON();
  },

  /**
   * Send an invitation to a shop to join a group.
   * Only the group owner can send invitations.
   */
  async sendInvitation(
    groupId: string,
    targetShopId: string,
    invitedByUserId: string,
  ): Promise<IShopGroupInvitation> {
    if (!Types.ObjectId.isValid(groupId)) throw new HttpError(400, 'shopGroup.invalidGroupId');
    if (!Types.ObjectId.isValid(targetShopId))
      throw new HttpError(400, 'shopGroup.invalidTargetShopId');

    const group = await ShopGroup.findOne({ _id: groupId, isActive: true });
    if (!group) throw new HttpError(404, 'shopGroup.notFound');

    const invitedByShop = await Shop.findOne({ ownerId: new Types.ObjectId(invitedByUserId) });
    if (!invitedByShop) throw new HttpError(404, 'shopGroup.inviterShopNotFound');

    // Verify that the inviter is the owner of the group
    if (!group.ownerId.equals(invitedByUserId)) {
      throw new HttpError(403, 'shopGroup.notGroupOwner');
    }

    const targetShop = await Shop.findById(targetShopId);
    if (!targetShop || !targetShop.isActive) {
      throw new HttpError(404, 'shopGroup.targetShopNotFoundOrInactive');
    }

    // Check if target shop is already a member
    if (group.shops.includes(new Types.ObjectId(targetShopId))) {
      throw new HttpError(409, 'shopGroup.shopAlreadyMember');
    }

    // Check for existing pending invitation
    const existingInvitation = await ShopGroupInvitation.findOne({
      groupId: new Types.ObjectId(groupId),
      invitedShopId: new Types.ObjectId(targetShopId),
      status: 'pending',
    });
    if (existingInvitation) {
      throw new HttpError(409, 'shopGroup.pendingInvitationExists');
    }

    const invitation = await ShopGroupInvitation.create({
      groupId: new Types.ObjectId(groupId),
      invitedShopId: new Types.ObjectId(targetShopId),
      invitedByShopId: invitedByShop._id,
      status: 'pending',
    });

    return toShopGroupInvitationDto(invitation.toJSON());
  },

  /**
   * Respond to a shop group invitation.
   * Only the invited shop owner can respond.
   */
  async respondToInvitation(
    invitationId: string,
    shopOwnerUserId: string,
    status: 'accepted' | 'declined',
  ): Promise<IShopGroupInvitation> {
    if (!Types.ObjectId.isValid(invitationId))
      throw new HttpError(400, 'shopGroup.invalidInvitationId');

    const invitation = await ShopGroupInvitation.findById(invitationId);
    if (!invitation) throw new HttpError(404, 'shopGroup.invitationNotFound');

    const invitedShop = await Shop.findOne({ ownerId: new Types.ObjectId(shopOwnerUserId) });
    if (!invitedShop || !invitation.invitedShopId.equals(invitedShop._id)) {
      throw new HttpError(403, 'shopGroup.notAuthorizedToRespond');
    }

    if (invitation.status !== 'pending') {
      throw new HttpError(409, 'shopGroup.invitationAlreadyResponded');
    }

    const group = await ShopGroup.findById(invitation.groupId);
    if (!group) {
      throw new HttpError(404, 'shopGroup.notFound');
    }

    if (!group.isActive && status === 'accepted') {
      throw new HttpError(409, 'shopGroup.groupInactiveCannotAccept');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      invitation.status = status;
      await invitation.save({ session });

      if (status === 'accepted') {
        // Add shop to group, handling potential duplicates with $addToSet
        await ShopGroup.findByIdAndUpdate(
          invitation.groupId,
          { $addToSet: { shops: invitation.invitedShopId } },
          { session },
        );
      }

      await session.commitTransaction();
      return toShopGroupInvitationDto(invitation.toJSON());
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Get all pending invitations for a specific shop owner.
   */
  async getInvitationsForShop(shopOwnerUserId: string): Promise<IShopGroupInvitation[]> {
    const shop = await Shop.findOne({ ownerId: new Types.ObjectId(shopOwnerUserId) });
    if (!shop) throw new HttpError(404, 'shopGroup.shopNotFoundForUser');

    const invitations = await ShopGroupInvitation.find({
      invitedShopId: shop._id,
      status: 'pending',
    })
      .populate('groupId', 'name description pickupAddress')
      .populate('invitedByShopId', 'name')
      .lean();

    return toShopGroupInvitationDtos(invitations);
  },

  /**
   * Get all invitations (pending, accepted, declined) for a specific group.
   * Only the group owner can view these.
   */
  async getInvitationsForGroup(
    groupId: string,
    requesterUserId: string,
    status?: string,
  ): Promise<IShopGroupInvitation[]> {
    if (!Types.ObjectId.isValid(groupId)) throw new HttpError(400, 'shopGroup.invalidGroupId');

    const group = await ShopGroup.findById(groupId);
    if (!group) throw new HttpError(404, 'shopGroup.notFound');

    // Verify that the requester is the owner of the group
    if (!group.ownerId.equals(requesterUserId)) {
      throw new HttpError(403, 'shopGroup.notGroupOwner');
    }

    const query: any = { groupId: new Types.ObjectId(groupId) };
    if (status) {
      query.status = status;
    }

    const invitations = await ShopGroupInvitation.find(query)
      .populate('invitedShopId', 'name logo')
      .populate('invitedByShopId', 'name logo')
      .lean();

    return toShopGroupInvitationDtos(invitations);
  },
};
