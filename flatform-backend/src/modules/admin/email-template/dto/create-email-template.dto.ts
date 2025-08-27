import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEmailTemplateDto {
  @ApiProperty()
  @IsString()
  @MaxLength(191)
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(191)
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Raw HTML content' })
  @IsString()
  html!: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Has image assets attached',
  })
  @IsOptional()
  @IsBoolean()
  hasImages?: boolean;

  @ApiPropertyOptional({
    description: 'Decimal(10,2). Có thể truyền số hoặc string.',
  })
  @IsOptional()
  @IsNumber({}, { message: 'price must be a number', each: false })
  // Nếu muốn truyền string, có thể đổi sang IsString và convert ở service.
  price?: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Liên kết tới EmailCustomer' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Mặc định 1 = active' })
  @IsOptional()
  @IsNumber()
  statusId?: number;

  @ApiPropertyOptional({
    description: 'Tag IDs để gắn ngay khi tạo (optional)',
  })
  @IsOptional()
  tagIds?: string[];
}
