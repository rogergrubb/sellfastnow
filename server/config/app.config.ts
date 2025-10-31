/**
 * Centralized Application Configuration
 * 
 * This file contains all application-wide configuration values,
 * making it easy to manage and update settings in one place.
 */

// ==================
// Environment Detection
// ==================
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// ==================
// Base URLs
// ==================
const getBaseUrl = (): string => {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
  }
  
  return 'http://localhost:5000';
};

export const BASE_URL = getBaseUrl();
export const API_URL = `${BASE_URL}/api`;

// ==================
// Application Settings
// ==================
export const APP_CONFIG = {
  name: 'SellFast.Now',
  domain: 'sellfast.now',
  supportEmail: 'support@sellfast.now',
  noReplyEmail: 'noreply@sellfast.now',
  
  // Feature flags
  features: {
    emailVerification: true,
    phoneVerification: true,
    aiAnalysis: true,
    stripePayments: true,
    messaging: true,
    reviews: true,
    referrals: true,
    analytics: true,
  },
  
  // Limits
  limits: {
    freeListingsPerMonth: 5,
    maxImageSize: 10 * 1024 * 1024, // 10MB
    maxImagesPerListing: 10,
    maxDescriptionLength: 5000,
    maxTitleLength: 100,
  },
  
  // AI Credits
  aiCredits: {
    signupBonus: 50,
    referralBonus: 50,
    costPerImageAnalysis: 1,
    costPerDescriptionAnalysis: 1,
  },
};

// ==================
// External Services
// ==================
export const EXTERNAL_SERVICES = {
  // Geolocation
  ipApi: {
    baseUrl: 'https://ipapi.co',
    endpoints: {
      lookup: (ip: string) => `https://ipapi.co/${ip}/json/`,
      current: 'https://ipapi.co/json/',
    },
  },
  
  // Nominatim (OpenStreetMap)
  nominatim: {
    baseUrl: 'https://nominatim.openstreetmap.org',
    userAgent: 'SellFast.Now/1.0',
  },
  
  // Cloudflare R2
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    endpoint: process.env.R2_ENDPOINT || '',
    publicUrl: process.env.R2_PUBLIC_URL || 'https://pub-bc28db62ca5646428223f0bb8805346b.r2.dev',
  },
};

// ==================
// Email Templates
// ==================
export const EMAIL_CONFIG = {
  from: {
    name: 'SellFast.Now',
    email: 'noreply@sellfast.now',
  },
  
  templates: {
    verification: {
      subject: 'Verify your email address',
    },
    referral: {
      subject: (referrerName: string) => `${referrerName} invited you to join SellFast.Now!`,
    },
    transaction: {
      subject: 'Transaction Update',
    },
    offer: {
      subject: 'New Offer on Your Listing',
    },
  },
};

// ==================
// URL Builders
// ==================
export const buildUrl = {
  listing: (id: string) => `${BASE_URL}/listings/${id}`,
  conversation: (listingId: string) => `${BASE_URL}/messages?listing=${listingId}`,
  payment: (listingId: string) => `${BASE_URL}/payment/${listingId}`,
  settings: () => `${BASE_URL}/settings`,
  help: () => `${BASE_URL}/help`,
  signup: () => `${BASE_URL}/signup`,
};

// ==================
// Database Configuration
// ==================
export const DB_CONFIG = {
  connectionPoolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
  connectionTimeout: parseInt(process.env.DB_TIMEOUT || '30000'),
};

// ==================
// Rate Limiting
// ==================
export const RATE_LIMITS = {
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5,
  },
  messaging: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,
  },
};

// ==================
// Validation
// ==================
const validateConfig = () => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ];
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
  }
};

// Run validation on import
validateConfig();

export default {
  BASE_URL,
  API_URL,
  APP_CONFIG,
  EXTERNAL_SERVICES,
  EMAIL_CONFIG,
  buildUrl,
  DB_CONFIG,
  RATE_LIMITS,
};

