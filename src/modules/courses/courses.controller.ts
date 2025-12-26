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
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CoursesService } from './courses.service';
import { User } from '../../common/decorators/user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  create(@Body() createCourseDto: CreateCourseDto, @User() user: JwtPayload) {
    createCourseDto.instructorId = user.sub;
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'List published and draft courses' })
  findAll() {
    return this.coursesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('instructor/me')
  @ApiOperation({ summary: 'List courses where the user is the instructor' })
  findAllInstructorCourses(@User() user: JwtPayload) {
    return this.coursesService.findAllByInstructor(user.sub);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get course by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.coursesService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course details' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.coursesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing course' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @User() user: JwtPayload,
  ) {
    return this.coursesService.update(id, updateCourseDto, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a course' })
  remove(@Param('id', new ParseUUIDPipe()) id: string, @User() user: JwtPayload) {
    return this.coursesService.remove(id, user.sub);
  }
}
