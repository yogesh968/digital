// ============================================================
// DATABASE SEEDER — Auto-populates required charities
// ============================================================

import { CharityModel } from '../models';
import { logger } from '../config/logger';

export const seedDatabase = async (): Promise<void> => {
  try {
    const count = await CharityModel.countDocuments();
    if (count > 0) return; // Already seeded

    logger.info('🌱 Database empty. Seeding initial charities...');

    const seedCharities = [
      { name: 'Cancer Research UK', description: 'Funding life-saving cancer research and improving treatments for patients worldwide.', websiteUrl: 'https://www.cancerresearchuk.org', isFeatured: true, isActive: true },
      { name: 'RNLI – Royal National Lifeboat Institution', description: 'Saving lives at sea through a volunteer-powered lifeboat service around the UK and Ireland.', websiteUrl: 'https://rnli.org', isFeatured: true, isActive: true },
      { name: 'Mind UK', description: 'Providing advice and support to empower people experiencing mental health problems.', websiteUrl: 'https://www.mind.org.uk', isFeatured: false, isActive: true },
      { name: 'WWF – World Wildlife Fund', description: 'Working to stop the degradation of our natural world and to build a future where people live in harmony with nature.', websiteUrl: 'https://www.wwf.org.uk', isFeatured: false, isActive: true },
      { name: 'British Heart Foundation', description: 'Funding research and providing information to prevent and treat heart and circulatory diseases.', websiteUrl: 'https://www.bhf.org.uk', isFeatured: true, isActive: true },
      { name: 'Macmillan Cancer Support', description: 'Providing medical, emotional, practical and financial support for people living with cancer.', websiteUrl: 'https://www.macmillan.org.uk', isFeatured: false, isActive: true },
    ];

    await CharityModel.insertMany(seedCharities);
    logger.info(`✅ Seeded ${seedCharities.length} charities successfully.`);

  } catch (error) {
    logger.error('❌ Failed to seed database:', error);
  }
};
