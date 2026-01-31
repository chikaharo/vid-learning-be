import {
  Injectable,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly coursesService: CoursesService,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId: string) {
    const { courseId, rating, comment } = createReviewDto;

    const isEnrolled = await this.enrollmentsService.isEnrolled(
      userId,
      courseId,
    );
    if (!isEnrolled) {
      throw new ForbiddenException(
        'You must be enrolled in this course to review it.',
      );
    }

    const existing = await this.reviewsRepository.findOne({
      where: { userId, courseId },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this course.');
    }

    const review = this.reviewsRepository.create({
      userId,
      courseId,
      rating,
      comment,
    });
    await this.reviewsRepository.save(review);

    await this.updateCourseRating(courseId);

    return review;
  }

  async findByCourse(courseId: string) {
    return this.reviewsRepository.find({
      where: { courseId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByUserAndCourse(userId: string, courseId: string) {
    return this.reviewsRepository.findOne({ where: { userId, courseId } });
  }

  private async updateCourseRating(courseId: string) {
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.course_id = :courseId', { courseId })
      .getRawOne();

    const avg = parseFloat(result.avg) || 0;
    const count = parseInt(result.count, 10) || 0;

    await this.coursesService.updateRating(courseId, avg, count);
  }

  async findAllAdmin(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<{ data: Review[]; total: number; page: number; limit: number }> {
    const query = this.reviewsRepository.createQueryBuilder('review');

    query
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.course', 'course');

    if (search) {
      query.where(
        'review.comment ILIKE :search OR user.fullName ILIKE :search',
        { search: `%${search}%` },
      );
    }

    query
      .orderBy('review.createdAt', 'DESC')
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

  async delete(id: string) {
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (review) {
      await this.reviewsRepository.delete(id);
      await this.updateCourseRating(review.courseId);
    }
  }
}
