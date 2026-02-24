import { Types } from 'mongoose';
import { IFavorite } from '../models/IFavorite';
import { Favorite } from '../schemas/FavoriteSchema';

export const createFavorite = async (FavoriteToSave: IFavorite) => {
  const newFavourite = new Favorite(FavoriteToSave);
  const response = await newFavourite.save();
  return !!response;
};

export const getAllFavorites = async () => {
  const favourites = await Favorite.find();
  return favourites.map((f) => f.toJSON());
};

export const getFavoriteById = async (id: string) => {
  const favourite = await Favorite.findById(id);
  return favourite || false;
};

export const getFavoritesByUser = async (userId: string) => {
  const favourites = await Favorite.find({ user: userId });
  return favourites || [];
};

export const updateFavorite = async (id: string, modifiedFavorite: IFavorite) => {
  const updatedFavourite = await Favorite.findByIdAndUpdate(id, modifiedFavorite, { new: true });
  return !!updatedFavourite;
};

export const deleteFavorite = async (id: string) => {
  const deletedFavourite = await Favorite.findByIdAndDelete(id);
  return !!deletedFavourite;
};

export const toggleProductInFavorite = async (userId: string, productId: string) => {
  const favorite = await Favorite.findOne({ user: userId });

  if (!favorite) {
    // Create a new favorite if it doesn't exist
    const newFavourite = new Favorite({
      user: userId,
      products: [productId],
    });
    await newFavourite.save();
    return { added: true };
  }

  const productObjectId = new Types.ObjectId(productId);
  const alreadyExists = favorite.products.some((p) => p.equals(productObjectId));

  if (alreadyExists) {
    // Remove the product
    favorite.products = favorite.products.filter((p) => !p.equals(productObjectId));
    await favorite.save();
    return { added: false };
  } else {
    // Add the product
    favorite.products.push(productObjectId);
    await favorite.save();
    return { added: true };
  }
};
