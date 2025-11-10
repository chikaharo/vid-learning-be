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
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

import type { Multer } from 'multer';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonsService } from './lessons.service';

const lessonVideoDir = join(process.cwd(), 'uploads', 'lessons');

function ensureLessonVideoDir() {
  if (!existsSync(lessonVideoDir)) {
    mkdirSync(lessonVideoDir, { recursive: true });
  }
}

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a lesson for a course' })
  create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.create(createLessonDto);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'List lessons for a course' })
  findByCourse(@Param('courseId', new ParseUUIDPipe()) courseId: string) {
    return this.lessonsService.findByCourse(courseId);
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
  ) {
    return this.lessonsService.update(id, updateLessonDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lesson' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.lessonsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('video')
  @ApiOperation({ summary: 'Upload a lesson video' })
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureLessonVideoDir();
          cb(null, lessonVideoDir);
        },
        filename: (_req, file, cb) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
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
  uploadVideo(@UploadedFile() file: Multer.File) {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }
    return {
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      videoUrl: `/uploads/lessons/${file.filename}`,
    };
  }
}
