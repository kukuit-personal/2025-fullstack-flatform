// dto/preview-thumbnail.dto.ts
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class PreviewThumbnailDto {
  @ApiProperty({ type: String })
  @IsString()
  html!: string;

  @ApiPropertyOptional({ type: String, description: 'Prefer when editing' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Use when creating (draft)',
  })
  @IsOptional()
  @IsString()
  draftId?: string;
}
