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
import { getUserSettingsByUserId, updateUserSettings } from '@/services/UserSettingsService';
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
    const { preferredLanguage, ...userData } = req.body as any;
    const user: ICreateUserDTO = { ...userData };

    const userId = await createUser(user, preferredLanguage);

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
      preferredLanguage: preferredLanguage || 'en',
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to create user',
      error: error.message,
    });
  }
});

router.get('/:id/settings', async (req: Request<IdParams>, res: Response) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'user.notFound' });
    }

    const settings = await getUserSettingsByUserId(req.params.id);
    if (!settings) {
      return res.status(404).json({ error: 'user.settingsNotFound' });
    }

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: 'user.fetchSettingsFailed' });
  }
});

router.put('/:id/settings', async (req: Request<IdParams>, res: Response) => {
  try {
    const { preferredLanguage, currency } = req.body;
    if (!preferredLanguage) {
      return res.status(400).json({ error: 'user.preferredLanguageRequired' });
    }

    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'user.notFound' });
    }

    const updatedSettings = await updateUserSettings(req.params.id, preferredLanguage, currency);
    res.json(updatedSettings);
  } catch (error: any) {
    res.status(500).json({ error: 'user.updateSettingsFailed' });
  }
});

// Get all users
router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsers();

    const usersWithAvatarUrl = users.map((user: UserDocument) => toUserDto(user));

    res.json(usersWithAvatarUrl);
  } catch (error: any) {
    res.status(500).json({ error: 'user.fetchAllFailed' });
  }
});

// Get users by role
router.get('/role/:role', async (req: Request<RoleParams>, res: Response) => {
  try {
    const users = await getUsersByRole(req.params.role);

    const usersWithAvatarUrl = users.map((user: UserDocument) => toUserDto(user));

    res.json(usersWithAvatarUrl);
  } catch (error: any) {
    res.status(500).json({ error: 'user.fetchByRoleFailed' });
  }
});

// Get user by ID
router.get('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const user: UserDocument | null = await getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'user.notFound' });
    }

    res.json(toUserDto(user));
  } catch (error: any) {
    res.status(500).json({ error: 'user.fetchFailed' });
  }
});

// Update user
router.put('/:id', upload.single('avatar'), async (req: Request<IdParams>, res: Response) => {
  try {
    const existingUser: UserDocument | null = await getUserById(req.params.id);

    if (!existingUser) {
      return res.status(404).json({ error: 'user.notFound' });
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
      return res.status(404).json({ error: 'user.notFound' });
    }

    res.json(toUserDto(updated));
  } catch (error: any) {
    res.status(500).json({ error: 'user.updateFailed' });
  }
});

// Delete user
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const existingUser: UserDocument | null = await getUserById(req.params.id);

    if (!existingUser) {
      return res.status(404).json({ error: 'user.notFound' });
    }

    const deleted = await deleteUser(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'user.notFound' });
    }

    if (existingUser.avatarPath) {
      await deletePublicImage(existingUser.avatarPath);
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'user.deleteFailed' });
  }
});

export default router;
