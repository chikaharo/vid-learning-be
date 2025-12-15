import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CoursesService } from '../courses/courses.service';
import { QuestionType } from '../../common/enums/question-type.enum';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { Quiz } from './entities/quiz.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizOption } from './entities/quiz-option.entity';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz) private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizQuestion)
    private readonly questionRepository: Repository<QuizQuestion>,
    private readonly coursesService: CoursesService,
  ) {}

  async create(dto: CreateQuizDto) {
    await this.coursesService.findOne(dto.courseId);
    const { questions = [], ...quizData } = dto;
    const quiz = this.quizRepository.create({
      ...quizData,
      isPublished: quizData.isPublished ?? false,
    });

    const savedQuiz = await this.quizRepository.save(quiz);

    if (questions.length) {
      const questionEntities = questions.map((question, index) => {
        const q = new QuizQuestion();
        q.prompt = question.prompt;
        q.order = question.order ?? index;
        q.points = question.points ?? 1;
        q.type = QuestionType.SINGLE_CHOICE;
        q.quiz = savedQuiz;
        q.options =
          question.options?.map((option) => {
            const opt = new QuizOption();
            opt.label = option.label;
            opt.explanation = option.explanation;
            opt.isCorrect = option.isCorrect ?? false;
            opt.question = q;
            return opt;
          }) ?? [];
        return q;
      });
      console.log('Saving questions:', questionEntities);
      const res = await this.questionRepository.save(questionEntities);
      console.log('Saved questions:', res);
    }

    // Re-fetch without in-memory circular refs (question.quiz/option.question)
    return this.findOne(savedQuiz.id);
  }

  findAll() {
    return this.quizRepository.find({
      relations: ['course', 'lesson'],
      order: { createdAt: 'DESC' },
    });
  }

  findByCourse(courseId: string) {
    return this.quizRepository.find({
      where: { courseId },
      relations: ['lesson'],
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
    console.log('Find One Quiz:', quiz);
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
