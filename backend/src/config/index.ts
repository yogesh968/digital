// ============================================================
// ENVIRONMENT CONFIG — centralised, validated config
// ============================================================

import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env variable: ${key}`);
  return val;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

export const config = {
  env: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '4000'), 10),

  mongodb: {
    uri: required('MONGODB_URI'),
  },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: optional('JWT_EXPIRES_IN', '7d'),
  },

  stripe: {
    secretKey: optional('STRIPE_SECRET_KEY', 'sk_test_placeholder'),
    webhookSecret: optional('STRIPE_WEBHOOK_SECRET', 'whsec_placeholder'),
    monthlyPriceId: optional('STRIPE_MONTHLY_PRICE_ID', ''),
    yearlyPriceId: optional('STRIPE_YEARLY_PRICE_ID', ''),
    prizeContributionMonthly: parseFloat(optional('PRIZE_CONTRIBUTION_MONTHLY', '5')),
    prizeContributionYearly: parseFloat(optional('PRIZE_CONTRIBUTION_YEARLY', '50')),
    monthlyPricePence: parseInt(optional('MONTHLY_PRICE_PENCE', '999'), 10),
    yearlyPricePence: parseInt(optional('YEARLY_PRICE_PENCE', '9999'), 10),
  },

  app: {
    url: optional('APP_URL', 'http://localhost:5173'),
    maxScoresPerUser: 5,
  },
} as const;

export type Config = typeof config;
