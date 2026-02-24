import { RecipeDoc } from '@/schemas/RecipeSchema';
import { UpdateQuery, UpdateWithAggregationPipeline } from 'mongoose';

function recipeTitleToSlug(title: string): string {
  return title
    .normalize('NFKD') // split accents from letters
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '') // remove apostrophes
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics -> hyphen
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, ''); // trim hyphens
}

type RecipeUpdate = UpdateWithAggregationPipeline | UpdateQuery<RecipeDoc>;

export const normalizeTitleAndSlug = (update: RecipeUpdate) => {
  const target: any =
    (update as any).$set && typeof (update as any).$set === 'object'
      ? (update as any).$set
      : update;

  const raw = (target as any).title;
  if (raw == null) return;
  if (typeof raw !== 'string') return;

  const normalizedTitle = raw.trim().replace(/\s+/g, ' ');
  if (!normalizedTitle) return;

  // update title
  (target as any).title = normalizedTitle;

  // also keep slug in sync if title is updated
  (target as any).slug = recipeTitleToSlug(normalizedTitle);
};
