import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { QuizOption } from '../../quizzes/entities/quiz-option.entity';
import { QuizQuestion } from '../../quizzes/entities/quiz-question.entity';
import { QuizAttempt } from './quiz-attempt.entity';

@Entity('quiz_answers')
export class QuizAnswer extends BaseEntity {
  @ManyToOne(() => QuizAttempt, (attempt) => attempt.answers, {
    onDelete: 'CASCADE',
  })
  attempt: QuizAttempt;

  @Column({ name: 'attempt_id' })
  attemptId: string;

  @ManyToOne(() => QuizQuestion, { onDelete: 'CASCADE' })
  question: QuizQuestion;

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => QuizOption, { nullable: true, onDelete: 'SET NULL' })
  selectedOption?: QuizOption;

  @Column({ name: 'option_id', nullable: true })
  optionId?: string;

  @Column({ name: 'free_text', type: 'text', nullable: true })
  freeText?: string;
}
