import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';

export enum EmailTemplateSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  price = 'price',
}

export class SearchEmailTemplatesDto {
  @ApiPropertyOptional({ example: 'Template #1' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Tag name (contains)' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'Filter by tagIds (comma-separated)' })
  @IsOptional()
  @IsString()
  tagIds?: string; // "id1,id2"

  @ApiPropertyOptional({ description: 'Created from date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Created to date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  createdTo?: string;

  @ApiPropertyOptional({ description: 'Has images: "true" | "false"' })
  @IsOptional()
  @IsString()
  hasImages?: 'true' | 'false';

  @ApiPropertyOptional({ description: 'Default 1 (active)' })
  @IsOptional()
  @IsNumberString()
  statusId?: string;

  @ApiPropertyOptional({ example: '1', default: '1' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ example: '6', default: '6' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({
    enum: EmailTemplateSortBy,
    default: EmailTemplateSortBy.updatedAt,
  })
  @IsOptional()
  @IsEnum(EmailTemplateSortBy)
  sortBy?: EmailTemplateSortBy;
}
