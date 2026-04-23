import { UserDto, UserSettingsDto } from '@/models/IUser';
import { UserDocument } from '@/schemas/UserSchema';
import { getPublicFileUrl } from '@/services/StorageService';
import { PUBLIC_IMAGE_BUCKET } from '@/utils/constants';

export function toUserDto(user: UserDocument): UserDto {
  const userObj = user.toObject();
  const dto: UserDto = {
    ...userObj,
    id: user._id.toString(),
    avatarUrl: user.avatarPath ? getPublicFileUrl(PUBLIC_IMAGE_BUCKET, user.avatarPath) : null,
  };

  if (
    userObj.userSettings &&
    typeof userObj.userSettings === 'object' &&
    '_id' in userObj.userSettings
  ) {
    const settings = userObj.userSettings as any;
    dto.userSettings = {
      userId: settings.userId?.toString?.() || settings.userId,
      preferredLanguage: settings.preferredLanguage,
      currency: settings.currency,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    } as UserSettingsDto;
  }

  return dto;
}
