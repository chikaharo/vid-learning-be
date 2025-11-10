import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { QuestionType } from '../../../common/enums/question-type.enum';
import { Quiz } from './quiz.entity';
import { QuizOption } from './quiz-option.entity';

@Entity('quiz_questions')
export class QuizQuestion extends BaseEntity {
  @Column({ type: 'text' })
  prompt: string;

  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.SINGLE_CHOICE,
  })
  type: QuestionType;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'int', default: 1 })
  points: number;

  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  quiz: Quiz;

  @Column({ name: 'quiz_id' })
  quizId: string;

  @OneToMany(() => QuizOption, (option) => option.question, { cascade: true })
  options: QuizOption[];
}
