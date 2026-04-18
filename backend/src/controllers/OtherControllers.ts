// ============================================================
// CHARITY, SUBSCRIPTION, ADMIN, WINNER CONTROLLERS
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { CharityService, WinnerService, AnalyticsService } from '../services/OtherServices';
import { SubscriptionService } from '../services/SubscriptionService';
import { IApiResponse } from '../entities/types';

// -------------------------------------------------------------------
// CHARITY CONTROLLER
// -------------------------------------------------------------------
export class CharityController {
  constructor(private readonly charityService: CharityService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query['search'] as string | undefined;
      const charities = await this.charityService.listCharities(search);
      res.json({ success: true, data: charities } as IApiResponse);
    } catch (err) { next(err); }
  };

  featured = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const featured = await this.charityService.getFeatured();
      res.json({ success: true, data: featured } as IApiResponse);
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const charity = await this.charityService.getById(req.params['id']);
      res.json({ success: true, data: charity } as IApiResponse);
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const charity = await this.charityService.create(req.body);
      res.status(201).json({ success: true, data: charity } as IApiResponse);
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const charity = await this.charityService.update(req.params['id'], req.body);
      res.json({ success: true, data: charity } as IApiResponse);
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.charityService.delete(req.params['id']);
      res.json({ success: true, message: 'Charity deactivated' } as IApiResponse);
    } catch (err) { next(err); }
  };
}

// -------------------------------------------------------------------
// SUBSCRIPTION CONTROLLER
// -------------------------------------------------------------------
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sub = await this.subscriptionService.getSubscription(req.user!.userId);
      res.json({ success: true, data: sub } as IApiResponse);
    } catch (err) { next(err); }
  };

  checkout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { plan } = req.body;
      const url = await this.subscriptionService.createCheckoutSession(req.user!.userId, plan);
      res.json({ success: true, data: { checkoutUrl: url } } as IApiResponse);
    } catch (err) { next(err); }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.subscriptionService.cancelSubscription(req.user!.userId);
      res.json({ success: true, message: 'Subscription cancelled at end of billing period' } as IApiResponse);
    } catch (err) { next(err); }
  };

  // Raw body needed for Stripe signature verification
  webhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      await this.subscriptionService.handleStripeWebhook(req.body as Buffer, sig);
      res.json({ received: true });
    } catch (err) { next(err); }
  };
}

// -------------------------------------------------------------------
// WINNER CONTROLLER
// -------------------------------------------------------------------
export class WinnerController {
  constructor(private readonly winnerService: WinnerService) {}

  submitProof = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { drawEntryId } = req.body;
      const file = (req as Request & { file?: { buffer: Buffer; originalname: string } }).file;
      if (!file) { res.status(400).json({ success: false, error: 'Proof file required' }); return; }
      const result = await this.winnerService.submitProof(req.user!.userId, drawEntryId, file.buffer, file.originalname);
      res.status(201).json({ success: true, data: result } as IApiResponse);
    } catch (err) { next(err); }
  };

  myVerifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const verifications = await this.winnerService.getUserVerifications(req.user!.userId);
      res.json({ success: true, data: verifications } as IApiResponse);
    } catch (err) { next(err); }
  };

  getAllVerifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const verifications = await this.winnerService.getAllVerifications();
      res.json({ success: true, data: verifications } as IApiResponse);
    } catch (err) { next(err); }
  };

  review = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body;
      const result = await this.winnerService.reviewSubmission(req.params['id'], status, req.user!.userId);
      res.json({ success: true, data: result } as IApiResponse);
    } catch (err) { next(err); }
  };

  markPaid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.winnerService.markPaid(req.params['id']);
      res.json({ success: true, data: result } as IApiResponse);
    } catch (err) { next(err); }
  };
}

// -------------------------------------------------------------------
// ADMIN ANALYTICS CONTROLLER
// -------------------------------------------------------------------
export class AdminController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  getReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.analyticsService.getReport();
      res.json({ success: true, data: report } as IApiResponse);
    } catch (err) { next(err); }
  };
}
