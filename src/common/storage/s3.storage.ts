import { Logger } from '@nestjs/common';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Request } from 'express';
import { StorageEngine } from 'multer';

interface S3StorageOptions {
  s3: S3Client;
  bucket: string;
  acl?: string;
  key?: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: any, key?: string) => void,
  ) => void;
}

export class S3Storage implements StorageEngine {
  private s3: S3Client;
  private bucket: string;
  private acl?: string;
  private getKey: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: any, key?: string) => void,
  ) => void;

  constructor(opts: S3StorageOptions) {
    this.s3 = opts.s3;
    this.bucket = opts.bucket;
    this.acl = opts.acl;
    this.getKey = opts.key || this.defaultKey;
  }

  private defaultKey(
    req: Request,
    file: Express.Multer.File,
    cb: (error: any, key?: string) => void,
  ) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error: any, info?: Partial<Express.Multer.File>) => void,
  ) {
    this.getKey(req, file, (err, key) => {
      if (err) return cb(err);
      if (!key) return cb(new Error('Missing key for S3 upload'));

      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: file.stream,
          ContentType: file.mimetype,
          // ACL removed: Bucket setting 'Bucket owner enforced' does not allow ACLs
        },
      });

      upload
        .done()
        .then((result) => {
          cb(null, {
            size: result.Key ? file.size : 0, // lib-storage doesn't always return size in result
            path: (result as any).Location || result.Key, // Location is deprecated but useful if present
            filename: key,
            destination: this.bucket,
          });
        })
        .catch((uploadErr) => {
          Logger.error(
            `S3 Upload Failed: ${uploadErr.message}`,
            uploadErr.stack,
            'S3Storage',
          );
          if (uploadErr.$metadata) {
            Logger.error(
              `AWS Metadata: ${JSON.stringify(uploadErr.$metadata)}`,
              'S3Storage',
            );
          }
          cb(uploadErr);
        });
    });
  }

  _removeFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null) => void,
  ) {
    this.s3
      .send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: file.filename,
        }),
      )
      .then(() => cb(null))
      .catch((err) => cb(err));
  }
}
