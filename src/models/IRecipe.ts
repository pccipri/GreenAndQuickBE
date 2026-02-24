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

export interface IRecipe {
  id: string;
  authorId: string;
  title: string;
  shortDescription: string;
  ingredients: Ingredient[];
  instructions: string[];
  mealType: MealType;
  difficulty?: Difficulty;
  tags?: string[];
  servings: number;
  nutritionPerPortion?: NutritionPerPortion;
  duration: number;
  durationType: DurationType;
  imageUrl?: string;
  nutritionValues?: NutritionValue[];
  isPublished: boolean;
  rating: number;
  reviewCount: number;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}
