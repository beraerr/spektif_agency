import { Controller, Get, Post, Patch, Delete, UseGuards, Query, Req, Param, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { CreateBoardDto, UpdateBoardDto, CreateListDto, UpdateListDto } from './dto/boards.dto';

@ApiTags('Boards')
@Controller('boards')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  findAll(@Query('organizationId') organizationId: string, @Req() req) {
    return this.boardsService.findAll(organizationId, req.user.id);
  }

  @Get('employee')
  findEmployeeBoards(@Query('organizationId') organizationId: string, @Req() req) {
    return this.boardsService.findEmployeeBoards(organizationId, req.user.id);
  }

  @Post(':id/assign-user')
  assignUserToBoard(@Param('id') boardId: string, @Body() body: { userId: string }, @Req() req) {
    return this.boardsService.assignUserToBoard(boardId, body.userId, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.boardsService.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() createBoardDto: CreateBoardDto, @Req() req) {
    return this.boardsService.create(createBoardDto, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto, @Req() req) {
    return this.boardsService.update(id, updateBoardDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.boardsService.remove(id, req.user.id);
  }

  // List operations
  @Post('lists')
  createList(@Body() createListDto: CreateListDto, @Req() req) {
    return this.boardsService.createList(createListDto, req.user.id);
  }

  @Patch('lists/:id')
  updateList(@Param('id') id: string, @Body() updateListDto: UpdateListDto, @Req() req) {
    return this.boardsService.updateList(id, updateListDto, req.user.id);
  }

  @Delete('lists/:id')
  deleteList(@Param('id') id: string, @Req() req) {
    return this.boardsService.deleteList(id, req.user.id);
  }

  @Post(':id/reorder-lists')
  reorderLists(@Param('id') boardId: string, @Body() body: { listOrders: { id: string; position: number }[] }, @Req() req) {
    return this.boardsService.reorderLists(boardId, body.listOrders, req.user.id);
  }
}
