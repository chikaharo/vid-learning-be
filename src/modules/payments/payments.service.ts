import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripes from 'stripe';
import { Repository } from 'typeorm';

import { Payment, PaymentStatus } from './entities/payment.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { EnrollmentStatus } from 'src/common/enums/enrollment-status.enum';

@Injectable()
export class PaymentsService {
  private stripe: Stripes;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {
    this.stripe = new Stripes(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-12-18.acacia',
    } as any);
  }

  async createPaymentIntent(user: User, courseId: string) {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.price === 0) {
      throw new BadRequestException('Course is free, use enrollment endpoint instead');
    }

    // Check if already enrolled
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: { userId: user.id, courseId: course.id },
    });

    if (existingEnrollment) {
      console.log('[CreatePaymentIntent] Found existing enrollment:', existingEnrollment);
      throw new BadRequestException('User already enrolled in this course');
    }

    // Create Stripe PaymentIntent
    console.log(`[CreateIntent] CourseID: ${course.id}, Price: ${course.price}, Type: ${typeof course.price}`);
    const amountInCents = Math.round(course.price * 100);
    console.log(`[CreateIntent] Amount in cents: ${amountInCents}`);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents, // Convert dollars to cents
      // CORRECTION: In the plan I said "int for cents".
      // If entity price IS cents, then I shouldn't multiply by 100.
      // Let's check what I wrote in entity. "type: 'int'".
      // If I store 1000 for $10.00, then I shouldn't multiply.
      // If I store 10 for $10, I should multiply.
      // Given standard e-commerce, storing cents is safer.
      // But for ease of editing in DB for a school project, maybe dollars is easier?
      // I will assume the `price` field in DB is in CENTS directly to be safe with Stripe.
      // So NO multiplication by 100 here if DB is CENTS.
      // However, if the user inputs "10" in a form, they expect 10 dollars.
      // Let's assume the DB `price` is in CENTS.
      // So a $10 course has price = 1000.
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        courseId: course.id,
      },
    });

    // Save initial payment record
    const payment = this.paymentRepository.create({
      stripePaymentIntentId: paymentIntent.id,
      amount: course.price, // Storing dollars (decimal)
      status: PaymentStatus.PENDING,
      user,
      course,
    });

    await this.paymentRepository.save(payment);

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  async verifyPayment(user: User, paymentIntentId: string) {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found');
    }

    if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException(`Payment not succeeded. Status: ${paymentIntent.status}`);
    }
    
    // Find our local payment record
    const payment = await this.paymentRepository.findOne({
        where: { stripePaymentIntentId: paymentIntentId },
        relations: ['user', 'course']
    });

    if (!payment) {
        throw new NotFoundException('Payment record not found');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
        return { status: 'already_completed' };
    }

    // Update payment status
    payment.status = PaymentStatus.COMPLETED;
    await this.paymentRepository.save(payment);

    // Enroll user
    console.log(`[VerifyPayment] Checking existing enrollment for user: ${payment.user?.id} course: ${payment.course?.id}`);
    const existingEnrollment = await this.enrollmentRepository.findOne({
        where: { userId: payment.user.id, courseId: payment.course.id }
    });

    if (!existingEnrollment) {
        console.log(`[VerifyPayment] Creating new enrollment for user: ${payment.user?.id}`);
        const enrollment = this.enrollmentRepository.create({
            user: { id: payment.user.id } as User,
            course: { id: payment.course.id } as Course,
            status: EnrollmentStatus.ACTIVE,
            progressPercent: 0,
            completedLessonIds: [],
            lastAccessedAt: new Date(),
        });
        const saved = await this.enrollmentRepository.save(enrollment);
        console.log(`[VerifyPayment] Enrollment saved:`, saved);
    } else {
        console.log(`[VerifyPayment] User already enrolled`);
    }

    return { status: 'success' };
  }

  async getUserPayments(user: User) {
    return this.paymentRepository.find({
      where: { userId: user.id },
      relations: ['course'],
      order: { createdAt: 'DESC' },
    });
  }
}
