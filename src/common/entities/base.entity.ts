import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export abstract class UploadFileServiceAbstract {
  abstract uploadFileToPublicBucket(
    path: string,
    { file, file_name }: { file: Express.Multer.File; file_name: string },
  ): Promise<string>;
}
