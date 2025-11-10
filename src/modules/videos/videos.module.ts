import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VideoAsset } from './entities/video-asset.entity';
import { VideosService } from './videos.service';

@Module({
  imports: [TypeOrmModule.forFeature([VideoAsset])],
  providers: [VideosService],
  exports: [VideosService, TypeOrmModule],
})
export class VideosModule {}
