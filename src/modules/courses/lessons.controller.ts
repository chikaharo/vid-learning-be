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
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonsService } from './lessons.service';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a lesson for a course' })
  create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.create(createLessonDto);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'List lessons for a course' })
  findByCourse(@Param('courseId', new ParseUUIDPipe()) courseId: string) {
    return this.lessonsService.findByCourse(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson details' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.lessonsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a lesson' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(id, updateLessonDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lesson' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.lessonsService.remove(id);
  }
}
