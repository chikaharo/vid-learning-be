import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CoursesService } from './courses.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Lesson } from './entities/lesson.entity';
import { UploadFileServiceAbstract } from 'src/common/entities/base.entity';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonsRepository: Repository<Lesson>,
    private readonly coursesService: CoursesService,
  ) {}

  async create(dto: CreateLessonDto, userId: string) {
    const course = await this.coursesService.findOne(dto.courseId);

    if (course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only add lessons to your own courses',
      );
    }

    const payload: Partial<Lesson> = {
      ...dto,
      durationMinutes: dto.durationMinutes ?? 5,
      order: dto.order ?? 0,
      isPreview: dto.isPreview ?? false,
      videoUrl: dto.videoUrl ?? null,
      content: dto.content ?? null,
    };
    const lesson = this.lessonsRepository.create(payload);
    return this.lessonsRepository.save(lesson);
  }

  findByCourse(courseId: string) {
    return this.lessonsRepository.find({
      where: { courseId },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string) {
    const lesson = await this.lessonsRepository.findOne({
      where: { id },
      relations: ['course', 'module', 'quizzes'],
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson ${id} not found`);
    }
    return lesson;
  }

  async update(id: string, dto: UpdateLessonDto, userId: string) {
    const lesson = await this.findOne(id);

    // If lesson.course is somehow missing (e.g. data issue), we can't check permissions properly.
    // Assuming for now that if we can't find the course, we can't verify ownership.
    if (!lesson.course) {
      // Try to reload with course explicitly if it wasn't loaded?
      // findOne already requests it.
      throw new NotFoundException('Course for this lesson not found');
    }

    if (lesson.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only update lessons of your own courses',
      );
    }

    const merged = this.lessonsRepository.merge(lesson, dto);
    return this.lessonsRepository.save(merged);
  }

  async remove(id: string, userId: string) {
    const lesson = await this.findOne(id);

    if (lesson.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only delete lessons of your own courses',
      );
    }

    const result = await this.lessonsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Lesson ${id} not found`);
    }
  }

  // async upload(file) {
  //   const { originalname } = file;
  //   const bucketS3 =  process.env.AWS_S3_BUCKET_NAME || 'vid-learning-bucket';
  //   await this.uploadS3(file.buffer, bucketS3, originalname);
  // }

  // async uploadS3(file, bucket, name) {
  //   const s3 = new S3Client({
  //     region: process.env.AWS_REGION || 'us-east-1',
  //     credentials: {
  //       accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID as string,
  //       secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY as string,
  //     },
  //   });
  //   const params = {
  //     Bucket: bucket,
  //     Key: `lessons/${randomUUID()}${extname(file.originalname)}`,
  //     Body: file,
  //   };
  //   return new Promise((resolve, reject) => {
  //     s3.upload(params, (err, data) => {
  //       if (err) {
  //         Logger.error(err);
  //         reject(err.message);
  //       }
  //       resolve(data);
  //     });
  //   });
  // }
}

@Injectable()
export class UploadFileServiceS3 implements UploadFileServiceAbstract {
  private s3_client: S3Client;
  constructor(private readonly config_service: ConfigService) {
    this.s3_client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
    });
  }
  async uploadFileToPublicBucket(
    path: string,
    { file, file_name }: { file: Express.Multer.File; file_name: string },
  ) {
    const bucket_name =
      process.env.VIDEO_STORAGE_BUCKET || 'huybd-vid-learning-bucket';
    const key = `lessons/${randomUUID()}${extname(file.originalname)}`;
    await this.s3_client.send(
      new PutObjectCommand({
        Bucket: bucket_name,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read', // Removed as bucket does not support ACLs
        ContentLength: file.size, // calculate length of buffer
      }),
    );

    return `https://${bucket_name}.s3.amazonaws.com/${key}`;
  }
}
