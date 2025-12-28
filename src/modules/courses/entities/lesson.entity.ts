import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Quiz } from '../../quizzes/entities/quiz.entity';
import { Course } from './course.entity';
import { CourseModule } from './course-module.entity';

@Entity('lessons')
export class Lesson extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ name: 'duration_minutes', type: 'int', default: 5 })
  durationMinutes: number;

  @Column({ name: 'is_preview', default: false })
  isPreview: boolean;

  @Column({ name: 'video_url', type: 'text', nullable: true })
  videoUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  content?: string | null;

  @ManyToOne(() => Course, (course) => course.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => CourseModule, (module) => module.lessons, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'module_id' })
  module: CourseModule;

  @Column({ name: 'module_id', nullable: true })
  moduleId?: string;

  @OneToMany(() => Quiz, (quiz) => quiz.lesson)
  quizzes: Quiz[];
}
