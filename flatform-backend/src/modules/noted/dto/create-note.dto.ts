// src/modules/noted/dto/create-note.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsString()
  color?: string;
}
