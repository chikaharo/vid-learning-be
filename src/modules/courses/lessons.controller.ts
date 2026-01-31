import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonsService } from './lessons.service';
import { User } from '../../common/decorators/user.decorator';
import { S3Storage } from '../../common/storage/s3.storage';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

// Initialize S3 Client (Region will be loaded from AWS_REGION env var or instance metadata)
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
});

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a lesson for a course' })
  create(@Body() createLessonDto: CreateLessonDto, @User() user: JwtPayload) {
    return this.lessonsService.create(createLessonDto, user.sub);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'List lessons for a course' })
  async findByCourse(@Param('courseId') courseId: string) {
    const result = await this.lessonsService.findByCourse(courseId);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson details' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.lessonsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a lesson' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @User() user: JwtPayload,
  ) {
    return this.lessonsService.update(id, updateLessonDto, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lesson' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @User() user: JwtPayload,
  ) {
    return this.lessonsService.remove(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('video')
  @ApiOperation({ summary: 'Upload a lesson video to S3' })
  @UseInterceptors(
    FileInterceptor('video', {
      storage: new S3Storage({
        s3,
        bucket: process.env.VIDEO_STORAGE_BUCKET || 'huybd-vid-learning-bucket',
        key: (_req, file, cb) => {
          const uniqueName = `lessons/${randomUUID()}${extname(
            file.originalname,
          )}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 1024 * 1024 * 500, // 500 MB
      },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('video/')) {
          return cb(
            new BadRequestException('Only video files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }

    // Construct public URL
    const bucket =
      process.env.VIDEO_STORAGE_BUCKET || 'huybd-vid-learning-bucket';
    const region = process.env.AWS_REGION || 'us-east-1';

    // Using virtual-hosted-style URL: https://bucket.s3.region.amazonaws.com/key
    const videoUrl = `https://${bucket}.s3.${region}.amazonaws.com/${file.filename}`;

    return {
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      videoUrl: videoUrl,
    };
  }
}
