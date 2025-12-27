import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { Repository } from 'typeorm';

import { AppConfig } from '../../config/configuration';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
    const hashedPassword = await hash(dto.password, this.bcryptSaltRounds);
    const user = this.usersRepository.create({
      ...dto,
      password: hashedPassword,
    });
    const saved = await this.usersRepository.save(user);
    return this.stripPassword(saved);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string, withPassword = false): Promise<User | null> {
    if (withPassword) {
      return this.usersRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.email = :email', { email })
        .getOne();
    }
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.password) {
      dto.password = await hash(dto.password, this.bcryptSaltRounds);
    }
    const merged = this.usersRepository.merge(user, dto);
    const saved = await this.usersRepository.save(merged);
    return this.stripPassword(saved);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }

  private stripPassword(user: User): User {
    if (user) {
      delete user.password;
    }
    return user;
  }

  private get bcryptSaltRounds(): number {
    return (
      (this.configService.get<number>('auth.bcryptSaltRounds', {
        infer: true,
      }) as number) ?? 12
    );
  }
}
