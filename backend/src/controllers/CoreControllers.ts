// ============================================================
// AUTH CONTROLLER — handles /auth/* routes
// No business logic here — delegates entirely to AuthService
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { IApiResponse } from '../entities/types';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, fullName } = req.body;
      const result = await this.authService.signup(email, password, fullName);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Account created successfully',
      } as IApiResponse);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.status(200).json({ success: true, data: result } as IApiResponse);
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, data: req.user });
    } catch (err) {
      next(err);
    }
  };
}

// ============================================================
// SCORE CONTROLLER — handles /scores/* routes
// ============================================================

import { ScoreService } from '../services/ScoreService';

export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  addScore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { score, playedAt } = req.body;
      const userId = req.user!.userId;
      const result = await this.scoreService.addScore(userId, score, new Date(playedAt));
      res.status(201).json({ success: true, data: result, message: 'Score added successfully' } as IApiResponse);
    } catch (err) {
      next(err);
    }
  };

  getScores = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const scores = await this.scoreService.getScores(userId);
      res.json({ success: true, data: scores } as IApiResponse);
    } catch (err) {
      next(err);
    }
  };

  // Admin: get any user's scores
  getUserScores = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const scores = await this.scoreService.getScores(userId);
      res.json({ success: true, data: scores } as IApiResponse);
    } catch (err) {
      next(err);
    }
  };
}

// ============================================================
// DRAW CONTROLLER — handles /draw/* routes
// ============================================================

import { DrawService } from '../services/DrawService';

export class DrawController {
  constructor(private readonly drawService: DrawService) {}

  createDraw = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { drawType, month } = req.body;
      const draw = await this.drawService.createDraw(drawType, month ? new Date(month) : undefined);
      res.status(201).json({ success: true, data: draw } as IApiResponse);
    } catch (err) {
      next(err);
    }
  };

  simulate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.drawService.runDraw(id, true);
      res.json({ success: true, data: result } as IApiResponse);
    } catch (err) {
      next(err);
    }
  };

  run = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.drawService.runDraw(id, false);
      res.json({ success: true, data: result } as IApiResponse);
    } catch (err) {
      next(err);
    }
  };

  publish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const draw = await this.drawService.publishDraw(id);
      res.json({ success: true, data: draw } as IApiResponse);
    } catch (err) {
      next(err);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const draws = await this.drawService.getAllDraws();
      res.json({ success: true, data: draws } as IApiResponse);
    } catch (err) {
      next(err);
    }
  };

  getResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const entries = await this.drawService.getDrawResults(id);
      res.json({ success: true, data: entries } as IApiResponse);
    } catch (err) {
      next(err);
    }
  };

  getLatest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const draw = await this.drawService.getLatestPublished();
      res.json({ success: true, data: draw } as IApiResponse);
    } catch (err) {
      next(err);
    }
  };

  getMyEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const entry = await this.drawService.getUserDrawEntry(req.user!.userId, id);
      res.json({ success: true, data: entry } as IApiResponse);
    } catch (err) {
      next(err);
    }
  };
}
