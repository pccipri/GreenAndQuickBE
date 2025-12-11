import mongoose, { Schema, Types } from "mongoose";

export interface IEmailConfirmationToken extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
}

const tokenSchema = new Schema<IEmailConfirmationToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

export const EmailConfirmationToken = mongoose.model<IEmailConfirmationToken>(
  'EmailConfirmationToken',
  tokenSchema
);