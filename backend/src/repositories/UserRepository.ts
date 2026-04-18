// ============================================================
// USER REPOSITORY — MongoDB/Mongoose implementation
// ============================================================

import { UserModel } from '../models';
import { IUser } from '../entities/types';
import { IUserRepository } from './interfaces';
import { NotFoundError } from '../errors/AppError';

export class UserRepository implements IUserRepository {
  private toEntity(doc: any): IUser {
    return {
      id: doc._id.toString(),
      email: doc.email,
      fullName: doc.fullName,
      passwordHash: doc.passwordHash,
      role: doc.role,
      charityId: doc.charityId?.toString(),
      charityPercentage: doc.charityPercentage,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findById(id: string): Promise<IUser | null> {
    const doc = await UserModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() });
    return doc ? this.toEntity(doc) : null;
  }

  async create(data: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const doc = await UserModel.create({
      email: data.email.toLowerCase(),
      fullName: data.fullName,
      passwordHash: data.passwordHash,
      role: data.role,
      charityId: data.charityId || undefined,
      charityPercentage: data.charityPercentage,
    });
    return this.toEntity(doc);
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser> {
    const update: Record<string, unknown> = {};
    if (data.fullName !== undefined) update.fullName = data.fullName;
    if (data.role !== undefined) update.role = data.role;
    if (data.charityId !== undefined) update.charityId = data.charityId;
    if (data.charityPercentage !== undefined) update.charityPercentage = data.charityPercentage;
    if (data.passwordHash !== undefined) update.passwordHash = data.passwordHash;

    const doc = await UserModel.findByIdAndUpdate(id, update, { new: true });
    if (!doc) throw new NotFoundError('User');
    return this.toEntity(doc);
  }

  async findAll(page: number, limit: number): Promise<{ users: IUser[]; total: number }> {
    const [docs, total] = await Promise.all([
      UserModel.find().skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
      UserModel.countDocuments(),
    ]);
    return { users: docs.map(d => this.toEntity(d)), total };
  }

  async findActiveSubscriberCount(): Promise<number> {
    return UserModel.countDocuments({ role: { $in: ['subscriber', 'admin'] } });
  }
}
