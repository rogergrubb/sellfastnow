// Usage Monitoring & Cost Tracking
// Tracks API usage and costs, sends alerts when approaching limits

import { logger } from './logger';
import { cacheManager } from './cache';

interface APIUsage {
  provider: string;
  endpoint: string;
  timestamp: string;
  cached: boolean;
  cost?: number;
}

interface UsageStats {
  provider: string;
  totalCalls: number;
  cachedCalls: number;
  apiCalls: number;
  totalCost: number;
  cacheHitRate: number;
}

interface AlertConfig {
  provider: string;
  dailyLimit: number;
  monthlyLimit: number;
  costLimit: number;
  alertThreshold: number; // Percentage (e.g., 80 = alert at 80% of limit)
}

export class UsageMonitor {
  private usage: APIUsage[] = [];
  private alerts: AlertConfig[] = [];
  private alertsSent: Set<string> = new Set();

  // Cost per API call (in USD)
  private costs: Record<string, number> = {
    'google-cloud-vision': 0.0015, // $1.50 per 1000 calls
    'aws-rekognition': 0.001, // $1.00 per 1000 calls
    'gemini-vision': 0.0, // Free tier
    'shopsavvy': 0.01, // Estimated, varies by plan
    'amazon-product': 0.0, // Free with associate account
    'google-shopping': 0.005, // Via SerpAPI
    'ebay': 0.0, // Free tier
    'gemini-llm': 0.0, // Free tier
    'openai-llm': 0.002, // Estimated per request
  };

  constructor() {
    this.loadAlertConfigs();
    this.startPeriodicCheck();
  }

  /**
   * Load alert configurations
   */
  private loadAlertConfigs() {
    // Google Cloud Vision free tier: 1000 calls/month
    this.alerts.push({
      provider: 'google-cloud-vision',
      dailyLimit: 33, // ~1000/30
      monthlyLimit: 1000,
      costLimit: 0, // Free tier
      alertThreshold: 80,
    });

    // AWS Rekognition free tier: 5000 calls/month
    this.alerts.push({
      provider: 'aws-rekognition',
      dailyLimit: 166, // ~5000/30
      monthlyLimit: 5000,
      costLimit: 0, // Free tier
      alertThreshold: 80,
    });

    // ShopSavvy (varies by plan, example: 1000 calls/month)
    this.alerts.push({
      provider: 'shopsavvy',
      dailyLimit: 33,
      monthlyLimit: 1000,
      costLimit: 10, // $10/month example
      alertThreshold: 80,
    });

    // Gemini free tier: 1500 calls/day
    this.alerts.push({
      provider: 'gemini-llm',
      dailyLimit: 1500,
      monthlyLimit: 45000,
      costLimit: 0,
      alertThreshold: 80,
    });
  }

  /**
   * Record API usage
   */
  async recordUsage(provider: string, endpoint: string, cached: boolean = false): Promise<void> {
    const usage: APIUsage = {
      provider,
      endpoint,
      timestamp: new Date().toISOString(),
      cached,
      cost: cached ? 0 : (this.costs[provider] || 0),
    };

    this.usage.push(usage);

    // Store in cache for persistence
    await cacheManager.set('usage', { provider, date: new Date().toISOString().split('T')[0] }, this.usage, 86400 * 31);

    // Check limits
    await this.checkLimits(provider);

    logger.info('USAGE', `Recorded: ${provider}.${endpoint} (cached: ${cached}, cost: $${usage.cost?.toFixed(4) || '0'})`);
  }

