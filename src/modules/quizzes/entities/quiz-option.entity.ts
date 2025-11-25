import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { QuizQuestion } from './quiz-question.entity';

@Entity('quiz_options')
export class QuizOption extends BaseEntity {
  @Column()
  label: string;

  @Column({ type: 'text', nullable: true })
  explanation?: string;

  @Column({ name: 'is_correct', default: false })
  isCorrect: boolean;

  @ManyToOne(() => QuizQuestion, (question) => question.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question: QuizQuestion;
}
