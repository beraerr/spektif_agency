import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService, FileUploadResult } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Body('boardId') boardId: string,
    @Body('cardId') cardId: string,
    @Req() req: any,
  ): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!boardId) {
      throw new BadRequestException('Board ID is required');
    }

    return this.filesService.uploadFile(file, boardId, req.user.id, cardId);
  }

  @Get('board/:boardId')
  async getBoardFiles(@Param('boardId') boardId: string): Promise<FileUploadResult[]> {
    return this.filesService.getBoardFiles(boardId);
  }

  @Get('card/:cardId')
  async getCardFiles(@Param('cardId') cardId: string): Promise<FileUploadResult[]> {
    return this.filesService.getCardFiles(cardId);
  }

  @Delete(':fileId')
  async deleteFile(@Param('fileId') fileId: string, @Req() req: any) {
    await this.filesService.deleteFile(fileId, req.user.id);
    return { message: 'File deleted successfully' };
  }
}
