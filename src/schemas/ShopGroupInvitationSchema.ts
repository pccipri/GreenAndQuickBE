import mongoose, { Document, Schema, Types } from 'mongoose';
import { IShopGroupInvitation } from '@/models/IShopGroupInvitation';

export interface ShopGroupInvitationDocument
  extends
    Document,
    Omit<IShopGroupInvitation, '_id' | 'groupId' | 'invitedShopId' | 'invitedByShopId'> {
  groupId: Types.ObjectId;
  invitedShopId: Types.ObjectId;
  invitedByShopId: Types.ObjectId;
}

const shopGroupInvitationSchema = new Schema<ShopGroupInvitationDocument>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'ShopGroup', required: true },
    invitedShopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    invitedByShopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
      required: true,
    },
  },
  { timestamps: true },
);

// Ensure only one pending invitation exists per shop per group
shopGroupInvitationSchema.index(
  { groupId: 1, invitedShopId: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);
shopGroupInvitationSchema.index({ invitedShopId: 1 });

export const ShopGroupInvitation = mongoose.model<ShopGroupInvitationDocument>(
  'ShopGroupInvitation',
  shopGroupInvitationSchema,
);
