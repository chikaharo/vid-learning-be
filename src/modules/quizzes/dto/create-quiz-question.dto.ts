import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuizOptionDto {
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  isCorrect?: boolean;
}

export class CreateQuizQuestionDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  points?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizOptionDto)
  options: CreateQuizOptionDto[];
}
