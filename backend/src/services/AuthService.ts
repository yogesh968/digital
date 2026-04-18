// ============================================================
// AUTH SERVICE — signup, login, JWT management
// ============================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../repositories/interfaces';
import { IAuthResult, ITokenPayload } from '../entities/types';
import { config } from '../config';
import { ConflictError, UnauthorizedError, ValidationError } from '../errors/AppError';
import { logger } from '../config/logger';

export class AuthService {
  constructor(private readonly userRepo: IUserRepository) {}

  async signup(email: string, password: string, fullName: string): Promise<IAuthResult> {
    if (!email || !password || !fullName) {
      throw new ValidationError('Email, password and full name are required');
    }
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new ConflictError('An account with this email already exists');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.userRepo.create({
      email,
      fullName,
      passwordHash,
      role: 'subscriber',
      charityPercentage: 10,
    });

    logger.info(`New user registered: ${user.id}`);
    const accessToken = this.generateToken(user.id, user.role, user.email);
    return { user: user, accessToken };
  }

  async login(email: string, password: string): Promise<IAuthResult> {
    if (!email || !password) throw new ValidationError('Email and password are required');

    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid email or password');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedError('Invalid email or password');

    logger.info(`User login: ${user.id}`);
    const accessToken = this.generateToken(user.id, user.role, user.email);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser as typeof user, accessToken };
  }

  verifyToken(token: string): ITokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as ITokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  private generateToken(userId: string, role: string, email: string): string {
    return jwt.sign(
      { userId, role, email } as ITokenPayload,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );
  }
}
