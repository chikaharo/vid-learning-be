import { IsUUID } from 'class-validator';

export class StartQuizAttemptDto {
  @IsUUID()
  quizId: string;

  @IsUUID()
  userId: string;
}
