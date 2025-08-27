import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmailTemplateService } from './email-template.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { SearchEmailTemplatesDto } from './dto/search-email-templates.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Email Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email/templates')
export class EmailTemplateController {
  constructor(private readonly service: EmailTemplateService) {}

  @ApiOperation({ summary: 'Create email template' })
  @Post()
  create(@Req() req: any, @Body() dto: CreateEmailTemplateDto) {
    return this.service.create(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Search/list email templates (owner + shared)' })
  @Get()
  findAll(@Req() req: any, @Query() query: SearchEmailTemplatesDto) {
    return this.service.search(req.user.id, query);
  }

  @ApiOperation({ summary: 'Get one template (owner or shared)' })
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.id, id);
  }

  @ApiOperation({
    summary: 'Update template (owner or shared with EDIT/OWNER)',
  })
  @Put(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateEmailTemplateDto,
  ) {
    return this.service.update(req.user.id, id, dto);
  }

  @ApiOperation({ summary: 'Soft delete (owner only)' })
  @HttpCode(204)
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.service.softDelete(req.user.id, id);
  }
}
