import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Course } from './entities/course.entity';
import { CoursesService } from './courses.service';
import { UsersService } from '../users/users.service';

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
  let repo: RepoMock;
  let usersService: { findOne: jest.Mock };

  beforeEach(async () => {
    repo = createRepoMock();
    usersService = { findOne: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: repo },
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
    repo.create.mockReturnValue(created);
    repo.save.mockResolvedValue(created);

    const result = await service.create(dto as any);

    expect(usersService.findOne).toHaveBeenCalledWith(dto.instructorId);
    expect(repo.create).toHaveBeenCalledWith({ ...dto, tags: [] });
    expect(repo.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });

  it('returns course by slug when found', async () => {
    const course = { id: 'c2', slug: 'course-2' };
    repo.findOne.mockResolvedValue(course);

    const result = await service.findBySlug('course-2');

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { slug: 'course-2' },
      relations: ['instructor', 'modules', 'lessons'],
    });
    expect(result).toBe(course);
  });

  it('throws NotFoundException when course is missing by id', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a course and preserves tags when not provided', async () => {
    const existing = { id: 'c3', title: 'Old', tags: ['a'] };
    repo.findOne.mockResolvedValue(existing);
    const merged = { ...existing, title: 'New Title', tags: ['a'] };
    repo.merge.mockReturnValue(merged);
    repo.save.mockResolvedValue(merged);

    const result = await service.update('c3', { title: 'New Title' } as any);

    expect(repo.merge).toHaveBeenCalledWith(existing, { title: 'New Title', tags: existing.tags });
    expect(repo.save).toHaveBeenCalledWith(merged);
    expect(result).toBe(merged);
  });

  it('throws NotFoundException when removing a missing course', async () => {
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes an existing course successfully', async () => {
    repo.delete.mockResolvedValue({ affected: 1 });
    await expect(service.remove('c4')).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledWith('c4');
  });
});
