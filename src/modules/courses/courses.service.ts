import { Injectable, NotFoundException } from '@nestjs/common';
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
      relations: ['instructor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['instructor', 'modules', 'lessons'],
    });
    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    const course = await this.findOne(id);
    const merged = this.coursesRepository.merge(course, {
      ...dto,
      tags: dto.tags ?? course.tags,
    });
    return this.coursesRepository.save(merged);
  }

  async remove(id: string) {
    const result = await this.coursesRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Course ${id} not found`);
    }
  }
}
