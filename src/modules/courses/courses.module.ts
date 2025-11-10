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

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseModule, Lesson]),
    UsersModule,
  ],
  controllers: [CoursesController, LessonsController],
  providers: [CoursesService, LessonsService],
  exports: [CoursesService, LessonsService, TypeOrmModule],
})
export class CoursesModule {}
