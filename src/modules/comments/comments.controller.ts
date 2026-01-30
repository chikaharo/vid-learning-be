import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a comment' })
  create(@User() user: JwtPayload, @Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(user.sub, createCommentDto);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get comments by lesson ID' })
  findAllByLesson(@Param('lessonId', new ParseUUIDPipe()) lessonId: string) {
    return this.commentsService.findAllByLesson(lessonId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  remove(@Param('id', new ParseUUIDPipe()) id: string, @User() user: JwtPayload) {
    return this.commentsService.remove(id, user.sub);
  }
}
