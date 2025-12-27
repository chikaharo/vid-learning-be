import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from '../users/users.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateCourseDto) {
    await this.usersService.findOne(dto.instructorId);
    const course = this.coursesRepository.create({
      ...dto,
      tags: dto.tags ?? [],
    });
    return this.coursesRepository.save(course);
  }

  findAll() {
    return this.coursesRepository.find({
      where: { isPublished: true },
      relations: ['instructor'],
      order: { createdAt: 'DESC' },
    });
  }

  findAllByInstructor(instructorId: string) {
    return this.coursesRepository.find({
      where: { instructorId },
      relations: ['instructor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBySlug(slug: string) {
    const course = await this.coursesRepository.findOne({
      where: { slug },
      relations: ['instructor', 'modules', 'modules.lessons', 'lessons'],
      order: {
        modules: {
          order: 'ASC',
          lessons: {
            order: 'ASC',
          },
        },
      },
    });
    if (!course) {
      throw new NotFoundException(`Course ${slug} not found`);
    }
    return course;
  }

  async findOne(id: string) {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['instructor', 'modules', 'modules.lessons', 'lessons'],
      order: {
        modules: {
          order: 'ASC',
          lessons: {
            order: 'ASC',
          },
        },
      },
    });
    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }
    return course;
  }

  async update(id: string, dto: UpdateCourseDto, userId?: string) {
    const course = await this.findOne(id);
    
    if (userId && course.instructorId !== userId) {
      throw new ForbiddenException('You can only update your own courses');
    }

    const merged = this.coursesRepository.merge(course, {
      ...dto,
      tags: dto.tags ?? course.tags,
    });
    return this.coursesRepository.save(merged);
  }

  async remove(id: string, userId?: string) {
    const course = await this.findOne(id);

    if (userId && course.instructorId !== userId) {
      throw new ForbiddenException('You can only delete your own courses');
    }

    const result = await this.coursesRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Course ${id} not found`);
    }
  }
}
