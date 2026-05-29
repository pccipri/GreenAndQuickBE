import { getPublicFileUrl } from '@/services/StorageService';
import { PUBLIC_IMAGE_BUCKET } from '@/utils/constants';
import { toDto } from './GenericPresenter';

export function toReviewDto(doc: any) {
  const review = toDto<any>(doc);

  // Transform populated author info
  if (review.authorId && typeof review.authorId === 'object') {
    const author = review.authorId;
    review.author = {
      id: (author._id || author.id)?.toString(),
      firstName: author.firstName,
      lastName: author.lastName,
      avatarUrl: author.avatarPath
        ? getPublicFileUrl(PUBLIC_IMAGE_BUCKET, author.avatarPath)
        : null,
      email: author.email ?? undefined,
    };
    delete review.authorId;
  }

  return review;
}
