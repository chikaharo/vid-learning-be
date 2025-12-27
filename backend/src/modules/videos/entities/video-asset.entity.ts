import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { VideoStatus } from '../../../common/enums/video-status.enum';
import { VideoCheckpoint } from '../../../common/types/video-checkpoint';
import { Lesson } from '../../courses/entities/lesson.entity';

@Entity('video_assets')
export class VideoAsset extends BaseEntity {
  @OneToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @Column({ name: 'lesson_id' })
  lessonId: string;

  @Column({ name: 'storage_key' })
  storageKey: string;

  @Column({ name: 'source_url' })
  sourceUrl: string;

  @Column({ name: 'cdn_url', nullable: true })
  cdnUrl?: string;

  @Column({ name: 'duration_seconds', type: 'int', default: 0 })
  durationSeconds: number;

  @Column({ type: 'enum', enum: VideoStatus, default: VideoStatus.PENDING })
  status: VideoStatus;

  @Column({ name: 'transcript_url', nullable: true })
  transcriptUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  checkpoints?: VideoCheckpoint[];
}
