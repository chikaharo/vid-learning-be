import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { EnrollmentStatus } from '../../../common/enums/enrollment-status.enum';
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';

@Entity('enrollments')
export class Enrollment extends BaseEntity {
  @ManyToOne(() => User, (user) => user.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => Course, (course) => course.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id', type: 'uuid', nullable: true })
  courseId: string;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.PENDING,
  })
  status: EnrollmentStatus;

  @Column({ name: 'progress_percent', type: 'int', default: 0 })
  progressPercent: number;

  @Column({
    name: 'completed_lesson_ids',
    type: 'jsonb',
    default: () => "'[]'",
  })
  completedLessonIds: string[];

  @Column({ name: 'last_accessed_at', type: 'timestamptz', nullable: true })
  lastAccessedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;
}
