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
import {
  deletePublicImage,
  replacePublicImage,
  uploadPublicImage,
} from '@/services/PublicImageStorageService';
import { UserDocument } from '@/schemas/UserSchema';
import { toUserDto } from '@/presenters/UserPresenter';
import { upload } from '@/middlewares/upload';

const router = express.Router();

// Create a user
router.post('/', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const user: ICreateUserDTO = { ...req.body };

    const userId = await createUser(user);

    if (req.file) {
      const uploadedAvatar = await uploadPublicImage({
        file: req.file.buffer,
        mimeType: req.file.mimetype,
        originalFilename: req.file.originalname,
        folder: `users/${userId}/avatar`,
      });

      user.avatarPath = uploadedAvatar.path;
    }

    res.status(201).json({
      id: userId,
      message: 'User registered. Check email for verification link.',
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to create user',
      error: error.message,
    });
  }
});

// Get all users
router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsers();

    const usersWithAvatarUrl = users.map((user: UserDocument) => toUserDto(user));

    res.json(usersWithAvatarUrl);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get users by role
router.get('/role/:role', async (req: Request<RoleParams>, res: Response) => {
  try {
    const users = await getUsersByRole(req.params.role);

    const usersWithAvatarUrl = users.map((user: UserDocument) => toUserDto(user));

    res.json(usersWithAvatarUrl);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch users by role', error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const user: UserDocument | null = await getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(toUserDto(user));
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

// Update user
router.put('/:id', upload.single('avatar'), async (req: Request<IdParams>, res: Response) => {
  try {
    const existingUser: UserDocument | null = await getUserById(req.params.id);

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const payload: any = { ...req.body };

    // Remove avatar explicitly
    if (payload.removeAvatar === 'true' || payload.removeAvatar === true) {
      if (existingUser.avatarPath) {
        await deletePublicImage(existingUser.avatarPath);
      }

      payload.avatarPath = null;
      payload.avatar = null;
    }

    // Upload or replace avatar if a new file is provided
    if (req.file) {
      if (existingUser.avatarPath) {
        const replacedAvatar = await replacePublicImage({
          path: existingUser.avatarPath,
          file: req.file.buffer,
          mimeType: req.file.mimetype,
        });

        payload.avatarPath = replacedAvatar.path;
        payload.avatar = replacedAvatar.publicUrl;
      } else {
        const uploadedAvatar = await uploadPublicImage({
          file: req.file.buffer,
          mimeType: req.file.mimetype,
          originalFilename: req.file.originalname,
          folder: `users/${existingUser._id}/avatar`,
        });

        payload.avatarPath = uploadedAvatar.path;
        payload.avatar = uploadedAvatar.publicUrl;
      }
    }

    const updated: UserDocument | null = await updateUser(req.params.id, payload);

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(toUserDto(updated));
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to update user',
      error: error.message,
    });
  }
});

// Delete user
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const existingUser: UserDocument | null = await getUserById(req.params.id);

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (existingUser.avatarPath) {
      await deletePublicImage(existingUser.avatarPath);
    }

    const deleted = await deleteUser(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

export default router;
