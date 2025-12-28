import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Course } from '../../courses/entities/course.entity';
import { Lesson } from '../../courses/entities/lesson.entity';
import { QuizAttempt } from '../../quiz-attempts/entities/quiz-attempt.entity';
import { QuizQuestion } from './quiz-question.entity';

@Entity('quizzes')
export class Quiz extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'time_limit_seconds', type: 'int', nullable: true })
  timeLimitSeconds?: number;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @ManyToOne(() => Course, (course) => course.quizzes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.quizzes, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @Column({ name: 'lesson_id', nullable: true })
  lessonId?: string;

  @OneToMany(() => QuizQuestion, (question) => question.quiz, {
    cascade: ['insert', 'update'],
  })
  questions: QuizQuestion[];

  @OneToMany(() => QuizAttempt, (attempt) => attempt.quiz)
  attempts: QuizAttempt[];
}
