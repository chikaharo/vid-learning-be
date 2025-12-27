import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UpsertVideoAssetDto } from './dto/upsert-video-asset.dto';
import { VideoAsset } from './entities/video-asset.entity';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(VideoAsset)
    private readonly videosRepository: Repository<VideoAsset>,
  ) {}

  async upsert(dto: UpsertVideoAssetDto) {
    let asset = await this.videosRepository.findOne({
      where: { lessonId: dto.lessonId },
    });
    if (asset) {
      asset = this.videosRepository.merge(asset, dto);
    } else {
      asset = this.videosRepository.create(dto);
    }
    return this.videosRepository.save(asset);
  }

  findByLesson(lessonId: string) {
    return this.videosRepository.findOne({ where: { lessonId } });
  }
}
