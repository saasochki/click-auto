import { createHmac } from 'node:crypto';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ENV } from '../../config/config.module';
import type { Env } from '../../config/env';

export interface ImageSize {
  width: number;
  height: number;
}

/** S3-compatible storage and imgproxy URLs. */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  /** Separate client for presigned URLs: the browser reaches S3 by its public host. */
  private readonly publicS3: S3Client;

  constructor(@Inject(ENV) private readonly env: Env) {
    const base = {
      region: env.S3_REGION,
      forcePathStyle: true,
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
    };
    this.s3 = new S3Client({ ...base, endpoint: env.S3_ENDPOINT });
    this.publicS3 = new S3Client({ ...base, endpoint: env.S3_PUBLIC_ENDPOINT ?? env.S3_ENDPOINT });
  }

  async onModuleInit(): Promise<void> {
    if (this.env.NODE_ENV === 'production') return;
    // Local and test convenience: create the bucket if the storage is empty.
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.env.S3_BUCKET }));
    } catch {
      await this.s3
        .send(new CreateBucketCommand({ Bucket: this.env.S3_BUCKET }))
        .catch((error: unknown) => this.logger.warn(`S3 bucket not created: ${String(error)}`));
    }
  }

  presignPut(key: string, mimeType: string, sizeBytes: number): Promise<string> {
    return getSignedUrl(
      this.publicS3,
      new PutObjectCommand({
        Bucket: this.env.S3_BUCKET,
        Key: key,
        ContentType: mimeType,
        ContentLength: sizeBytes,
      }),
      { expiresIn: 15 * 60 },
    );
  }

  async read(key: string): Promise<Buffer> {
    const res = await this.s3.send(new GetObjectCommand({ Bucket: this.env.S3_BUCKET, Key: key }));
    if (!res.Body) throw new Error('empty object');
    return Buffer.from(await res.Body.transformToByteArray());
  }

  async write(key: string, body: Buffer, mimeType: string): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: mimeType,
      }),
    );
  }

  /**
   * imgproxy URL that fits the image into width x height and serves WebP/AVIF.
   * Signed when IMGPROXY_KEY and IMGPROXY_SALT are set (production), "insecure" locally.
   */
  imageUrl(key: string, width: number, height: number): string {
    const source = Buffer.from(`s3://${this.env.S3_BUCKET}/${key}`).toString('base64url');
    const path = `/rs:fill:${width}:${height}:0/g:ce/${source}`;
    const signature =
      this.env.IMGPROXY_KEY && this.env.IMGPROXY_SALT
        ? createHmac('sha256', Buffer.from(this.env.IMGPROXY_KEY, 'hex'))
            .update(Buffer.from(this.env.IMGPROXY_SALT, 'hex'))
            .update(path)
            .digest('base64url')
        : 'insecure';
    return `${this.env.IMGPROXY_URL}/${signature}${path}`;
  }
}
