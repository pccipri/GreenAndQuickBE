import ILocation from "../models/ILocation";
import { Location } from "../schemas/LocationSchema";

// Create a new location
export const createLocation = async (locationToSave: ILocation) => {
  const newLocation = new Location(locationToSave);
  const response = await newLocation.save();

  return !!response;
};

// Get all locations
export const getAllLocations = async () => {
  const locations = await Location.find();
  return locations.map(location => location.toJSON());
};

// Get a single location by ID
export const getLocationById = async (id: string) => {
  const location = await Location.findById(id);

  return location || false;
};

// Update a location by ID
export const updateLocation = async (
  id: string,
  modifiedLocation: ILocation,
) => {
  const updatedLocation = await Location.findByIdAndUpdate(id, modifiedLocation, { new: true });

  return !!updatedLocation;
};

// Delete a location by ID
export const deleteLocation = async (id: string) => {
  const deletedLocation = await Location.findByIdAndDelete(id);

  return !!deletedLocation;
};
