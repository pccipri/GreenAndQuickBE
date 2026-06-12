export default interface IDietaryTag {
  _id: string;
  key: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ICreateDietaryTagDTO = Omit<IDietaryTag, '_id' | 'createdAt' | 'updatedAt'>;
