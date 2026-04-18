// ============================================================
// USER ENTITY — domain class with validation logic
// ============================================================

import { IUser, UserRole } from './types';

export class User implements IUser {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: UserRole;
  charityId?: string;
  charityPercentage: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IUser) {
    this.id = data.id;
    this.email = data.email;
    this.fullName = data.fullName;
    this.passwordHash = data.passwordHash;
    this.role = data.role;
    this.charityId = data.charityId;
    this.charityPercentage = data.charityPercentage;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  isAdmin(): boolean {
    return this.role === 'admin';
  }

  isSubscriber(): boolean {
    return this.role === 'subscriber';
  }

  validateCharityPercentage(pct: number): boolean {
    return pct >= 10 && pct <= 100;
  }

  toPublic(): Omit<IUser, 'passwordHash'> {
    const { passwordHash: _, ...pub } = this;
    return pub;
  }
}
