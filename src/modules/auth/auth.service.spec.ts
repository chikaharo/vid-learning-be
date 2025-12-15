import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import { UserRole } from '../../common/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import { compare } from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmail: jest.Mock; findOne: jest.Mock };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let configService: { getOrThrow: jest.Mock };

  const configValues = {
    'auth.jwt.accessSecret': 'access-secret',
    'auth.jwt.refreshSecret': 'refresh-secret',
    'auth.jwt.accessTtl': 60,
    'auth.jwt.refreshTtl': 120,
  };

  beforeEach(async () => {
    usersService = { findByEmail: jest.fn(), findOne: jest.fn() };
    jwtService = { signAsync: jest.fn(), verifyAsync: jest.fn() };
    configService = {
      getOrThrow: jest.fn((key: keyof typeof configValues) => configValues[key]),
    };
    (compare as jest.Mock).mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('logs in a user with valid credentials and returns tokens', async () => {
    const user = {
      id: 'u1',
      email: 'test@example.com',
      role: UserRole.STUDENT,
      password: 'hashed',
    };
    usersService.findByEmail.mockResolvedValue(user);
    (compare as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login({ email: user.email, password: 'plaintext' } as any);

    const payload = { sub: user.id, email: user.email, role: user.role };
    expect(usersService.findByEmail).toHaveBeenCalledWith(user.email, true);
    expect(compare).toHaveBeenCalledWith('plaintext', user.password);
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(1, payload, {
      secret: 'access-secret',
      expiresIn: '60s',
    });
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(2, payload, {
      secret: 'refresh-secret',
      expiresIn: '120s',
    });
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.password).toBeUndefined();
  });

  it('rejects login with invalid password', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'test@example.com',
      role: UserRole.STUDENT,
      password: 'hashed',
    });
    (compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ email: 'test@example.com', password: 'wrong' } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects login when user is missing', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(
      service.login({ email: 'missing@example.com', password: 'any' } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refreshes tokens with a valid refresh token', async () => {
    const payload = { sub: 'u1', email: 'a@b.com', role: UserRole.ADMIN };
    jwtService.verifyAsync.mockResolvedValue(payload);
    usersService.findOne.mockResolvedValue({ id: 'u1', email: payload.email, role: payload.role });
    jwtService.signAsync
      .mockResolvedValueOnce('new-access')
      .mockResolvedValueOnce('new-refresh');

    const result = await service.refresh('refresh-token');

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('refresh-token', {
      secret: 'refresh-secret',
    });
    expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
    expect(result.accessToken).toBe('new-access');
    expect(result.refreshToken).toBe('new-refresh');
    expect(result.user.password).toBeUndefined();
  });

  it('rejects refresh when token is invalid', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));
    await expect(service.refresh('bad')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
