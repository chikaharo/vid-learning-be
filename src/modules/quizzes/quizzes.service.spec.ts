import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { QuestionType } from '../../common/enums/question-type.enum';
import { CoursesService } from '../courses/courses.service';
import { Quiz } from './entities/quiz.entity';
import { QuizOption } from './entities/quiz-option.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizzesService } from './quizzes.service';

type RepoMock<T = any> = {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  merge: jest.Mock;
  delete: jest.Mock;
};

const createRepoMock = (): RepoMock => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  merge: jest.fn(),
  delete: jest.fn(),
});

describe('QuizzesService', () => {
  let service: QuizzesService;
  let quizRepository: RepoMock<Quiz>;
  let questionRepository: RepoMock<QuizQuestion>;
  let coursesService: { findOne: jest.Mock };

  beforeEach(async () => {
    quizRepository = createRepoMock();
    questionRepository = createRepoMock();
    coursesService = { findOne: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        QuizzesService,
        { provide: getRepositoryToken(Quiz), useValue: quizRepository },
        { provide: getRepositoryToken(QuizQuestion), useValue: questionRepository },
        { provide: CoursesService, useValue: coursesService },
      ],
    }).compile();

    service = moduleRef.get(QuizzesService);
  });

  it('creates a quiz with questions and options, then returns the saved quiz', async () => {
    const dto = {
      title: 'Quiz 1',
      description: 'Desc',
      courseId: 'course-1',
      questions: [
        {
          prompt: 'Q1',
          order: 0,
          points: 2,
          options: [
            { label: 'A', isCorrect: true },
            { label: 'B', isCorrect: false },
          ],
        },
        {
          prompt: 'Q2',
          order: 1,
          options: [{ label: 'C' }],
        },
      ],
    };

    coursesService.findOne.mockResolvedValue({ id: dto.courseId });

    const createdQuiz = { id: 'quiz-1', ...dto, isPublished: false };
    quizRepository.create.mockReturnValue(createdQuiz);
    quizRepository.save.mockResolvedValue(createdQuiz);
    questionRepository.save.mockImplementation(async (questions) => questions);
    const finalQuiz = { ...createdQuiz, questions: [{ id: 'q-1' }, { id: 'q-2' }] };
    quizRepository.findOne.mockResolvedValue(finalQuiz);

    const result = await service.create(dto as any);

    expect(coursesService.findOne).toHaveBeenCalledWith(dto.courseId);
    expect(quizRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: dto.title,
        description: dto.description,
        courseId: dto.courseId,
        isPublished: false,
      }),
    );
    expect(quizRepository.save).toHaveBeenCalledWith(createdQuiz);

    expect(questionRepository.save).toHaveBeenCalledTimes(1);
    const savedQuestions = questionRepository.save.mock.calls[0][0];
    expect(savedQuestions).toHaveLength(2);
    expect(savedQuestions[0].prompt).toBe('Q1');
    expect(savedQuestions[0].type).toBe(QuestionType.SINGLE_CHOICE);
    expect(savedQuestions[0].options).toHaveLength(2);
    expect(savedQuestions[0].options[0]).toBeInstanceOf(QuizOption);
    expect(savedQuestions[0].options[0].question).toBe(savedQuestions[0]);

    expect(result).toEqual(finalQuiz);
  });

  it('throws NotFoundException when quiz is missing', async () => {
    quizRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns all quizzes ordered by creation date', async () => {
    const quizzes = [{ id: 'q1' }, { id: 'q2' }];
    quizRepository.find.mockResolvedValue(quizzes);

    const result = await service.findAll();

    expect(quizRepository.find).toHaveBeenCalledWith({
      relations: ['course', 'lesson'],
      order: { createdAt: 'DESC' },
    });
    expect(result).toBe(quizzes);
  });

  it('filters quizzes by course id', async () => {
    const quizzes = [{ id: 'q1', courseId: 'course-1' }];
    quizRepository.find.mockResolvedValue(quizzes);

    const result = await service.findByCourse('course-1');

    expect(quizRepository.find).toHaveBeenCalledWith({
      where: { courseId: 'course-1' },
      relations: ['lesson', 'questions'], // Added 'questions'
      order: { createdAt: 'DESC' },
    });
    expect(result).toBe(quizzes);
  });

  it('updates an existing quiz by merging incoming data', async () => {
    const existing = {
      id: 'quiz-1',
      title: 'Old title',
      isPublished: false,
      course: { instructorId: 'user1' }, // Mock course with instructorId
    };
    const merged = { ...existing, title: 'New title' };
    quizRepository.findOne.mockResolvedValue(existing);
    quizRepository.merge.mockReturnValue(merged);
    quizRepository.save.mockResolvedValue(merged);

    const result = await service.update('quiz-1', { title: 'New title' } as any, 'user1'); // Added userId

    expect(quizRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'quiz-1' },
      relations: ['course', 'lesson', 'questions', 'questions.options'],
    });
    expect(quizRepository.merge).toHaveBeenCalledWith(existing, { title: 'New title' });
    expect(quizRepository.save).toHaveBeenCalledWith(merged);
    expect(result).toBe(merged);
  });

  it('throws NotFoundException when deleting a missing quiz', async () => {
    quizRepository.findOne.mockResolvedValue(null); // Mock findOne for remove's internal call
    await expect(service.remove('missing', 'user1')).rejects.toBeInstanceOf(NotFoundException); // Added userId
  });

  it('deletes an existing quiz successfully', async () => {
    quizRepository.findOne.mockResolvedValue({ id: 'quiz-1', course: { instructorId: 'user1' } }); // Mock findOne
    quizRepository.delete.mockResolvedValue({ affected: 1 });

    await expect(service.remove('quiz-1', 'user1')).resolves.toBeUndefined(); // Added userId
    expect(quizRepository.delete).toHaveBeenCalledWith('quiz-1');
  });

  it('skips question persistence when no questions are provided', async () => {
    const dto = { title: 'Quiz Without Questions', courseId: 'course-123' };
    const createdQuiz = { id: 'quiz-123', ...dto, isPublished: false };
    coursesService.findOne.mockResolvedValue({ id: dto.courseId });
    quizRepository.create.mockReturnValue(createdQuiz);
    quizRepository.save.mockResolvedValue(createdQuiz);
    quizRepository.findOne.mockResolvedValue(createdQuiz);

    const result = await service.create(dto as any);

    expect(questionRepository.save).not.toHaveBeenCalled();
    expect(result).toBe(createdQuiz);
  });
});
