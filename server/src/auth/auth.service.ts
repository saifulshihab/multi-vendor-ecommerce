import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { Role } from '../common/enums';
import { User } from '../users/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/password.dto';
import { AuthTokens, JwtPayload } from './types/jwt-payload.interface';
import { GoogleProfile } from './strategies/google.strategy';

const BCRYPT_ROUNDS = 12;

export interface AuthResult {
  user: PublicUser;
  tokens: AuthTokens;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerified: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: !!user.emailVerifiedAt,
    };
  }

  async signup(dto: SignupDto): Promise<AuthResult> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const emailVerificationToken = randomBytes(32).toString('hex');
    const role = dto.role === Role.SELLER ? Role.SELLER : Role.BUYER;

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      role,
      emailVerificationToken,
    });

    await this.mailService.sendEmailVerification(
      user.email,
      emailVerificationToken,
    );

    const tokens = await this.issueTokens(user);
    return { user: this.toPublicUser(user), tokens };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmailWithSecrets(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.isBanned) {
      throw new UnauthorizedException('Account is banned');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.issueTokens(user);
    return { user: this.toPublicUser(user), tokens };
  }

  async validateGoogleUser(profile: GoogleProfile): Promise<AuthResult> {
    let user = await this.usersService.findByEmail(profile.email);
    if (!user) {
      user = await this.usersService.create({
        email: profile.email,
        name: profile.name,
        role: Role.BUYER,
        emailVerifiedAt: new Date(),
      });
    }
    const tokens = await this.issueTokens(user);
    return { user: this.toPublicUser(user), tokens };
  }

  async refresh(userId: string, presentedToken: string): Promise<AuthTokens> {
    const user = await this.usersService.findByIdWithRefresh(userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh session not found');
    }
    const matches = await bcrypt.compare(presentedToken, user.refreshTokenHash);
    if (!matches) {
      // Token reuse / mismatch — revoke the session entirely.
      await this.usersService.setRefreshTokenHash(user.id, null);
      throw new UnauthorizedException('Refresh token is no longer valid');
    }
    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  async verifyEmail(token: string): Promise<{ verified: boolean }> {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }
    await this.usersService.update(user.id, {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
    });
    return { verified: true };
  }

  async forgotPassword(email: string): Promise<{ sent: boolean }> {
    const user = await this.usersService.findByEmail(email);
    // Always respond success to avoid leaking which emails exist.
    if (user) {
      const token = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await this.usersService.update(user.id, {
        passwordResetToken: token,
        passwordResetExpiresAt: expires,
      });
      await this.mailService.sendPasswordReset(user.email, token);
    }
    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ reset: boolean }> {
    const user = await this.usersService.findByResetToken(dto.token);
    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Reset token is invalid or expired');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    await this.usersService.update(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      refreshTokenHash: null, // force re-login everywhere
    });
    return { reset: true };
  }

  /** Signs access + refresh tokens and persists a hash of the refresh token. */
  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessOptions: JwtSignOptions = {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>(
        'jwt.accessExpiresIn',
      ) as JwtSignOptions['expiresIn'],
    };
    const refreshOptions: JwtSignOptions = {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>(
        'jwt.refreshExpiresIn',
      ) as JwtSignOptions['expiresIn'],
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, accessOptions),
      this.jwtService.signAsync(payload, refreshOptions),
    ]);
    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.usersService.setRefreshTokenHash(user.id, refreshTokenHash);
    return { accessToken, refreshToken };
  }
}
