import { CategoryDto } from '@/models/ICategory';
import { toDto } from './GenericPresenter';

export function toCategoryDto(doc: any): CategoryDto {
  // The ICategory interface already matches the desired DTO structure
  // with _id being converted to id by toDto.
  // No special image handling needed for categories.
  return toDto<CategoryDto>(doc);
}
