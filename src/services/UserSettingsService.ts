import { UserSettings } from '@/schemas/UserSettingsSchema';
import { sanitizeLanguage } from '../utils/languageValidator';

export const getUserSettingsByUserId = async (userId: string) => {
  return UserSettings.findOne({ userId });
};

export const createUserSettings = async (userId: string, preferredLanguage: string = 'en') => {
  const language = sanitizeLanguage(preferredLanguage);
  return UserSettings.create({ userId, preferredLanguage: language });
};

export const updateUserSettings = async (
  userId: string,
  preferredLanguage: string,
  currency?: string,
) => {
  const language = sanitizeLanguage(preferredLanguage);
  const updateData: Record<string, unknown> = {
    preferredLanguage: language,
  };

  if (currency) {
    updateData.currency = currency;
  }

  const settings = await UserSettings.findOneAndUpdate({ userId }, updateData, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });

  return settings;
};
