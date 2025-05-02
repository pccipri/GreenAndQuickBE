import express, { Request, Response } from 'express';
import IUser from '../models/IUser';
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  getUsersByAccountTpe,
  updateUser,
} from '../services/UserService';

const router = express.Router();

// Create a new user
router.post('/', async (req: Request, res: Response) => {
  try {
    const user: IUser = req.body;

    const response = await createUser(user);

    res.status(201).json(response);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Failed to create user', error: error.message });
  }
});

// Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get Users by Account type
router.get('/type/:accountType', async (req: Request, res: Response) => {
  try {
    const { accountType } = req.params;

    const users = await getUsersByAccountTpe(accountType.toUpperCase());
    res.json(users);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get a single user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Failed to fetch user', error: error.message });
  }
});

// Update a user by ID
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const modifiedUser = req.body;

    const updatedUser = await updateUser(id, modifiedUser);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Failed to update user', error: error.message });
  }
});

// Delete a user by ID
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedUser = await deleteUser(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Failed to delete user', error: error.message });
  }
});

export default router;
