import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { QuizAttemptStatus } from '../../common/enums/quiz-attempt-status.enum';
import { QuizzesService } from '../quizzes/quizzes.service';
import { UsersService } from '../users/users.service';
import { StartQuizAttemptDto } from './dto/start-quiz-attempt.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { QuizAnswer } from './entities/quiz-answer.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';

@Injectable()
export class QuizAttemptsService {
  constructor(
    @InjectRepository(QuizAttempt)
    private readonly attemptsRepository: Repository<QuizAttempt>,
    @InjectRepository(QuizAnswer)
    private readonly answersRepository: Repository<QuizAnswer>,
    private readonly quizzesService: QuizzesService,
    private readonly usersService: UsersService,
  ) {}

  async start(dto: StartQuizAttemptDto) {
    await Promise.all([
      this.quizzesService.findOne(dto.quizId),
      this.usersService.findOne(dto.userId),
    ]);
    const attempt = this.attemptsRepository.create({
      quizId: dto.quizId,
      userId: dto.userId,
      status: QuizAttemptStatus.IN_PROGRESS,
      startedAt: new Date(),
    });
    return this.attemptsRepository.save(attempt);
  }

  async submit(dto: SubmitQuizAttemptDto) {
    const attempt = await this.attemptsRepository.findOne({
      where: { id: dto.attemptId },
    });
    if (!attempt) {
      throw new NotFoundException(`Attempt ${dto.attemptId} not found`);
    }

    await this.answersRepository.delete({ attemptId: attempt.id });
    const answers = dto.answers.map((answerPayload) =>
      this.answersRepository.create({
        attemptId: attempt.id,
        questionId: answerPayload.questionId,
        optionId: answerPayload.optionId,
        freeText: answerPayload.freeText,
      }),
    );

    await this.answersRepository.save(answers);

    attempt.status = QuizAttemptStatus.SUBMITTED;
    attempt.submittedAt = new Date();
    attempt.score = answers.length; // Placeholder scoring logic
    attempt.maxScore = answers.length;
    return this.attemptsRepository.save(attempt);
  }

  findUserAttempts(userId: string) {
    return this.attemptsRepository.find({
      where: { userId },
      relations: ['quiz'],
      order: { createdAt: 'DESC' },
    });
  }
}
