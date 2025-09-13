import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface FileUploadResult {
  id: string;
  fileName: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  boardId: string;
  cardId?: string;
  uploadedBy: string;
  createdAt: Date;
}

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async uploadFile(
    file: Express.Multer.File,
    boardId: string,
    userId: string,
    cardId?: string
  ): Promise<FileUploadResult> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const fileExtension = this.getFileExtension(file.originalname);
    const uniqueFileName = `${boardId}/${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;

    // For now, we'll store files locally
    // In production, integrate with Cloudflare R2 or AWS S3
    const fileUrl = await this.storeFileLocally(file, uniqueFileName);

    // Save file metadata to database
    const fileRecord = await this.prisma.file.create({
      data: {
        fileName: uniqueFileName,
        originalName: file.originalname,
        url: fileUrl,
        size: file.size,
        mimeType: file.mimetype,
        boardId,
        cardId,
        uploadedBy: userId,
      },
    });

    return {
      id: fileRecord.id,
      fileName: fileRecord.fileName,
      originalName: fileRecord.originalName,
      url: fileRecord.url,
      size: fileRecord.size,
      mimeType: fileRecord.mimeType,
      boardId: fileRecord.boardId,
      cardId: fileRecord.cardId,
      uploadedBy: fileRecord.uploadedBy,
      createdAt: fileRecord.createdAt,
    };
  }

  async getBoardFiles(boardId: string): Promise<FileUploadResult[]> {
    const files = await this.prisma.file.findMany({
      where: { boardId },
      orderBy: { createdAt: 'desc' },
    });

    return files.map(file => ({
      id: file.id,
      fileName: file.fileName,
      originalName: file.originalName,
      url: file.url,
      size: file.size,
      mimeType: file.mimeType,
      boardId: file.boardId,
      cardId: file.cardId,
      uploadedBy: file.uploadedBy,
      createdAt: file.createdAt,
    }));
  }

  async getCardFiles(cardId: string): Promise<FileUploadResult[]> {
    const files = await this.prisma.file.findMany({
      where: { cardId },
      orderBy: { createdAt: 'desc' },
    });

    return files.map(file => ({
      id: file.id,
      fileName: file.fileName,
      originalName: file.originalName,
      url: file.url,
      size: file.size,
      mimeType: file.mimeType,
      boardId: file.boardId,
      cardId: file.cardId,
      uploadedBy: file.uploadedBy,
      createdAt: file.createdAt,
    }));
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new BadRequestException('File not found');
    }

    // Check if user has permission to delete
    if (file.uploadedBy !== userId) {
      throw new BadRequestException('Not authorized to delete this file');
    }

    // Delete from database
    await this.prisma.file.delete({
      where: { id: fileId },
    });

    // TODO: Delete from storage (Cloudflare R2, S3, etc.)
    console.log(`🗑️ File ${file.fileName} deleted from storage`);
  }

  private validateFile(file: Express.Multer.File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 10MB.');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed.');
    }
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot);
  }

  private async storeFileLocally(file: Express.Multer.File, fileName: string): Promise<string> {
    // For development, store files in public/uploads
    // In production, this would upload to Cloudflare R2 or AWS S3
    const fs = require('fs');
    const path = require('path');
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, fileName);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, file.buffer);
    
    // Return public URL
    return `/uploads/${fileName}`;
  }
}
