// ============================================================
// ROUTER — wires routes, middleware, and controllers together
// Dependency Injection: all repos and services instantiated here
// ============================================================

import { Router, Request, Response } from 'express';

// Repositories (MongoDB)
import { UserRepository } from '../repositories/UserRepository';
import { ScoreRepository } from '../repositories/ScoreRepository';
import { DrawRepository } from '../repositories/DrawRepository';
import { CharityRepository, SubscriptionRepository, WinnerRepository, CharityContributionRepository } from '../repositories/OtherRepositories';

// Services
import { AuthService } from '../services/AuthService';
import { ScoreService } from '../services/ScoreService';
import { DrawService } from '../services/DrawService';
import { SubscriptionService } from '../services/SubscriptionService';
import { CharityService, WinnerService, AnalyticsService } from '../services/OtherServices';

// Controllers
import { AuthController, ScoreController, DrawController } from '../controllers/CoreControllers';
import { CharityController, SubscriptionController, WinnerController, AdminController } from '../controllers/OtherControllers';

// Middleware
import { createAuthMiddleware, requireRole, validate, schemas } from '../middleware';

// -------------------------------------------------------------------
// Instantiate repositories
// -------------------------------------------------------------------
const userRepo = new UserRepository();
const scoreRepo = new ScoreRepository();
const drawRepo = new DrawRepository();
const charityRepo = new CharityRepository();
const subscriptionRepo = new SubscriptionRepository();
const winnerRepo = new WinnerRepository();
const contributionRepo = new CharityContributionRepository();

// -------------------------------------------------------------------
// Instantiate services and controllers
// -------------------------------------------------------------------
const authService = new AuthService(userRepo);
const scoreService = new ScoreService(scoreRepo, subscriptionRepo);
const drawService = new DrawService(drawRepo, scoreRepo, subscriptionRepo);
const subscriptionService = new SubscriptionService(subscriptionRepo, userRepo, contributionRepo);
const charityService = new CharityService(charityRepo, contributionRepo);
const winnerService = new WinnerService(winnerRepo, drawRepo);
const analyticsService = new AnalyticsService(userRepo, contributionRepo, winnerRepo);

const authController = new AuthController(authService);
const scoreController = new ScoreController(scoreService);
const drawController = new DrawController(drawService);
const charityController = new CharityController(charityService);
const subscriptionController = new SubscriptionController(subscriptionService);
const winnerController = new WinnerController(winnerService);
const adminController = new AdminController(analyticsService);

const authMiddleware = createAuthMiddleware(authService);
const adminOnly = requireRole('admin');
const subscriberOnly = requireRole('subscriber', 'admin');

// -------------------------------------------------------------------
export const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok', database: 'mongodb', timestamp: new Date().toISOString() } });
});

// ── AUTH ────────────────────────────────────────────────────
router.post('/auth/signup', validate(schemas.signup), authController.signup);
router.post('/auth/login', validate(schemas.login), authController.login);
router.get('/auth/me', authMiddleware, authController.me);

// ── SCORES ──────────────────────────────────────────────────
router.post('/scores', authMiddleware, subscriberOnly, validate(schemas.addScore), scoreController.addScore);
router.get('/scores', authMiddleware, subscriberOnly, scoreController.getScores);
router.get('/admin/users/:userId/scores', authMiddleware, adminOnly, scoreController.getUserScores);

// ── SUBSCRIPTIONS ───────────────────────────────────────────
router.get('/subscription', authMiddleware, subscriptionController.getStatus);
router.post('/subscription/checkout', authMiddleware, subscriptionController.checkout);
router.post('/subscription/cancel', authMiddleware, subscriptionController.cancel);

// ── CHARITIES (public read, admin write) ────────────────────
router.get('/charities', charityController.list);
router.get('/charities/featured', charityController.featured);
router.get('/charities/:id', charityController.getById);
router.post('/charities', authMiddleware, adminOnly, validate(schemas.createCharity), charityController.create);
router.put('/charities/:id', authMiddleware, adminOnly, charityController.update);
router.delete('/charities/:id', authMiddleware, adminOnly, charityController.delete);

// ── DRAWS ───────────────────────────────────────────────────
router.get('/draw/latest', drawController.getLatest);
router.get('/draw', authMiddleware, adminOnly, drawController.getAll);
router.post('/draw', authMiddleware, adminOnly, validate(schemas.createDraw), drawController.createDraw);
router.post('/draw/:id/simulate', authMiddleware, adminOnly, drawController.simulate);
router.post('/draw/:id/run', authMiddleware, adminOnly, drawController.run);
router.post('/draw/:id/publish', authMiddleware, adminOnly, drawController.publish);
router.get('/draw/:id/results', authMiddleware, drawController.getResults);
router.get('/draw/:id/my-entry', authMiddleware, subscriberOnly, drawController.getMyEntry);

// ── WINNERS ─────────────────────────────────────────────────
router.get('/winners/my', authMiddleware, subscriberOnly, winnerController.myVerifications);
router.post('/winners/submit', authMiddleware, subscriberOnly, winnerController.submitProof);
router.get('/admin/winners', authMiddleware, adminOnly, winnerController.getAllVerifications);
router.patch('/admin/winners/:id/review', authMiddleware, adminOnly, validate(schemas.reviewVerification), winnerController.review);
router.patch('/admin/winners/:id/pay', authMiddleware, adminOnly, winnerController.markPaid);

// ── ADMIN ───────────────────────────────────────────────────
router.get('/admin/analytics', authMiddleware, adminOnly, adminController.getReport);
