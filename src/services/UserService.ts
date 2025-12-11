
import { ICreateUserDTO, IUser } from '../models/IUser';
import { EmailConfirmationToken } from '../schemas/EmailConfirmationSchema';
import { User } from '../schemas/UserSchema';
import { encrypt } from '../utils/encryption';
import { sendVerificationEmail } from '../utils/mailer';
import { generateVerificationToken } from '../utils/tokens';

export const createUser = async (userToSave: ICreateUserDTO) => {
  const newUser = new User({
    ...userToSave,
    password: encrypt(userToSave.password),
    role: "user"
  });

  const response = await newUser.save();

  // Create verification token
  const { token, hashedToken } = generateVerificationToken();
  await EmailConfirmationToken.create({
    userId: response._id,
    tokenHash: hashedToken,
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
  });

  // Send email
  await sendVerificationEmail(response.email, token);

  return response._id;
};

export const getAllUsers = async () => {
  const users = await User.find({}, '-password');
  return users;
};

export const getUsersByRole = async (role: string) => {
  const users = await User.find({ role }, '-password');
  return users;
};

export const getUserById = async (id: string) => {
  const user = await User.findById(id, '-password');
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