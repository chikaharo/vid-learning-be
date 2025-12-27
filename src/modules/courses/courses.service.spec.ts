import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Course } from './entities/course.entity';
import { CoursesService } from './courses.service';
import { UsersService } from '../users/users.service';
import { Enrollment } from '../enrollments/entities/enrollment.entity'; // Import Enrollment entity

type RepoMock = {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  merge: jest.Mock;
  delete: jest.Mock;
};

const createRepoMock = (): RepoMock => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
  delete: jest.fn(),
});

describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepo: RepoMock;
  let enrollmentRepo: {
    createQueryBuilder: jest.Mock;
  };
  let usersService: { findOne: jest.Mock };

  beforeEach(async () => {
    courseRepo = createRepoMock();
    usersService = { findOne: jest.fn() };
    enrollmentRepo = {
      createQueryBuilder: jest.fn(() => ({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0), // Default mock for getCount
      })),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: courseRepo },
        { provide: getRepositoryToken(Enrollment), useValue: enrollmentRepo }, // Provide EnrollmentRepository
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = moduleRef.get(CoursesService);
  });

  it('creates a course after validating instructor and defaults tags', async () => {
    const dto = {
      title: 'Course 1',
      slug: 'course-1',
      level: 'BEGINNER',
      durationMinutes: 120,
      isPublished: false,
      instructorId: 'instr-1',
    };
    usersService.findOne.mockResolvedValue({ id: dto.instructorId });
    const created = { id: 'c1', ...dto, tags: [] };
    courseRepo.create.mockReturnValue(created);
    courseRepo.save.mockResolvedValue(created);

    const result = await service.create(dto as any);

    expect(usersService.findOne).toHaveBeenCalledWith(dto.instructorId);
    expect(courseRepo.create).toHaveBeenCalledWith({ ...dto, tags: [] });
    expect(courseRepo.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });

  it('returns course by slug when found', async () => {
    const course = { id: 'c2', slug: 'course-2' };
    courseRepo.findOne.mockResolvedValue(course);

    const result = await service.findBySlug('course-2');

    expect(courseRepo.findOne).toHaveBeenCalledWith({
      where: { slug: 'course-2' },
      relations: ['instructor', 'modules', 'modules.lessons', 'lessons'],
      order: {
        modules: {
          order: 'ASC',
          lessons: {
            order: 'ASC',
          },
        },
      },
    });
    expect(result).toEqual(expect.objectContaining(course)); // Adjusted to match the new findBySlug return structure
  });

  it('throws NotFoundException when course is missing by id', async () => {
    courseRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates a course and preserves tags when not provided', async () => {
    const existing = { id: 'c3', title: 'Old', tags: ['a'] };
    courseRepo.findOne.mockResolvedValue(existing);
    const merged = { ...existing, title: 'New Title', tags: ['a'] };
    courseRepo.merge.mockReturnValue(merged);
    courseRepo.save.mockResolvedValue(merged);

    const result = await service.update('c3', { title: 'New Title' } as any);

    expect(courseRepo.merge).toHaveBeenCalledWith(existing, {
      title: 'New Title',
      tags: existing.tags,
    });
    expect(courseRepo.save).toHaveBeenCalledWith(merged);
    expect(result).toBe(merged);
  });

  it('throws NotFoundException when removing a missing course', async () => {
    courseRepo.findOne.mockResolvedValue(null); // Need to mock findOne for remove's internal call
    courseRepo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('removes an existing course successfully', async () => {
    courseRepo.findOne.mockResolvedValue({ id: 'c4', instructorId: 'user1' }); // Mock findOne for remove's internal call
    courseRepo.delete.mockResolvedValue({ affected: 1 });
    await expect(service.remove('c4', 'user1')).resolves.toBeUndefined(); // Added userId to remove
    expect(courseRepo.delete).toHaveBeenCalledWith('c4');
  });
});
