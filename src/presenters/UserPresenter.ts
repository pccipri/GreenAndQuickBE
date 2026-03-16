import { UserDto } from '@/models/IUser';
import { UserDocument } from '@/schemas/UserSchema';
import { getPublicFileUrl } from '@/services/StorageService';
import { PUBLIC_IMAGE_BUCKET } from '@/utils/constants';

export function toUserDto(user: UserDocument): UserDto {
  return {
    ...user.toObject(),
    id: user._id.toString(),
    avatarUrl: user.avatarPath ? getPublicFileUrl(PUBLIC_IMAGE_BUCKET, user.avatarPath) : null,
  };
}
