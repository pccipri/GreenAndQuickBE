
import IUser from '../models/IUser';
import { User } from '../schemas/UserSchema';
import { encrypt } from '../utils/encryption';

export const createUser = async (userToSave: IUser) => {
  const newUser = new User({
    ...userToSave,
    password: encrypt(userToSave.password),
  });

  const response = await newUser.save();
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