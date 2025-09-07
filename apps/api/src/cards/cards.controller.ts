import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import {
  CreateCardDto,
  UpdateCardDto,
  MoveCardDto,
  AddCardMemberDto,
  CreateCommentDto,
  CardFilterDto,
} from './dto/cards.dto';

@ApiTags('Cards')
@Controller('cards')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  @ApiOperation({ summary: 'Get cards with filters' })
  async findAll(@Query() filters: CardFilterDto, @Req() req) {
    return this.cardsService.findAll(
      filters.listId,
      filters.boardId,
      req.user.id
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get card by ID' })
  async findOne(@Param('id') id: string, @Req() req) {
    return this.cardsService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new card' })
  async create(@Body() createCardDto: CreateCardDto, @Req() req) {
    return this.cardsService.create(createCardDto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update card' })
  async update(
    @Param('id') id: string,
    @Body() updateCardDto: UpdateCardDto,
    @Req() req,
  ) {
    return this.cardsService.update(id, updateCardDto, req.user.id);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Move card to different list or position' })
  async move(
    @Param('id') id: string,
    @Body() moveCardDto: MoveCardDto,
    @Req() req,
  ) {
    return this.cardsService.move(id, moveCardDto, req.user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to card' })
  async addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddCardMemberDto,
    @Req() req,
  ) {
    return this.cardsService.addMember(id, addMemberDto, req.user.id);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove member from card' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req,
  ) {
    return this.cardsService.removeMember(id, memberId, req.user.id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get card comments' })
  async getComments(@Param('id') id: string, @Req() req) {
    return this.cardsService.getComments(id, req.user.id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to card' })
  async addComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req,
  ) {
    return this.cardsService.addComment(id, createCommentDto.text, req.user.id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive card' })
  async archive(@Param('id') id: string, @Req() req) {
    return this.cardsService.archive(id, req.user.id);
  }

  @Patch(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive card' })
  async unarchive(@Param('id') id: string, @Req() req) {
    return this.cardsService.unarchive(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete card' })
  async remove(@Param('id') id: string, @Req() req) {
    return this.cardsService.remove(id, req.user.id);
  }

  // Mobile-specific endpoints
  @Get('mobile/dashboard')
  @ApiOperation({ summary: 'Get mobile dashboard cards (assigned to user)' })
  async getMobileDashboard(@Req() req) {
    // Get cards assigned to current user across all organizations
    return this.cardsService.findAll(undefined, undefined, req.user.id);
  }

  @Get('mobile/recent')
  @ApiOperation({ summary: 'Get recently updated cards for mobile' })
  async getRecentCards(@Req() req) {
    // This would be implemented to return recently updated cards
    // TODO: Implement recent cards logic
    return this.cardsService.findAll(undefined, undefined, req.user.id);
  }

  @Get('mobile/due-soon')
  @ApiOperation({ summary: 'Get cards due soon for mobile notifications' })
  async getDueSoonCards(@Req() req) {
    // This would return cards due in the next 3 days
    // TODO: Implement due soon logic
    return this.cardsService.findAll(undefined, undefined, req.user.id);
  }

  @Get(':id/available-members')
  @ApiOperation({ summary: 'Get available members for card assignment' })
  async getAvailableMembers(@Param('id') id: string, @Req() req) {
    return this.cardsService.getAvailableMembers(id, req.user.id);
  }
}
