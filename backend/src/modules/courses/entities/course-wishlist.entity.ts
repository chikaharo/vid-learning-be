import { Column, Entity, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Course } from './course.entity';
import { User } from '../../users/entities/user.entity';

@Entity('course_wishlists')
@Unique(['userId', 'courseId'])
export class CourseWishlist extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: string;
}
