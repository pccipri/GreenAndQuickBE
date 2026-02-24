import mongoose, { Schema } from 'mongoose';

export interface AddressDocument extends Document {
  street: string;
  city: string;
  county: string;
  country: string;
  zipcode: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const addressSchema = new Schema<AddressDocument>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    county: { type: String, required: true },
    country: { type: String, required: true },
    zipcode: { type: Number, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Address = mongoose.model<AddressDocument>('Address', addressSchema);
