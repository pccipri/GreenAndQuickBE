import { hashPassword } from '@/utils/encryption';
import { ICreateUserDTO, IUser } from '../models/IUser';
import { EmailConfirmationToken } from '../schemas/EmailConfirmationSchema';
import { PasswordResetToken } from '../schemas/PasswordResetTokenSchema';
import { User } from '../schemas/UserSchema';
import { UserSettings } from '../schemas/UserSettingsSchema';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mailer';
import { generateVerificationToken } from '../utils/tokens';
import { sanitizeLanguage } from '../utils/languageValidator';
import crypto from 'crypto';

export const createUser = async (userToSave: ICreateUserDTO, preferredLanguage: string = 'en') => {
  const language = sanitizeLanguage(preferredLanguage);
  const newUser = new User({
    ...userToSave,
    password: await hashPassword(userToSave.password),
    role: 'user',
  });

  const response = await newUser.save();

  const userSettings = await UserSettings.create({
    userId: response._id,
    preferredLanguage: language,
  });

  await User.findByIdAndUpdate(response._id, { userSettings: userSettings._id });

  // Create verification token
  const { token, hashedToken } = generateVerificationToken();
  await EmailConfirmationToken.create({
    userId: response._id,
    tokenHash: hashedToken,
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
  });

  // Send email
  await sendVerificationEmail(response.email, token, language, response.username ?? response.email);

  return response._id;
};

export const getAllUsers = async () => {
  const users = await User.find({}, '-password').populate('userSettings');
  return users;
};

export const getUsersByRole = async (role: string) => {
  const users = await User.find({ role }, '-password').populate('userSettings');
  return users;
};

export const getUserById = async (id: string) => {
  const user = await User.findById(id, '-password').populate('userSettings');
  return user || null;
};

export const updateUser = async (id: string, modifiedUserData: Partial<IUser>) => {
  const updated = await User.findByIdAndUpdate(id, modifiedUserData, { new: true });
  return updated || null;
};

export const deleteUser = async (id: string) => {
  const deleted = await User.findByIdAndDelete(id);
  return !!deleted;
};

export const requestPasswordReset = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Return success to avoid leaking user existence
    return { success: true };
  }

  const userSettings = await UserSettings.findOne({ userId: user._id });
  const language = userSettings?.preferredLanguage ?? 'en';

  // Generate token
  const { token, hashedToken } = generateVerificationToken();

  // Save hashed token
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: hashedToken,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  });

  // Send email
  await sendPasswordResetEmail(email, token, language, user.username ?? email);

  return { success: true };
};

export const resetPassword = async (token: string, newPassword: string) => {
  // Hash incoming token
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find token record
  const record = await PasswordResetToken.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    // Token not found or expired
    const maybeExpired = await PasswordResetToken.findOne({ tokenHash });
    if (maybeExpired) {
      await PasswordResetToken.deleteOne({ _id: maybeExpired._id });
    }
    return { success: false, message: 'Invalid or expired token' };
  }

  // Update user password
  const hashedPassword = await hashPassword(newPassword);
  await User.findByIdAndUpdate(record.userId, { password: hashedPassword });

  // Clean up all reset tokens for this user
  await PasswordResetToken.deleteMany({ userId: record.userId });

  return { success: true };
};
