import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { VideoStatus } from '../../../common/enums/video-status.enum';

export class UpsertVideoAssetDto {
  @IsUUID()
  lessonId: string;

  @IsString()
  storageKey: string;

  @IsString()
  sourceUrl: string;

  @IsOptional()
  @IsString()
  cdnUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;

  @IsEnum(VideoStatus)
  status: VideoStatus;

  @IsOptional()
  @IsString()
  transcriptUrl?: string;
}
