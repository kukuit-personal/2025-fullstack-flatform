import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

// Helper: convert "" => undefined
const emptyToUndef = ({ value }: { value: any }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class SearchEmailTemplatesDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @IsPositive()
  limit?: number = 12;

  // ===== Filters =====
  @ApiPropertyOptional({ description: 'Search by name (contains, i/case)' })
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by a single tag name (contains-insensitive)',
    example: 'newsletter',
  })
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  tag?: string;

  @ApiPropertyOptional({
    description:
      'Filter by multiple tag names (comma-separated: "promo,newsletter")',
    example: 'promo,newsletter',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : Array.isArray(value)
      ? value
      : undefined,
  )
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Filter by customerId (exact)',
    example: 'cust_01HZZ…',
  })
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  customerId?: string;

  // 🆕 Many statuses (preferred)
  @ApiPropertyOptional({
    description:
      'Filter by multiple status IDs. Accepts comma-separated (e.g., "1,4,6")',
    example: '1,4,6',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const toNums = (arr: any[]) =>
      arr
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n)) as number[];
    if (typeof value === 'string') return toNums(value.split(','));
    if (Array.isArray(value)) return toNums(value);
    const n = Number(value);
    return Number.isFinite(n) ? [n] : undefined;
  })
  @IsArray()
  @IsInt({ each: true })
  statusIds?: number[];

  // (Optional backward-compat) single statusId
  @ApiPropertyOptional({
    description: 'Filter by a single statusId (exact). Deprecated: use statusIds.',
    example: 4,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsInt()
  statusId?: number;

  @ApiPropertyOptional({
    description: 'Created from (inclusive)',
    example: '2025-09-01',
  })
  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndef)
  createdFrom?: string;

  @ApiPropertyOptional({
    description: 'Created to (inclusive)',
    example: '2025-09-30',
  })
  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndef)
  createdTo?: string;

  @ApiPropertyOptional({
    description: 'Updated from (inclusive)',
    example: '2025-09-01',
  })
  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndef)
  updatedFrom?: string;

  @ApiPropertyOptional({
    description: 'Updated to (inclusive)',
    example: '2025-09-30',
  })
  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndef)
  updatedTo?: string;

  // ===== Extra (tuỳ chọn) =====
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['updatedAt', 'createdAt', 'name', 'price'],
    default: 'updatedAt',
  })
  @IsOptional()
  @IsIn(['updatedAt', 'createdAt', 'name', 'price'])
  sortBy?: 'updatedAt' | 'createdAt' | 'name' | 'price' = 'updatedAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc' = 'desc';
}
