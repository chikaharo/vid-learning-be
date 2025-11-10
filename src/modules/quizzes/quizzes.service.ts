import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CoursesService } from '../courses/courses.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { Quiz } from './entities/quiz.entity';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz) private readonly quizRepository: Repository<Quiz>,
    private readonly coursesService: CoursesService,
  ) {}

  async create(dto: CreateQuizDto) {
    await this.coursesService.findOne(dto.courseId);
    const quiz = this.quizRepository.create({
      ...dto,
      isPublished: dto.isPublished ?? false,
    });
    return this.quizRepository.save(quiz);
  }

  findAll() {
    return this.quizRepository.find({
      relations: ['course', 'lesson'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['course', 'lesson', 'questions', 'questions.options'],
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz ${id} not found`);
    }
    return quiz;
  }

  async update(id: string, dto: UpdateQuizDto) {
    const quiz = await this.findOne(id);
    const merged = this.quizRepository.merge(quiz, dto);
    return this.quizRepository.save(merged);
  }

  async remove(id: string) {
    const result = await this.quizRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Quiz ${id} not found`);
    }
  }
}
