import { Request, Response, Router } from "express";
import { createFavourite, deleteFavourite, getAllFavourites, getFavouriteById, getFavouritesByUser, toggleProductInFavorite, updateFavourite } from "../services/FavouriteService";

const router = Router();

// Create a Favourite
router.post('/', async (req: Request, res: Response) => {
  try {
    const response = await createFavourite(req.body);
    res.status(201).json(response);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create Favourite', error: error.message });
  }
});

// Get all Favourites
router.get('/', async (_req: Request, res: Response) => {
  try {
    const favourites = await getAllFavourites();
    res.json(favourites);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch Favourites', error: error.message });
  }
});

// Get Favourite by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const favourite = await getFavouriteById(req.params.id);
    if (!favourite) res.status(404).json({ message: 'Favourite not found' });
    res.json(favourite);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch Favourite', error: error.message });
  }
});

// Get Favourites by user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const favourites = await getFavouritesByUser(req.params.userId);
    res.json(favourites);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch Favourites for user', error: error.message });
  }
});

// Update a Favourite
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateFavourite(req.params.id, req.body);
    if (!updated) res.status(404).json({ message: 'Favourite not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update Favourite', error: error.message });
  }
});

// Delete a Favourite
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteFavourite(req.params.id);
    if (!deleted) res.status(404).json({ message: 'Favourite not found' });
    res.json({ message: 'Favourite deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete Favourite', error: error.message });
  }
});

// PATCH /favorites/toggle-product
router.patch('/toggleProduct', async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      res.status(400).json({ message: 'Missing userId or productId' });
    }

    const result = await toggleProductInFavorite(userId, productId);
    res.json({
      message: result.added
        ? 'Product added to favorites'
        : 'Product removed from favorites'
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to toggle product', error: error.message });
  }
});

export default router;