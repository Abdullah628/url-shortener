import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest, ApiResponse, UserPublic } from '../types';
import { env } from '../config/env';

export class AuthController {
  async register(
    req: Request,
    res: Response<ApiResponse<{ user: UserPublic; token: string }>>
  ): Promise<void> {
    const { email, password } = req.body;

    const result = await authService. register({ email, password });

    // Set HTTP-only cookie
    this.setTokenCookie(res, result.token);

    res.status(201).json({
      success: true,
      data:  result,
    });
  }

  async login(
    req:  Request,
    res: Response<ApiResponse<{ user: UserPublic; token:  string }>>
  ): Promise<void> {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    // Set HTTP-only cookie
    this. setTokenCookie(res, result.token);

    res.status(200).json({
      success: true,
      data:  result,
    });
  }

  async logout(
    _req: Request,
    res: Response<ApiResponse<{ message: string }>>
  ): Promise<void> {
    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite:  'lax',
    });

    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  }

  async me(
    req: AuthRequest,
    res: Response<ApiResponse<{ user: UserPublic }>>
  ): Promise<void> {
    const userId = req.user! .userId;

    const user = await authService.getCurrentUser(userId);

    res.status(200).json({
      success: true,
      data:  { user },
    });
  }

  private setTokenCookie(res: Response, token: string): void {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    });
  }
}

export const authController = new AuthController();