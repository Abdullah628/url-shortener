import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { User, UserPublic, CreateUserDto, LoginDto, JwtPayload } from '../types';
import { 
  BadRequestError, 
  ConflictError, 
  UnauthorizedError 
} from '../utils/errors';

const SALT_ROUNDS = 12;

export class AuthService {
  async register(dto: CreateUserDto): Promise<{ user: UserPublic; token:  string }> {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto. password, SALT_ROUNDS);

    // Create user
    const user = await userRepository.create({
      email: dto.email,
      password: dto.password,
      passwordHash,
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      user: this.toPublicUser(user),
      token,
    };
  }

  async login(dto:  LoginDto): Promise<{ user: UserPublic; token: string }> {
    // Find user by email
    const user = await userRepository. findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user);

    return {
      user:  this.toPublicUser(user),
      token,
    };
  }

  async getCurrentUser(userId: string): Promise<UserPublic> {
    const user = await userRepository. findById(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    return this.toPublicUser(user);
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt. verify(token, env.JWT_SECRET) as JwtPayload;
      return decoded;
    } catch {
      throw new UnauthorizedError('Invalid token');
    }
  }

  private generateToken(user: User): string {
    const payload:  JwtPayload = {
      userId:  user.id,
      email: user. email,
    };

    return jwt.sign(payload, env.JWT_SECRET as Secret, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as SignOptions);
  }

  private toPublicUser(user: User): UserPublic {
    return {
      id: user. id,
      email: user.email,
      urlCount:  user.urlCount,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();