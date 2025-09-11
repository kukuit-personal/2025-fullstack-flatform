import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateEmailTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(191)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(191)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Raw HTML content' })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasImages?: boolean;

  @ApiPropertyOptional({ description: 'Decimal(10,2)' })
  @IsOptional()
  @IsNumber({}, { message: 'price must be a number' })
  price?: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Liên kết tới EmailCustomer' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: '0 = disabled, 1 = active' })
  @IsOptional()
  @IsNumber()
  statusId?: number;

  @ApiPropertyOptional({
    description: 'Tag IDs để cập nhật (tuỳ bạn: replace hay merge)',
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  tagIds?: string[];

  // LƯU Ý: Không có draftId, images trong Update
}
