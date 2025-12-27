import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { CourseModule } from './entities/course-module.entity';
import { Course } from './entities/course.entity';
import { Lesson } from './entities/lesson.entity';
import { CourseWishlist } from './entities/course-wishlist.entity';
import { CourseWishlistService } from './course-wishlist.service';
import { CourseWishlistController } from './course-wishlist.controller';
import { Enrollment } from '../enrollments/entities/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      CourseModule,
      Lesson,
      CourseWishlist,
      Enrollment,
    ]),
    UsersModule,
  ],
  controllers: [CoursesController, LessonsController, CourseWishlistController],
  providers: [CoursesService, LessonsService, CourseWishlistService],
  exports: [
    CoursesService,
    LessonsService,
    CourseWishlistService,
    TypeOrmModule,
  ],
})
export class CoursesModule {}
