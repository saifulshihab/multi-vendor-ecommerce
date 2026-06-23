import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../common/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  create(data: Partial<User>): Promise<User> {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  /** Includes select:false columns needed for authentication. */
  findByEmailWithSecrets(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect([
        'user.passwordHash',
        'user.refreshTokenHash',
        'user.emailVerificationToken',
        'user.passwordResetToken',
        'user.passwordResetExpiresAt',
      ])
      .where('user.email = :email', { email })
      .getOne();
  }

  findByIdWithRefresh(id: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  findByVerificationToken(token: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.emailVerificationToken')
      .where('user.emailVerificationToken = :token', { token })
      .getOne();
  }

  findByResetToken(token: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect([
        'user.passwordHash',
        'user.passwordResetToken',
        'user.passwordResetExpiresAt',
      ])
      .where('user.passwordResetToken = :token', { token })
      .getOne();
  }

  async update(id: string, patch: Partial<User>): Promise<User> {
    await this.usersRepo.update({ id }, patch);
    return this.findByIdOrFail(id);
  }

  setRefreshTokenHash(id: string, hash: string | null): Promise<void> {
    return this.usersRepo
      .update({ id }, { refreshTokenHash: hash })
      .then(() => undefined);
  }

  // --- Admin helpers ---

  async findAllPaginated(
    page: number,
    limit: number,
  ): Promise<[User[], number]> {
    return this.usersRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  setRole(id: string, role: Role): Promise<User> {
    return this.update(id, { role });
  }

  setBanned(id: string, isBanned: boolean): Promise<User> {
    return this.update(id, { isBanned });
  }
}
