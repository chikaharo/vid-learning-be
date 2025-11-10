import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';

import { AppConfig } from '../../config/configuration';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async login({ email, password }: LoginDto) {
    console.log('logged user: ', email);
    const user = await this.usersService.findByEmail(email, true);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildTokens(user);
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findOne(payload.sub);
    return this.buildTokens(user);
  }

  private async buildTokens(
    user: Pick<User, 'id' | 'email' | 'role'> & { password?: string },
  ) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: `${this.accessTtl}s`,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: `${this.refreshTtl}s`,
      }),
    ]);

    const sanitizedUser = { ...user };

    delete (sanitizedUser as any).password;

    return {
      user: sanitizedUser,
      accessToken,
      refreshToken,
      expiresIn: this.accessTtl,
    };
  }

  private get accessSecret(): string {
    return this.configService.getOrThrow('auth.jwt.accessSecret', {
      infer: true,
    });
  }

  private get refreshSecret(): string {
    return this.configService.getOrThrow('auth.jwt.refreshSecret', {
      infer: true,
    });
  }

  private get accessTtl(): number {
    return this.configService.getOrThrow('auth.jwt.accessTtl', { infer: true });
  }

  private get refreshTtl(): number {
    return this.configService.getOrThrow('auth.jwt.refreshTtl', {
      infer: true,
    });
  }
}
