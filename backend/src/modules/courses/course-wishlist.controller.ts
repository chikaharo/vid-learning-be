import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CourseWishlistService } from './course-wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@ApiTags('Course Wishlist')
@Controller('wishlist')
export class CourseWishlistController {
  constructor(private readonly wishlistService: CourseWishlistService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Add a course to wishlist' })
  add(@Body() payload: AddToWishlistDto) {
    return this.wishlistService.add(payload);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':userId/:courseId')
  @ApiOperation({ summary: 'Remove a course from wishlist' })
  remove(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
  ) {
    return this.wishlistService.remove(userId, courseId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get wishlist for a user' })
  findByUser(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.wishlistService.findForUser(userId);
  }
}
