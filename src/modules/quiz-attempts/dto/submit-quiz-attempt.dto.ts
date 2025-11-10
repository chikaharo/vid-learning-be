import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class QuizAnswerPayload {
  @IsUUID()
  questionId: string;

  @IsOptional()
  @IsUUID()
  optionId?: string;

  @IsOptional()
  @IsString()
  freeText?: string;
}

export class SubmitQuizAttemptDto {
  @IsUUID()
  attemptId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerPayload)
  answers: QuizAnswerPayload[];
}

export { QuizAnswerPayload };
