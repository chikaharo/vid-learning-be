import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CoursesService } from '../courses/courses.service';
import { UsersService } from '../users/users.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { Enrollment } from './entities/enrollment.entity';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
    private readonly usersService: UsersService,
    private readonly coursesService: CoursesService,
  ) {}

  async enroll(dto: CreateEnrollmentDto) {
    await Promise.all([
      this.usersService.findOne(dto.userId),
      this.coursesService.findOne(dto.courseId),
    ]);
    const existing = await this.enrollmentsRepository.findOne({
      where: { userId: dto.userId, courseId: dto.courseId },
    });
    if (existing) {
      throw new ConflictException('User already enrolled in this course');
    }

    const enrollment = this.enrollmentsRepository.create({
      ...dto,
      progressPercent: dto.progressPercent ?? 0,
      completedLessonIds: dto.completedLessonIds ?? [],
    });
    return this.enrollmentsRepository.save(enrollment);
  }

  findForUser(userId: string) {
    return this.enrollmentsRepository.find({
      where: { userId },
      relations: ['course'],
      order: { createdAt: 'DESC' },
    });
  }

  findForCourse(courseId: string) {
    return this.enrollmentsRepository.find({
      where: { courseId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateEnrollmentDto) {
    const enrollment = await this.enrollmentsRepository.findOne({
      where: { id },
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${id} not found`);
    }
    const merged = this.enrollmentsRepository.merge(enrollment, dto);
    return this.enrollmentsRepository.save(merged);
  }

  async remove(id: string) {
    const result = await this.enrollmentsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Enrollment ${id} not found`);
    }
  }

  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const count = await this.enrollmentsRepository.count({
      where: { userId, courseId },
    });
    return count > 0;
  }
}
