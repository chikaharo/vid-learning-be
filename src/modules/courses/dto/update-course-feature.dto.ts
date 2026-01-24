import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateCourseFeatureDto {
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isFeatured: boolean;
}
