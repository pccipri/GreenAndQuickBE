import { Schema } from 'mongoose';

export const baseAddressSchema = new Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    county: { type: String, required: true },
    country: { type: String, required: true },
    zipcode: { type: String, required: true },
  },
  { _id: false }, // Base address is usually embedded
);
