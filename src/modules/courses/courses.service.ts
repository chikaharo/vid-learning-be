import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from '../users/users.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
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

    if (course.instructorId) {
      const stats = await this.getInstructorStats(course.instructorId);
      course.metadata = {
        ...course.metadata,
        instructorStudents: stats.students,
        instructorReviews: stats.reviews,
      };
    }

    return course;
  }

  private async getInstructorStats(instructorId: string) {
    const students = await this.enrollmentsRepository
      .createQueryBuilder('enrollment')
      .innerJoin('enrollment.course', 'course')
      .where('course.instructorId = :instructorId', { instructorId })
      .getCount();

    const courses = await this.coursesRepository.find({
      where: { instructorId },
      select: ['metadata'],
    });

    const reviews = courses.reduce((acc, c) => {
      const count = Number(c.metadata?.ratingCount) || 0;
      return acc + count;
    }, 0);

    return { students, reviews };
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

    await this.coursesRepository.delete(id);
  }

  async updateRating(id: string, rating: number, count: number) {
    await this.coursesRepository.update(id, {
      rating,
      ratingCount: count,
    });
  }

  async findAllAdmin(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<{ data: Course[]; total: number; page: number; limit: number }> {
    const query = this.coursesRepository.createQueryBuilder('course');
    
    query.leftJoinAndSelect('course.instructor', 'instructor');

    if (search) {
      query.where(
        'course.title ILIKE :search OR course.slug ILIKE :search',
        { search: `%${search}%` },
      );
    }

    query
      .orderBy('course.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async updateStatus(id: string, isPublished: boolean) {
    const course = await this.findOne(id);
    course.isPublished = isPublished;
    return this.coursesRepository.save(course);
  }

  async updateFeature(id: string, isFeatured: boolean) {
    const course = await this.findOne(id);
    course.isFeatured = isFeatured;
    return this.coursesRepository.save(course);
  }
}
