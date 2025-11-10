import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(dto: CreateLessonDto) {
    await this.coursesService.findOne(dto.courseId);
    const lesson = this.lessonsRepository.create({
      ...dto,
      durationMinutes: dto.durationMinutes ?? 5,
      order: dto.order ?? 0,
      isPreview: dto.isPreview ?? false,
    });
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

  async update(id: string, dto: UpdateLessonDto) {
    const lesson = await this.findOne(id);
    const merged = this.lessonsRepository.merge(lesson, dto);
    return this.lessonsRepository.save(merged);
  }

  async remove(id: string) {
    const result = await this.lessonsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Lesson ${id} not found`);
    }
  }
}
