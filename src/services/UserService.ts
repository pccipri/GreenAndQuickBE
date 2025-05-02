
import IUser from '../models/IUser';
import { User } from '../schemas/UserSchema';
import { encrypt } from '../utils/encryption';

// Create a new user
export const createUser = async (userToSave: IUser) => {
  const newUser = new User({
    ...userToSave,
    password: encrypt(userToSave.password),
  });
  const response = await newUser.save();

  if (response) {
    return response._id;
  }

  return false;
};

// Get all users
export const getAllUsers = async () => {
  const users = await User.find();
  return users.map(user => user.toJSON());
};

// Get a users by accountType
export const getUsersByAccountTpe = async (accountType: string) => {
  const users = await User.find({ accountType }, '-password');

  if (!users) {
    return false;
  }

  return users;
};

// Get a single user by ID
export const getUserById = async (id: string) => {
  const user = await User.findById(id, '-password');

  if (!user) {
    return false;
  }

  return user;
};

// Update a user data by ID
export const updateUser = async (id: string, modifiedUserData: IUser) => {
  const updatedUser = await User.findByIdAndUpdate(id, modifiedUserData);

  if (updatedUser) {
    return true;
  }

  return false;
};

// Delete a user by ID
export const deleteUser = async (id: string) => {
  const deletedUser = await User.findByIdAndDelete(id);

  if (!deletedUser) {
    return false;
  }

  return true;
};
