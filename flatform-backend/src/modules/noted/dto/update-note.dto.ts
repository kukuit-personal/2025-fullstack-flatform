// src/modules/noted/dto/update-note.dto.ts
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsNumber()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  parentId?: string;
}
