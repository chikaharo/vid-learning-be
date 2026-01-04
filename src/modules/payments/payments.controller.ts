import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // Or your custom JwtAuthGuard

import { PaymentsService } from './payments.service';
import { User } from '../users/entities/user.entity';
// Assuming you have a decorator for getting user from request
import { User as GetUser } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path if needed

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  createPaymentIntent(
    @GetUser() user: User,
    @Body('courseId') courseId: string,
  ) {
    return this.paymentsService.createPaymentIntent(user, courseId);
  }

  @Post('verify')
  verifyPayment(
    @GetUser() user: User,
    @Body('paymentIntentId') paymentIntentId: string,
  ) {
    return this.paymentsService.verifyPayment(user, paymentIntentId);
  }

  @Get('history')
  getUserPayments(@GetUser() user: User) {
    return this.paymentsService.getUserPayments(user);
  }
}
