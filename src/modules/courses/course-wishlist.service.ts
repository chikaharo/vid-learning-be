import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CourseWishlist } from './entities/course-wishlist.entity';
import { CoursesService } from './courses.service';
import { UsersService } from '../users/users.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@Injectable()
export class CourseWishlistService {
  constructor(
    @InjectRepository(CourseWishlist)
    private readonly wishlistRepository: Repository<CourseWishlist>,
    private readonly coursesService: CoursesService,
    private readonly usersService: UsersService,
  ) {}

  async add(dto: AddToWishlistDto) {
    await Promise.all([
      this.usersService.findOne(dto.userId),
      this.coursesService.findOne(dto.courseId),
    ]);
    const existing = await this.wishlistRepository.findOne({
      where: { userId: dto.userId, courseId: dto.courseId },
    });
    if (existing) {
      throw new ConflictException('Course already in wishlist');
    }
    const record = this.wishlistRepository.create(dto);
    return this.wishlistRepository.save(record);
  }

  async remove(userId: string, courseId: string) {
    const result = await this.wishlistRepository.delete({ userId, courseId });
    if (!result.affected) {
      throw new NotFoundException('Wishlist item not found');
    }
  }

  findForUser(userId: string) {
    return this.wishlistRepository.find({
      where: { userId },
      relations: ['course'],
      order: { createdAt: 'DESC' },
    });
  }

  async isWishlisted(userId: string, courseId: string) {
    const record = await this.wishlistRepository.findOne({
      where: { userId, courseId },
    });
    return Boolean(record);
  }
}
