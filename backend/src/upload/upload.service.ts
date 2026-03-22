import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  contentType: string;
}

export type UploadType = 'profile' | 'wave' | 'media';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private cloudFrontUrl: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET');
    this.cloudFrontUrl = this.configService.get<string>('AWS_CLOUDFRONT_URL');

    if (!accessKeyId || !secretAccessKey || !this.bucketName) {
      console.warn(
        'AWS credentials not configured. File uploads will not work.',
      );
      return;
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    file: Express.Multer.File,
    type: UploadType,
    userId?: string,
  ): Promise<UploadResult> {
    if (!this.s3Client) {
      throw new BadRequestException('File upload service not configured');
    }

    // Validate file
    this.validateFile(file, type);

    // Process image if needed
    let buffer = file.buffer;
    let contentType = file.mimetype;

    if (this.isImage(file.mimetype)) {
      const processed = await this.processImage(buffer, type);
      buffer = processed.buffer;
      contentType = processed.contentType;
    }

    // Generate unique filename
    const key = this.generateKey(type, file.originalname, userId);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // ACL removed - bucket should be configured for public access via bucket policy
      Metadata: {
        originalName: file.originalname,
        uploadedBy: userId || 'anonymous',
        uploadedAt: new Date().toISOString(),
      },
    });

    await this.s3Client.send(command);

    // Generate URL
    const url = this.cloudFrontUrl
      ? `${this.cloudFrontUrl}/${key}`
      : `https://${this.bucketName}.s3.amazonaws.com/${key}`;

    return {
      url,
      key,
      size: buffer.length,
      contentType,
    };
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.s3Client) {
      throw new BadRequestException('File upload service not configured');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Generate signed URL for private files
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3Client) {
      throw new BadRequestException('File upload service not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    return url;
  }

  /**
   * Validate file type and size
   */
  private validateFile(file: Express.Multer.File, type: UploadType): void {
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const allowedAudioTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/flac',
      'audio/ogg',
    ];
    const allowedVideoTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    let allowedTypes: string[];
    let maxSize: number;

    switch (type) {
      case 'profile':
        allowedTypes = allowedImageTypes;
        maxSize = 10 * 1024 * 1024; // 10MB
        break;
      case 'wave':
        allowedTypes = allowedImageTypes;
        maxSize = 10 * 1024 * 1024; // 10MB
        break;
      case 'media':
        allowedTypes = [
          ...allowedImageTypes,
          ...allowedAudioTypes,
          ...allowedVideoTypes,
        ];
        maxSize = 100 * 1024 * 1024; // 100MB
        break;
      default:
        throw new BadRequestException('Invalid upload type');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
      );
    }
  }

  /**
   * Process and optimize image
   */
  private async processImage(
    buffer: Buffer,
    type: UploadType,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    let maxWidth = 2000;
    let maxHeight = 2000;
    let quality = 85;

    if (type === 'profile') {
      maxWidth = 500;
      maxHeight = 500;
      quality = 90;
    } else if (type === 'wave') {
      maxWidth = 1200;
      maxHeight = 1200;
      quality = 85;
    }

    const processed = await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();

    return {
      buffer: processed,
      contentType: 'image/webp',
    };
  }

  /**
   * Generate S3 key for file
   */
  private generateKey(
    type: UploadType,
    originalName: string,
    userId?: string,
  ): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const extension = originalName.split('.').pop() || 'webp';

    let folder: string;

    switch (type) {
      case 'profile':
        folder = 'profiles';
        break;
      case 'wave':
        folder = 'waves';
        break;
      case 'media':
        folder = 'media';
        break;
      default:
        folder = 'misc';
    }

    return `${folder}/${userId || 'anonymous'}-${uuid}-${timestamp}.${extension}`;
  }

  /**
   * Check if file is an image
   */
  private isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }
}
