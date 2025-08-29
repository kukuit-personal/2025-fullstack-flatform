import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Giới hạn kích thước ảnh: 5MB */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export class CreateEmailImageDto {
  @ApiProperty({ description: 'CDN URL sau khi upload (Cloudinary/S3 + CDN)' })
  @IsString()
  url!: string;

  @ApiPropertyOptional({ description: 'Tên file gốc (tùy chọn)' })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({ description: 'MIME type, ví dụ image/jpeg' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Chiều rộng ảnh (px)' })
  @IsOptional()
  @IsInt()
  width?: number;

  @ApiPropertyOptional({ description: 'Chiều cao ảnh (px)' })
  @IsOptional()
  @IsInt()
  height?: number;

  @ApiPropertyOptional({ description: 'Kích thước file (bytes), ≤ 5MB' })
  @IsOptional()
  @IsInt()
  @Max(MAX_IMAGE_BYTES)
  bytes?: number;
}

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
    isArray: true,
    type: String,
  })
  @IsOptional()
  tagIds?: string[];

  // ====== BỔ SUNG: Danh sách ảnh đính kèm (Cloudinary/S3) ======
  @ApiPropertyOptional({
    description: 'Danh sách ảnh dùng trong template (đã upload, gửi metadata)',
    type: () => [CreateEmailImageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmailImageDto)
  images?: CreateEmailImageDto[];

  @ApiPropertyOptional({
    description: 'Nhận diện folder tạm khi upload my-storage',
  })
  @IsOptional()
  @IsString()
  draftId?: string;
}
