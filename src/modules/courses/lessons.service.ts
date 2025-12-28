import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CoursesService } from './courses.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Lesson } from './entities/lesson.entity';

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
}
