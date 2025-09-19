import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

import { EmailTemplateService } from './email-template.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { ThumbnailService } from './thumbnail.service';
import { SearchEmailTemplatesDto } from './dto/search-email-templates.dto';
import { PreviewThumbnailDto } from './dto/preview-thumbnail.dto';

@ApiTags('Email Templates (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/email/templates')
export class EmailTemplateAdminController {
  constructor(
    private readonly service: EmailTemplateService,
    private readonly thumbs: ThumbnailService,
  ) {}

  // --------------------------
  // Generate thumbnail preview from HTML
  // --------------------------
  @Roles('admin')
  @Post('thumbnail/preview')
  @ApiOperation({ summary: 'Generate thumbnail preview from HTML (admin)' })
  @ApiBody({ type: PreviewThumbnailDto })
  async generatePreview(@Body() body: PreviewThumbnailDto) {
    const { html, templateId, draftId } = body;
    if (!html?.trim()) throw new BadRequestException('html is required');

    // Ưu tiên templateId > draftId
    const scope = templateId?.trim()
      ? { kind: 'template' as const, id: templateId.trim() }
      : draftId?.trim()
        ? { kind: 'draft' as const, id: draftId.trim() }
        : null;

    if (!scope) {
      throw new BadRequestException('Provide templateId or draftId');
    }

    // Service giờ nhận {html, scope}
    const { url200, url600 } = await this.thumbs.generatePreviewFromHtml({
      html,
      scope, // { kind: 'template' | 'draft', id: string }
    });

    return { url_thumbnail: url200, url_thumbnailx600: url600 };
  }

  // --------------------------
  // Create
  // --------------------------
  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Create email template (admin)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template has been created',
  })
  create(@Req() req: any, @Body() dto: CreateEmailTemplateDto) {
    return this.service.create(req.user, dto);
  }

  // --------------------------
  // Search / List (pagination)
  // --------------------------
  @Roles('admin')
  @Get()
  @ApiOperation({
    summary: 'Get email templates (search/paginate/filter) - admin',
  })
  @ApiResponse({ status: 200, description: 'List with pagination' })
  async findAll(@Req() req: any, @Query() query: SearchEmailTemplatesDto) {
    return this.service.search(req.user, query);
  }

  // --------------------------
  // Get one
  // --------------------------
  @Roles('admin')
  @Get(':id')
  @ApiOperation({ summary: 'Get email template by ID (admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Template found' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user, id);
  }

  // --------------------------
  // Update
  // --------------------------
  @Roles('admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Update email template (admin)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template has been updated',
  })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateEmailTemplateDto,
  ) {
    return this.service.update(req.user, id, dto);
  }

  // --------------------------
  // Soft delete
  // --------------------------
  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete email template (admin)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Template has been soft-deleted',
  })
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.service.softDelete(req.user, id);
  }
}
