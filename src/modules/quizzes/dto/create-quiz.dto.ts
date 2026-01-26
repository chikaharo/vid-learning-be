import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CreateQuizQuestionDto } from './create-quiz-question.dto';
import { QuizType } from '../../../common/enums/quiz-type.enum';

export class CreateQuizDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsEnum(QuizType)
  type?: QuizType;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxRetries?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(7200)
  timeLimitSeconds?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions?: CreateQuizQuestionDto[];
}
