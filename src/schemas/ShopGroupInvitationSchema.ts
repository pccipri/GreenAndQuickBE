import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ShopGroupInvitationDocument extends Document {
  groupId: Types.ObjectId;
  invitedShopId: Types.ObjectId;
  invitedByShopId: Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
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
