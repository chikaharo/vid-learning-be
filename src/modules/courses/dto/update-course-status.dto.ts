import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateCourseStatusDto {
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isPublished: boolean;
}
