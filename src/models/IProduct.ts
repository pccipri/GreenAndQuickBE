import FileDetails from "./generic/FileDetails";
import ICategory from "./ICategory";

export default interface IProduct<PlaceholderCategory = string | ICategory> {
  name: string;
  image: FileDetails;
  price: number;
  reducedPrice: number | null;
  //TO-DO: to be replaced with ILocation interface
  location: string | null;
  category: PlaceholderCategory
}
