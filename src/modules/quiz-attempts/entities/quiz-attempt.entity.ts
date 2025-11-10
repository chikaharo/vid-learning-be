import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { QuizAttemptStatus } from '../../../common/enums/quiz-attempt-status.enum';
import { Quiz } from '../../quizzes/entities/quiz.entity';
import { User } from '../../users/entities/user.entity';
import { QuizAnswer } from './quiz-answer.entity';

@Entity('quiz_attempts')
export class QuizAttempt extends BaseEntity {
  @ManyToOne(() => Quiz, (quiz) => quiz.attempts, { onDelete: 'CASCADE' })
  quiz: Quiz;

  @Column({ name: 'quiz_id' })
  quizId: string;

  @ManyToOne(() => User, (user) => user.quizAttempts, { onDelete: 'CASCADE' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: QuizAttemptStatus,
    default: QuizAttemptStatus.IN_PROGRESS,
  })
  status: QuizAttemptStatus;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ name: 'max_score', type: 'int', default: 0 })
  maxScore: number;

  @Column({
    name: 'started_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  startedAt: Date;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @OneToMany(() => QuizAnswer, (answer) => answer.attempt, { cascade: true })
  answers: QuizAnswer[];
}
