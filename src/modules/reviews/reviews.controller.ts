import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a review for a course' })
  create(@Body() createReviewDto: CreateReviewDto, @User() user: JwtPayload) {
    return this.reviewsService.create(createReviewDto, user.sub);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get reviews for a course' })
  findByCourse(@Param('courseId', new ParseUUIDPipe()) courseId: string) {
    return this.reviewsService.findByCourse(courseId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/:courseId')
  @ApiOperation({ summary: 'Check if current user reviewed a course' })
  findMyReview(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @User() user: JwtPayload,
  ) {
    return this.reviewsService.findOneByUserAndCourse(user.sub, courseId);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all reviews (Admin)' })
  findAllAdmin(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
  ) {
    return this.reviewsService.findAllAdmin(
      Number(page),
      Number(limit),
      search,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review (Admin)' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.reviewsService.delete(id);
  }
}
