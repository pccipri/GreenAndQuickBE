import { RecipeDoc } from '@/schemas/RecipeSchema';
import { UpdateQuery, UpdateWithAggregationPipeline } from 'mongoose';

type RecipeUpdate = UpdateWithAggregationPipeline | UpdateQuery<RecipeDoc>;

export const normalizeRating = (update: RecipeUpdate) => {
  const target: any =
    (update as any).$set && typeof (update as any).$set === 'object'
      ? (update as any).$set
      : update;

  const raw = (target as any).rating;
  if (raw == null) return;

  const v = Number(raw);
  if (!Number.isFinite(v)) return;

  const rounded = Math.round(v * 2) / 2; // half-star
  (target as any).rating = Math.min(5, Math.max(0, rounded));
};
