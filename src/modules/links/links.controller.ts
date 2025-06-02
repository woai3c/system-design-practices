import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'

import { PaginationQueryDto } from '../../dtos/pagination.dto'
import { Public } from '../auth/decorators/public.decorator'
import { User } from '../auth/decorators/user.decorator'
import { CreateLinkDto, LinkExpirationDto, LinkVisibilityDto, UpdateLinkDto } from './link.dto'
import { LinksService } from './links.service'

@ApiTags('links')
@ApiBearerAuth()
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @ApiOperation({ summary: 'Create a new link' })
  @ApiBody({ type: CreateLinkDto })
  @ApiResponse({ status: 201, description: 'Link created successfully' })
  @Post()
  create(@User('userId') userId: string, @Body() createLinkDto: CreateLinkDto) {
    return this.linksService.create(userId, createLinkDto)
  }

  @ApiOperation({ summary: 'Get all links for current user with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of links' })
  @ApiQuery({ type: PaginationQueryDto, required: false })
  @Get()
  findAll(@User('userId') userId: string, @Query() paginationQuery: PaginationQueryDto) {
    return this.linksService.findAll(userId, paginationQuery)
  }

  @ApiOperation({ summary: 'Get link by ID' })
  @ApiParam({ name: 'id', description: 'Link ID' })
  @ApiResponse({ status: 200, description: 'Returns the link' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @Get(':id')
  findOne(@User('userId') userId: string, @Param('id') id: string) {
    return this.linksService.findById(id)
  }

  @ApiOperation({ summary: 'Get link by short URL' })
  @ApiParam({ name: 'shortUrl', description: 'Short URL' })
  @ApiResponse({ status: 200, description: 'Returns the link content' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @Public()
  @Get('by-short-url/:shortUrl')
  async findByShortUrl(@Param('shortUrl') shortUrl: string) {
    const { content } = await this.linksService.findByShortUrl(shortUrl)
    return content
  }

  @ApiOperation({ summary: 'Update link information' })
  @ApiParam({ name: 'id', description: 'Link ID' })
  @ApiBody({ type: UpdateLinkDto })
  @ApiResponse({ status: 200, description: 'Link updated successfully' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @Patch(':id')
  update(@User('userId') userId: string, @Param('id') id: string, @Body() updateLinkDto: UpdateLinkDto) {
    return this.linksService.update(id, userId, updateLinkDto)
  }

  @ApiOperation({ summary: 'Delete a link' })
  @ApiParam({ name: 'id', description: 'Link ID' })
  @ApiResponse({ status: 200, description: 'Link deleted successfully' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @Delete(':id')
  delete(@User('userId') userId: string, @Param('id') id: string) {
    return this.linksService.delete(id, userId)
  }

  @ApiOperation({ summary: 'Update link visibility' })
  @ApiParam({ name: 'id', description: 'Link ID' })
  @ApiBody({ type: LinkVisibilityDto })
  @ApiResponse({ status: 200, description: 'Link visibility updated successfully' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @Patch(':id/visibility')
  updateVisibility(
    @User('userId') userId: string,
    @Param('id') id: string,
    @Body() linkVisibilityDto: LinkVisibilityDto,
  ) {
    return this.linksService.updateVisibility(id, userId, linkVisibilityDto.visibility)
  }

  @ApiOperation({ summary: 'Update link expiration' })
  @ApiParam({ name: 'id', description: 'Link ID' })
  @ApiBody({ type: LinkExpirationDto })
  @ApiResponse({ status: 200, description: 'Link expiration updated successfully' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @Patch(':id/expiration')
  updateExpiration(
    @User('userId') userId: string,
    @Param('id') id: string,
    @Body() linkExpirationDto: LinkExpirationDto,
  ) {
    return this.linksService.updateExpiration(id, userId, linkExpirationDto.expiresAt)
  }
}
