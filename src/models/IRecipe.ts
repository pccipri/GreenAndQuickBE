export type DurationType = 'MINUTES' | 'HOURS';

export type IngredientUnit = 'g' | 'kg' | 'ml' | 'l' | 'tsp' | 'tbsp' | 'cup' | 'pcs';
export type NutrientUnit = 'kcal' | 'kJ' | 'g' | 'mg' | 'µg';

export interface MeasuredValue<L extends string, U extends string> {
  label: L;
  value: number;
  unit: U;
}

export type Ingredient = MeasuredValue<string, IngredientUnit>;
export type NutritionValue = MeasuredValue<
  'Energy' | 'Fat' | 'Saturates' | 'Carbohydrate' | 'Sugars' | 'Protein' | 'Salt',
  NutrientUnit
>;

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'DESSERT';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface NutritionPerPortion {
  energyKcal: number;
  energyKj: number;
  fat: number;
  saturates: number;
  carbohydrates: number;
  sugars: number;
  protein: number;
  salt: number;
}

export interface IRecipeInstruction {
  stepNumber: number;
  description: string;
  imagePath: string | null;
}

export interface IRecipe {
  _id: string;
  authorId: string;
  title: string;
  shortDescription: string;
  ingredients: Ingredient[];
  instructions: IRecipeInstruction[];
  mealType: MealType;
  difficulty: Difficulty | null;
  tags: string[] | null;
  servings: number;
  nutritionPerPortion: NutritionPerPortion | null;
  duration: number;
  durationType: DurationType;
  imagePath: string | null;
  nutritionValues: NutritionValue[] | null;
  isPublished: boolean;
  rating: number;
  reviewCount: number;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecipeDTO extends Omit<IRecipe, '_id' | 'imagePath | instructions.imagePath'> {
  id: string;
  imageUrl: string | null;
}

export type ICreateRecipeDTO = Omit<IRecipe, '_id' | 'createdAt' | 'updatedAt'>;
