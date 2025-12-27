import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { UserRole } from '../../common/enums/user-role.enum';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

import { hash } from 'bcrypt';

type RepoMock = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  merge: jest.Mock;
  delete: jest.Mock;
  createQueryBuilder: jest.Mock;
};

const createRepoMock = (): RepoMock => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: RepoMock;
  let configService: { get: jest.Mock; getOrThrow: jest.Mock };

  beforeEach(async () => {
    repo = createRepoMock();
    configService = {
      get: jest.fn(),
      getOrThrow: jest.fn(),
    };
    (hash as jest.Mock).mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
    configService.get.mockReturnValue(10);
  });

  it('creates a user, hashes password, and strips it from the result', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'plaintext',
      fullName: 'Test User',
      role: UserRole.STUDENT,
    };
    repo.findOne.mockResolvedValue(null);
    (hash as jest.Mock).mockResolvedValue('hashed-password');
    repo.create.mockReturnValue({ id: 'u1', ...dto, password: 'hashed-password' });
    repo.save.mockResolvedValue({ id: 'u1', ...dto, password: 'hashed-password' });

    const result = await service.create(dto as any);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { email: dto.email } });
    expect(hash).toHaveBeenCalledWith(dto.password, 10);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: dto.email, password: 'hashed-password' }),
    );
    expect(repo.save).toHaveBeenCalled();
    expect(result.password).toBeUndefined();
  });

  it('throws ConflictException when email already exists', async () => {
    repo.findOne.mockResolvedValue({ id: 'existing' });
    await expect(
      service.create({ email: 'dup@example.com', password: 'testtest', fullName: 'Dup' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates user with hashed password and strips it from the result', async () => {
    const user = { id: 'u1', email: 'a@b.com', password: 'old', fullName: 'Old', role: UserRole.STUDENT };
    repo.findOne.mockResolvedValue(user);
    (hash as jest.Mock).mockResolvedValue('new-hash');
    const merged = { ...user, fullName: 'New Name', password: 'new-hash' };
    repo.merge.mockReturnValue(merged);
    repo.save.mockResolvedValue(merged);

    const result = await service.update('u1', { fullName: 'New Name', password: 'newpw' } as any);

    expect(repo.merge).toHaveBeenCalledWith(user, expect.objectContaining({ fullName: 'New Name' }));
    expect(hash).toHaveBeenCalledWith('newpw', 10);
    expect(result.password).toBeUndefined();
  });

  it('finds by email with password when requested', async () => {
    const qbResult = { id: 'u2', email: 'with@pw.com', password: 'secret' };
    const qb = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(qbResult),
    };
    repo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findByEmail('with@pw.com', true);

    expect(repo.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(qb.addSelect).toHaveBeenCalledWith('user.password');
    expect(qb.where).toHaveBeenCalledWith('user.email = :email', { email: 'with@pw.com' });
    expect(result).toBe(qbResult);
  });

  it('throws NotFoundException when removing a missing user', async () => {
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes an existing user successfully', async () => {
    repo.delete.mockResolvedValue({ affected: 1 });
    await expect(service.remove('existing')).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledWith('existing');
  });
});
