import { Request, Response, Router } from 'express';
import { 
  createLocation, 
  deleteLocation, 
  getAllLocations, 
  getLocationById, 
  updateLocation 
} from '../services/LocationService';
import ILocation from '../models/ILocation';

const router = Router();

// Create a new location
router.post('/', async (req: Request, res: Response) => {
  try {
    const location: ILocation = req.body;
    const response = await createLocation(location);
    res.status(201).json(response);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create location', error: error.message });
  }
});

// Get all locations
router.get('/', async (req: Request, res: Response) => {
  try {
    const locations = await getAllLocations();
    res.json(locations);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch locations', error: error.message });
  }
});

// Get a single location by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = await getLocationById(id);
    
    if (!location) {
      res.status(404).json({ message: 'Location not found' });
    }
    res.json(location);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch location', error: error.message });
  }
});

// Update a location by ID
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const modifiedLocation = req.body;
    
    const updatedLocation = await updateLocation(id, modifiedLocation);
    
    if (!updatedLocation) {
      res.status(404).json({ message: 'Location not found' });
    }
    res.json(updatedLocation);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update location', error: error.message });
  }
});

// Delete a location by ID
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedLocation = await deleteLocation(id);
    
    if (!deletedLocation) {
      res.status(404).json({ message: 'Location not found' });
    }
    res.json({ message: 'Location deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete location', error: error.message });
  }
});

export default router;
