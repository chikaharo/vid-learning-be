import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QuizzesModule } from '../quizzes/quizzes.module';
import { UsersModule } from '../users/users.module';
import { QuizAnswer } from './entities/quiz-answer.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { QuizAttemptsController } from './quiz-attempts.controller';
import { QuizAttemptsService } from './quiz-attempts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizAttempt, QuizAnswer]),
    QuizzesModule,
    UsersModule,
  ],
  controllers: [QuizAttemptsController],
  providers: [QuizAttemptsService],
  exports: [QuizAttemptsService, TypeOrmModule],
})
export class QuizAttemptsModule {}
