import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT', '');
    const region = this.configService.get<string>('S3_REGION', 'auto');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID', '');
    const secretAccessKey = this.configService.get<string>(
      'S3_SECRET_ACCESS_KEY',
      '',
    );

    this.bucketName = this.configService.get<string>(
      'S3_BUCKET_NAME',
      'wordpulse',
    );
    this.publicUrl = this.configService.get<string>('S3_PUBLIC_URL', '');

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async uploadImage(
    buffer: Buffer,
    contentType: string,
    folder: string = 'images',
  ): Promise<string> {
    const extension = this.getExtensionFromContentType(contentType);
    const key = `${folder}/${randomUUID()}.${extension}`;

    const params: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    };

    try {
      await this.s3Client.send(new PutObjectCommand(params));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload image to S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }

    const endpoint = this.configService.get<string>('S3_ENDPOINT', '');
    return `${endpoint}/${this.bucketName}/${key}`;
  }

  private getExtensionFromContentType(contentType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };

    return map[contentType] || 'bin';
  }
}
