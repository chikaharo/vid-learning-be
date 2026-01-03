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
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentsService } from './enrollments.service';
import { User } from '../../common/decorators/user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Enroll a user in a course' })
  enroll(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.enroll(createEnrollmentDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('user/me')
  @ApiOperation({ summary: 'List enrollments for current user' })
  findMyEnrollments(@User() user: JwtPayload) {
    return this.enrollmentsService.findForUser(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('user/:userId')
  @ApiOperation({ summary: 'List enrollments for a user' })
  findUserEnrollments(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.enrollmentsService.findForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('course/:courseId')
  @ApiOperation({ summary: 'List enrollments for a course' })
  findCourseEnrollments(@Param('courseId', new ParseUUIDPipe()) courseId: string) {
    return this.enrollmentsService.findForCourse(courseId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update an enrollment' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentsService.update(id, updateEnrollmentDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Remove an enrollment' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.enrollmentsService.remove(id);
  }
}
