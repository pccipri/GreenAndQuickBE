import express, { Request, Response } from 'express';
import { ICreateUserDTO } from '../models/IUser';
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  getUsersByRole,
  updateUser,
} from '../services/UserService';
import { IdParams, RoleParams } from '@/models/generic/Routes';

const router = express.Router();

// Create a user
router.post('/', async (req: Request, res: Response) => {
  try {
    const user: ICreateUserDTO = req.body;
    const userId = await createUser(user);
    res
      .status(201)
      .json({ id: userId, message: 'User registered. Check email for verification link.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
});

// Get all users
router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get users by role
router.get('/role/:role', async (req: Request<RoleParams>, res: Response) => {
  try {
    const users = await getUsersByRole(req.params.role);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch users by role', error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

// Update user
router.put('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const updated = await updateUser(req.params.id, req.body);
    if (!updated) res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

// Delete user
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const deleted = await deleteUser(req.params.id);
    if (!deleted) res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

export default router;
