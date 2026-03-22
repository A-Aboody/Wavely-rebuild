import {
  Controller,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService, UploadType } from './upload.service';
import { Request } from 'express';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: UploadType,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!type || !['profile', 'wave', 'media'].includes(type)) {
      throw new BadRequestException(
        'Invalid upload type. Must be: profile, wave, or media',
      );
    }

    const userId = req.user['sub'];
    const result = await this.uploadService.uploadFile(file, type, userId);

    return {
      success: true,
      data: result,
    };
  }

  @Delete(':key')
  async deleteFile(@Param('key') key: string, @Req() req: Request) {
    // Decode the key (it might be URL encoded)
    const decodedKey = decodeURIComponent(key);

    // Verify that the file belongs to the user (optional security check)
    const userId = req.user['sub'];

    // Check if the key contains the user's ID (basic ownership check)
    if (!decodedKey.includes(userId) && !decodedKey.includes('anonymous')) {
      throw new BadRequestException(
        'You do not have permission to delete this file',
      );
    }

    await this.uploadService.deleteFile(decodedKey);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  @Post('signed-url')
  async getSignedUrl(
    @Body('key') key: string,
    @Body('expiresIn') expiresIn: number = 3600,
  ) {
    if (!key) {
      throw new BadRequestException('No key provided');
    }

    const url = await this.uploadService.getSignedUrl(key, expiresIn);

    return {
      success: true,
      url,
    };
  }
}
