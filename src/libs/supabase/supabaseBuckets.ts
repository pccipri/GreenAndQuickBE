import { supaEnv } from '@/config/env';
import { supabase } from './supabase';

type RequiredBucket = {
  id: string;
  isPublic: boolean;
};

const REQUIRED_BUCKETS: RequiredBucket[] = [
  { id: 'public-images', isPublic: true },
  { id: 'private-documents', isPublic: false },
];

export async function ensureStorageBuckets(): Promise<void> {
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    throw new Error(`Failed to list buckets: ${error.name} ${error.message} ${error.statusCode}`);
  }

  const existingBucketIds = new Set((buckets ?? []).map((bucket) => bucket.id));

  for (const bucket of REQUIRED_BUCKETS) {
    if (existingBucketIds.has(bucket.id)) {
      console.log(`Bucket already exists: ${bucket.id}`);
      continue;
    }

    const { error: createError } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.isPublic,
    });

    if (createError) {
      const alreadyExists = createError.message.toLowerCase().includes('already exists');

      if (alreadyExists) {
        console.log(`Bucket already exists (race condition): ${bucket.id}`);
        continue;
      }

      throw new Error(`Failed to create bucket "${bucket.id}": ${createError.message}`);
    }

    console.log(`Created bucket: ${bucket.id}`);
  }
}
