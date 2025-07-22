// src/modules/noted/dto/search-notes.dto.ts
import {
  IsOptional,
  IsNumberString,
  IsEnum,
  IsString,
} from 'class-validator';

export enum NoteSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  SORT_ORDER = 'sortOrder',
}

export class SearchNotesDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumberString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  isFavorite?: 'true' | 'false';

  @IsOptional()
  @IsString()
  isArchived?: 'true' | 'false';

  @IsOptional()
  @IsEnum(NoteSortBy)
  sortBy?: NoteSortBy;
}
