import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CreateQuizQuestionDto } from './create-quiz-question.dto';

export class CreateQuizDto {
  @IsString()
  title: string;

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
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions?: CreateQuizQuestionDto[];
}
