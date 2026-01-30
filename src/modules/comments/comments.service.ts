import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
  ) {}

  async create(userId: string, dto: CreateCommentDto) {
    const comment = this.commentsRepository.create({
      ...dto,
      userId,
    });
    return this.commentsRepository.save(comment);
  }

  async findAllByLesson(lessonId: string) {
    // Fetch only top-level comments (no parent), with their replies
    const comments = await this.commentsRepository.find({
      where: { 
        lessonId, 
        parentId: IsNull()
      } as any, // Cast to any to avoid TypeORM null type issues if strict
      relations: ['user', 'replies', 'replies.user'],
      order: {
        createdAt: 'DESC',
      },
    });

    // Sort replies by createdAt ASC (oldest first)
    comments.forEach(c => {
        if (c.replies) {
            c.replies.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
    });

    return comments;
  }

  async remove(id: string, userId: string) {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment ${id} not found`);
    }

    if (comment.userId !== userId) {
        // Optionally allow admin or instructor to delete, but for now strict owner check
       throw new ForbiddenException('You can only delete your own comments');
    }

    return this.commentsRepository.remove(comment);
  }
}
