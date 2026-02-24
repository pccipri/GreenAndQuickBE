import { Request, Response, Router } from 'express';
import {
  createFavorite,
  deleteFavorite,
  getAllFavorites,
  getFavoriteById,
  getFavoritesByUser,
  toggleProductInFavorite,
  updateFavorite,
} from '../services/FavoriteService';
import { IdParams } from '@/models/generic/Routes';

const router = Router();

// Create a Favorite
router.post('/', async (req: Request, res: Response) => {
  try {
    const response = await createFavorite(req.body);
    res.status(201).json(response);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create Favourite', error: error.message });
  }
});

// Get all Favorites
router.get('/', async (_req: Request, res: Response) => {
  try {
    const favourites = await getAllFavorites();
    res.json(favourites);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch Favourites', error: error.message });
  }
});

// Get Favorite by ID
router.get('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const favourite = await getFavoriteById(req.params.id);
    if (!favourite) res.status(404).json({ message: 'Favourite not found' });
    res.json(favourite);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch Favourite', error: error.message });
  }
});

// Get Favorites by user
router.get('/user/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const { id: userId } = req.params;
    const favourites = await getFavoritesByUser(userId);
    res.json(favourites);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch Favourites for user', error: error.message });
  }
});

// Update a Favorite
router.put('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const updated = await updateFavorite(req.params.id, req.body);
    if (!updated) res.status(404).json({ message: 'Favourite not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update Favourite', error: error.message });
  }
});

// Delete a Favorite
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const deleted = await deleteFavorite(req.params.id);
    if (!deleted) res.status(404).json({ message: 'Favourite not found' });
    res.json({ message: 'Favourite deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete Favourite', error: error.message });
  }
});

// PATCH /favorites/toggleProduct
router.patch('/toggleProduct', async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      res.status(400).json({ message: 'Missing userId or productId' });
    }

    const result = await toggleProductInFavorite(userId, productId);
    res.json({
      message: result.added ? 'Product added to favorites' : 'Product removed from favorites',
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to toggle product', error: error.message });
  }
});

export default router;
