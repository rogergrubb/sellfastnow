import type { Express, Request } from "express";
import { db } from "../storage";
import { sql } from "drizzle-orm";
import { z } from "zod";

const analyticsEventSchema = z.object({
  eventType: z.string(),
  eventName: z.string(),
  pagePath: z.string(),
  pageTitle: z.string().optional(),
  referrer: z.string().optional(),
  elementId: z.string().optional(),
  elementClass: z.string().optional(),
  elementText: z.string().optional(),
  elementType: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  experimentId: z.string().optional(),
  variantId: z.string().optional(),
});

// Helper to extract IP address from request
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// Helper to parse user agent
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  // Device type
  let deviceType = 'desktop';
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/ipad|tablet|playbook|silk/i.test(ua)) {
    deviceType = 'tablet';
  }
  
  // Browser
  let browser = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
  
  // OS
  let os = 'unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return { deviceType, browser, os };
}

export default function trackingRoutes(app: Express) {
  // Track an analytics event
  app.post("/api/tracking/event", async (req, res) => {
    try {
      const validation = analyticsEventSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid event data",
          details: validation.error.errors,
        });
      }
      
      const eventData = validation.data;
      
      // Get user info from headers or session
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.headers['x-user-email'] as string | undefined;
      const sessionId = req.headers['x-session-id'] as string || req.sessionID || 'unknown';
      
      // Get IP and user agent
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const { deviceType, browser, os } = parseUserAgent(userAgent);
      
      // Insert event into database
      await db.execute(sql`
        INSERT INTO analytics_events (
          user_id,
          user_email,
          ip_address,
          session_id,
          event_type,
          event_name,
          page_path,
          page_title,
          referrer,
          element_id,
          element_class,
          element_text,
          element_type,
          metadata,
          user_agent,
          device_type,
          browser,
          os,
          experiment_id,
          variant_id
        ) VALUES (
          ${userId || null},
          ${userEmail || null},
          ${ipAddress},
          ${sessionId},
          ${eventData.eventType},
          ${eventData.eventName},
          ${eventData.pagePath},
          ${eventData.pageTitle || null},
          ${eventData.referrer || null},
          ${eventData.elementId || null},
          ${eventData.elementClass || null},
          ${eventData.elementText || null},
          ${eventData.elementType || null},
          ${eventData.metadata ? JSON.stringify(eventData.metadata) : null},
          ${userAgent},
          ${deviceType},
          ${browser},
          ${os},
          ${eventData.experimentId || null},
          ${eventData.variantId || null}
        )
      `);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Analytics tracking error:", error);
      // Don't fail the request - analytics should be non-blocking
      res.json({ success: true });
    }
  });

  // Get analytics summary (admin only)
  app.get("/api/tracking/summary", async (req, res) => {
    try {
      const { startDate, endDate, eventType, pagePath } = req.query;
      
      // Build WHERE clause safely
      const conditions = [];
      const params = [];
      
      if (startDate) {
        conditions.push(sql`timestamp >= ${startDate as string}`);
      }
      if (endDate) {
        conditions.push(sql`timestamp <= ${endDate as string}`);
      }
      if (eventType) {
        conditions.push(sql`event_type = ${eventType as string}`);
      }
      if (pagePath) {
        conditions.push(sql`page_path = ${pagePath as string}`);
      }
      
      const whereClause = conditions.length > 0 
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;
      
      // Get event counts by type
      const eventCounts = await db.execute(sql`
        SELECT 
          event_type,
          event_name,
          COUNT(*) as count
        FROM analytics_events
        ${whereClause}
        GROUP BY event_type, event_name
        ORDER BY count DESC
        LIMIT 50
      `);
      
      // Get page views
      const pageViewWhere = conditions.length > 0
        ? sql`${whereClause} AND event_type = 'page_view'`
        : sql`WHERE event_type = 'page_view'`;
      
      const pageViews = await db.execute(sql`
        SELECT 
          page_path,
          COUNT(*) as views,
          COUNT(DISTINCT session_id) as unique_visitors
        FROM analytics_events
        ${pageViewWhere}
        GROUP BY page_path
        ORDER BY views DESC
        LIMIT 20
      `);
      
      // Get device breakdown
      const deviceBreakdown = await db.execute(sql`
        SELECT 
          device_type,
          COUNT(*) as count
        FROM analytics_events
        ${whereClause}
        GROUP BY device_type
      `);
      
      // Get browser breakdown
      const browserBreakdown = await db.execute(sql`
        SELECT 
          browser,
          COUNT(*) as count
        FROM analytics_events
        ${whereClause}
        GROUP BY browser
        ORDER BY count DESC
      `);
      
      // Get hourly activity
      const hourlyActivity = await db.execute(sql`
        SELECT 
          EXTRACT(HOUR FROM timestamp) as hour,
          COUNT(*) as count
        FROM analytics_events
        ${whereClause}
        GROUP BY hour
        ORDER BY hour
      `);
      
      res.json({
        eventCounts: eventCounts.rows,
        pageViews: pageViews.rows,
        deviceBreakdown: deviceBreakdown.rows,
        browserBreakdown: browserBreakdown.rows,
        hourlyActivity: hourlyActivity.rows,
      });
    } catch (error) {
      console.error("Analytics summary error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Get user journey (track specific user's path through site)
  app.get("/api/tracking/journey/:identifier", async (req, res) => {
    try {
      const { identifier } = req.params;
      const { type } = req.query; // 'email', 'ip', or 'session'
      
      let whereClause;
      if (type === 'email') {
        whereClause = sql`WHERE user_email = ${identifier}`;
      } else if (type === 'ip') {
        whereClause = sql`WHERE ip_address = ${identifier}`;
      } else if (type === 'session') {
        whereClause = sql`WHERE session_id = ${identifier}`;
      } else {
        return res.status(400).json({ error: "Invalid type parameter" });
      }
      
      const journey = await db.execute(sql`
        SELECT 
          timestamp,
          event_type,
          event_name,
          page_path,
          element_text,
          metadata
        FROM analytics_events
        ${whereClause}
        ORDER BY timestamp ASC
        LIMIT 1000
      `);
      
      res.json({ journey: journey.rows });
    } catch (error) {
      console.error("User journey error:", error);
      res.status(500).json({ error: "Failed to fetch user journey" });
    }
  });

  // Get heatmap data (most clicked elements)
  app.get("/api/tracking/heatmap", async (req, res) => {
    try {
      const { pagePath } = req.query;
      
      if (!pagePath) {
        return res.status(400).json({ error: "pagePath is required" });
      }
      
      const clicks = await db.execute(sql`
        SELECT 
          element_id,
          element_class,
          element_text,
          element_type,
          COUNT(*) as click_count
        FROM analytics_events
        WHERE page_path = ${pagePath as string}
          AND event_type = 'click'
        GROUP BY element_id, element_class, element_text, element_type
        ORDER BY click_count DESC
        LIMIT 100
      `);
      
      res.json({ clicks: clicks.rows });
    } catch (error) {
      console.error("Heatmap error:", error);
      res.status(500).json({ error: "Failed to fetch heatmap data" });
    }
  });
}

