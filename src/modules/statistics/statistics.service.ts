import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Course } from '../../modules/courses/entities/course.entity';
import { Enrollment } from '../../modules/enrollments/entities/enrollment.entity';
import { User } from '../../modules/users/entities/user.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async getOverview() {
    const totalUsers = await this.userRepository.count();
    const totalCourses = await this.courseRepository.count();
    const totalEnrollments = await this.enrollmentRepository.count();

    // Get recent enrollments for chart
    const recentEnrollments = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select("DATE_TRUNC('day', enrollment.createdAt) as date")
      .addSelect('COUNT(*)', 'count')
      .groupBy('date')
      .orderBy('date', 'DESC')
      .limit(7)
      .getRawMany();

    return {
      overview: {
        totalUsers,
        totalCourses,
        totalEnrollments,
      },
      recentEnrollments,
    };
  }

  async getTopCourses() {
    return this.courseRepository
      .createQueryBuilder('course')
      .leftJoin('course.enrollments', 'enrollment')
      .select([
        'course.id',
        'course.title',
        'course.slug',
        'course.thumbnailUrl',
      ])
      .addSelect('COUNT(enrollment.id)', 'students')
      .groupBy('course.id')
      .orderBy('students', 'DESC')
      .limit(5)
      .getRawMany();
  }

  async getInstructorStats() {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.courses', 'course')
      .leftJoin('course.enrollments', 'enrollment')
      .where("user.role = 'INSTRUCTOR'")
      .select(['user.id', 'user.fullName', 'user.email'])
      .addSelect('COUNT(DISTINCT course.id)', 'courses_count')
      .addSelect('COUNT(enrollment.id)', 'total_students')
      .groupBy('user.id')
      .orderBy('total_students', 'DESC')
      .limit(5)
      .getRawMany();
  }
}
