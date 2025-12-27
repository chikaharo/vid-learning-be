import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { User } from '../../common/decorators/user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a quiz for a course or lesson' })
  create(@Body() createQuizDto: CreateQuizDto, @User() user: JwtPayload) {
    return this.quizzesService.create(createQuizDto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List quizzes' })
  findAll() {
    return this.quizzesService.findAll();
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'List quizzes for a course' })
  findByCourse(@Param('courseId', new ParseUUIDPipe()) courseId: string) {
    return this.quizzesService.findByCourse(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a quiz with questions' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.quizzesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update quiz metadata' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateQuizDto: UpdateQuizDto,
    @User() user: JwtPayload,
  ) {
    return this.quizzesService.update(id, updateQuizDto, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a quiz' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @User() user: JwtPayload,
  ) {
    return this.quizzesService.remove(id, user.sub);
  }
}
