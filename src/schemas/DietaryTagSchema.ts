import mongoose, { InferSchemaType, Model, Schema, Types } from 'mongoose';

const dietaryTagSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
  },
  { timestamps: true },
);

export type DietaryTagDoc = InferSchemaType<typeof dietaryTagSchema> & {
  _id: Types.ObjectId;
};

export const DietaryTag: Model<DietaryTagDoc> =
  mongoose.models.dietarytag || mongoose.model<DietaryTagDoc>('dietarytag', dietaryTagSchema);
