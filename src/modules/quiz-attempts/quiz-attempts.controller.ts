import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StartQuizAttemptDto } from './dto/start-quiz-attempt.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { QuizAttemptsService } from './quiz-attempts.service';

@ApiTags('Quiz Attempts')
@Controller('quiz-attempts')
export class QuizAttemptsController {
  constructor(private readonly quizAttemptsService: QuizAttemptsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Start a new quiz attempt' })
  startAttempt(@Body() startQuizAttemptDto: StartQuizAttemptDto) {
    return this.quizAttemptsService.start(startQuizAttemptDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('submit')
  @ApiOperation({ summary: 'Submit answers for a quiz attempt' })
  submitAttempt(@Body() submitQuizAttemptDto: SubmitQuizAttemptDto) {
    return this.quizAttemptsService.submit(submitQuizAttemptDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('user/:userId')
  @ApiOperation({ summary: 'View attempts for a specific user' })
  getUserAttempts(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.quizAttemptsService.findUserAttempts(userId);
  }
}