  /**
   * Get usage statistics
   */
  getStats(provider?: string, period: 'day' | 'month' = 'day'): UsageStats[] {
    const now = new Date();
    const startTime = new Date();
    
    if (period === 'day') {
      startTime.setHours(0, 0, 0, 0);
    } else {
      startTime.setDate(1);
      startTime.setHours(0, 0, 0, 0);
    }

    // Filter usage by time period
    const filtered = this.usage.filter(u => {
      const timestamp = new Date(u.timestamp);
      return timestamp >= startTime && timestamp <= now;
    });

    // Group by provider
    const grouped = new Map<string, APIUsage[]>();
    for (const usage of filtered) {
      if (provider && usage.provider !== provider) continue;
      
      if (!grouped.has(usage.provider)) {
        grouped.set(usage.provider, []);
      }
      grouped.get(usage.provider)!.push(usage);
    }

    // Calculate stats
    const stats: UsageStats[] = [];
    for (const [providerName, usages] of grouped) {
      const totalCalls = usages.length;
      const cachedCalls = usages.filter(u => u.cached).length;
      const apiCalls = totalCalls - cachedCalls;
      const totalCost = usages.reduce((sum, u) => sum + (u.cost || 0), 0);
      const cacheHitRate = totalCalls > 0 ? (cachedCalls / totalCalls) * 100 : 0;

      stats.push({
        provider: providerName,
        totalCalls,
        cachedCalls,
        apiCalls,
        totalCost,
        cacheHitRate,
      });
    }

    return stats;
  }

  /**
   * Check if approaching limits
   */
  private async checkLimits(provider: string): Promise<void> {
    const config = this.alerts.find(a => a.provider === provider);
    if (!config) return;

    // Get daily and monthly stats
    const dailyStats = this.getStats(provider, 'day')[0];
    const monthlyStats = this.getStats(provider, 'month')[0];

    if (!dailyStats && !monthlyStats) return;

    // Check daily limit
    if (dailyStats && dailyStats.apiCalls >= config.dailyLimit * (config.alertThreshold / 100)) {
      await this.sendAlert(provider, 'daily', dailyStats.apiCalls, config.dailyLimit);
    }

    // Check monthly limit
    if (monthlyStats && monthlyStats.apiCalls >= config.monthlyLimit * (config.alertThreshold / 100)) {
      await this.sendAlert(provider, 'monthly', monthlyStats.apiCalls, config.monthlyLimit);
    }

    // Check cost limit
    if (monthlyStats && config.costLimit > 0 && monthlyStats.totalCost >= config.costLimit * (config.alertThreshold / 100)) {
      await this.sendCostAlert(provider, monthlyStats.totalCost, config.costLimit);
    }
  }

  /**
   * Send usage alert
   */
  private async sendAlert(provider: string, period: 'daily' | 'monthly', current: number, limit: number): Promise<void> {
    const alertKey = `${provider}-${period}-${new Date().toISOString().split('T')[0]}`;
    
    // Don't send duplicate alerts
    if (this.alertsSent.has(alertKey)) return;
    this.alertsSent.add(alertKey);

    const percentage = (current / limit) * 100;
    
    logger.warn('USAGE_ALERT', `⚠️ ${provider} ${period} usage at ${percentage.toFixed(1)}% (${current}/${limit} calls)`);
    
    // TODO: Send email/Slack notification
    // await sendNotification({
    //   type: 'usage_alert',
    //   provider,
    //   period,
    //   current,
    //   limit,
    //   percentage,
    // });
  }

  /**
   * Send cost alert
   */
  private async sendCostAlert(provider: string, current: number, limit: number): Promise<void> {
    const alertKey = `${provider}-cost-${new Date().toISOString().split('T')[0]}`;
    
    if (this.alertsSent.has(alertKey)) return;
    this.alertsSent.add(alertKey);

    const percentage = (current / limit) * 100;
    
    logger.warn('COST_ALERT', `💰 ${provider} cost at ${percentage.toFixed(1)}% ($${current.toFixed(2)}/$${limit.toFixed(2)})`);
    
    // TODO: Send email/Slack notification
  }

  /**
   * Start periodic check (every hour)
   */
  private startPeriodicCheck() {
    setInterval(() => {
      const stats = this.getStats(undefined, 'day');
      logger.info('USAGE', 'Daily usage summary:', stats);
    }, 3600000); // 1 hour
  }

  /**
   * Get usage report
   */
  getReport(): {
    daily: UsageStats[];
    monthly: UsageStats[];
    alerts: AlertConfig[];
  } {
    return {
      daily: this.getStats(undefined, 'day'),
      monthly: this.getStats(undefined, 'month'),
      alerts: this.alerts,
    };
  }

  /**
   * Reset usage data (for testing)
   */
  reset() {
    this.usage = [];
    this.alertsSent.clear();
  }
}

// Export singleton instance
export const usageMonitor = new UsageMonitor();
