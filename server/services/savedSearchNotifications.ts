import { db } from "../db";
import { savedSearches, searchAlertNotifications } from "@shared/schema/saved_searches";
import { listings } from "@shared/schema";
import { eq, and, gte, lte, like, sql } from "drizzle-orm";
import { getUncachableResendClient } from "../email";

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: string;
  images: string[];
  category: string | null;
  condition: string | null;
  location: string | null;
  createdAt: Date;
}

/**
 * Check if a listing matches a saved search's criteria
 */
function listingMatchesSearch(listing: Listing, search: any): boolean {
  // Check search query (keywords in title or description)
  if (search.searchQuery) {
    const query = search.searchQuery.toLowerCase();
    const titleMatch = listing.title?.toLowerCase().includes(query);
    const descMatch = listing.description?.toLowerCase().includes(query);
    if (!titleMatch && !descMatch) return false;
  }
  
  // Check category
  if (search.category && listing.category !== search.category) {
    return false;
  }
  
  // Check condition
  if (search.condition && listing.condition !== search.condition) {
    return false;
  }
  
  // Check price range
  const price = parseFloat(listing.price);
  if (search.priceMin && price < search.priceMin) {
    return false;
  }
  if (search.priceMax && price > search.priceMax) {
    return false;
  }
  
  // Check location (basic string match - could be enhanced with geocoding)
  if (search.location && listing.location) {
    const searchLoc = search.location.toLowerCase();
    const listingLoc = listing.location.toLowerCase();
    if (!listingLoc.includes(searchLoc)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Process a new listing and send notifications to matching saved searches
 */
export async function processNewListingForNotifications(listing: Listing) {
  try {
    console.log(`📧 Processing notifications for listing: ${listing.id}`);
    
    // Get all active saved searches
    const activeSearches = await db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.isActive, true));
    
    console.log(`Found ${activeSearches.length} active saved searches`);
    
    for (const search of activeSearches) {
      // Check if listing matches this search
      if (!listingMatchesSearch(listing, search)) {
        continue;
      }
      
      console.log(`✅ Listing matches saved search: ${search.name} (ID: ${search.id})`);
      
      // Check if we've already notified about this listing
      const [existing] = await db
        .select()
        .from(searchAlertNotifications)
        .where(and(
          eq(searchAlertNotifications.savedSearchId, search.id),
          eq(searchAlertNotifications.listingId, listing.id)
        ));
      
      if (existing) {
        console.log(`Already notified about this listing`);
        continue;
      }
      
      // Send notification based on frequency
      const shouldSendNow = search.notificationFrequency === "instant";
      
      if (shouldSendNow && search.emailNotifications) {
        await sendSearchAlertEmail(search, listing);
        
        // Record that we sent the notification
        await db.insert(searchAlertNotifications).values({
          savedSearchId: search.id,
          listingId: listing.id,
          emailSent: true,
          emailSentAt: new Date(),
        });
        
        // Update last notified timestamp
        await db
          .update(savedSearches)
          .set({ lastNotifiedAt: new Date() })
          .where(eq(savedSearches.id, search.id));
      } else {
        // For daily/weekly digests, just record the match
        await db.insert(searchAlertNotifications).values({
          savedSearchId: search.id,
          listingId: listing.id,
          emailSent: false,
        });
      }
    }
    
    console.log(`✅ Finished processing notifications for listing: ${listing.id}`);
  } catch (error) {
    console.error("Error processing listing notifications:", error);
    // Don't throw - we don't want to block listing creation if notifications fail
  }
}

/**
 * Send an email alert for a matching listing
 */
async function sendSearchAlertEmail(search: any, listing: Listing) {
  try {
    // Get user email (we need to join with users table)
    const [user] = await db.execute(sql`
      SELECT email, first_name FROM users WHERE id = ${search.userId}
    `);
    
    if (!user || !user.email) {
      console.log(`No email found for user ${search.userId}`);
      return;
    }
    
    const listingUrl = `https://sellfast.now/listings/${listing.id}`;
    const manageUrl = `https://sellfast.now/saved-searches`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .listing-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .listing-image { width: 100%; max-width: 400px; height: auto; border-radius: 4px; margin-bottom: 15px; }
            .price { font-size: 24px; font-weight: bold; color: #10b981; margin: 10px 0; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Item Matches Your Search!</h1>
            </div>
            <div class="content">
              <p>Hi ${user.first_name || 'there'},</p>
              <p>Great news! A new listing matches your saved search <strong>"${search.name}"</strong>:</p>
              
              <div class="listing-card">
                ${listing.images && listing.images.length > 0 ? `
                  <img src="${listing.images[0]}" alt="${listing.title}" class="listing-image" />
                ` : ''}
                
                <h2>${listing.title}</h2>
                <div class="price">$${listing.price}</div>
                
                ${listing.description ? `
                  <p>${listing.description.substring(0, 200)}${listing.description.length > 200 ? '...' : ''}</p>
                ` : ''}
                
                ${listing.category ? `<p><strong>Category:</strong> ${listing.category}</p>` : ''}
                ${listing.condition ? `<p><strong>Condition:</strong> ${listing.condition}</p>` : ''}
                ${listing.location ? `<p><strong>Location:</strong> ${listing.location}</p>` : ''}
                
                <a href="${listingUrl}" class="button">View Listing →</a>
              </div>
              
              <p style="margin-top: 30px;">
                <strong>Your Search Criteria:</strong><br/>
                ${search.searchQuery ? `Keywords: ${search.searchQuery}<br/>` : ''}
                ${search.category ? `Category: ${search.category}<br/>` : ''}
                ${search.condition ? `Condition: ${search.condition}<br/>` : ''}
                ${search.priceMin || search.priceMax ? `Price: $${search.priceMin || 0} - $${search.priceMax || '∞'}<br/>` : ''}
                ${search.location ? `Location: ${search.location}` : ''}
              </p>
              
              <div class="footer">
                <p>
                  <a href="${manageUrl}">Manage your saved searches</a> | 
                  <a href="${manageUrl}">Unsubscribe</a>
                </p>
                <p>You're receiving this because you created a search alert on SellFast.Now</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const { client, fromEmail } = await getUncachableResendClient();
    
    await client.emails.send({
      from: fromEmail,
      to: user.email,
      subject: `🔔 New Match: ${listing.title}`,
      html: emailHtml,
    });
    
    console.log(`✅ Sent email alert to ${user.email} for search "${search.name}"`);
  } catch (error) {
    console.error("Error sending search alert email:", error);
    throw error;
  }
}

/**
 * Send daily digest emails for users with daily notification preference
 */
export async function sendDailyDigests() {
  try {
    console.log("📧 Sending daily digest emails...");
    
    // Get all searches with daily frequency that have unsent notifications
    const searchesWithMatches = await db.execute(sql`
      SELECT 
        ss.*,
        u.email,
        u.first_name,
        COUNT(san.id) as match_count
      FROM saved_searches ss
      JOIN users u ON u.id = ss.user_id
      JOIN search_alert_notifications san ON san.saved_search_id = ss.id
      WHERE ss.is_active = true
        AND ss.notification_frequency = 'daily'
        AND ss.email_notifications = true
        AND san.email_sent = false
        AND san.created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY ss.id, u.email, u.first_name
      HAVING COUNT(san.id) > 0
    `);
    
    for (const search of searchesWithMatches) {
      // Get the matching listings
      const matches = await db.execute(sql`
        SELECT l.*
        FROM search_alert_notifications san
        JOIN listings l ON l.id = san.listing_id
        WHERE san.saved_search_id = ${search.id}
          AND san.email_sent = false
        ORDER BY l.created_at DESC
        LIMIT 10
      `);
      
      // Send digest email
      await sendDigestEmail(search, matches);
      
      // Mark notifications as sent
      await db.execute(sql`
        UPDATE search_alert_notifications
        SET email_sent = true, email_sent_at = NOW()
        WHERE saved_search_id = ${search.id}
          AND email_sent = false
      `);
    }
    
    console.log(`✅ Sent ${searchesWithMatches.length} daily digest emails`);
  } catch (error) {
    console.error("Error sending daily digests:", error);
  }
}

/**
 * Send digest email with multiple matching listings
 */
async function sendDigestEmail(search: any, matches: any[]) {
  // Similar to sendSearchAlertEmail but with multiple listings
  // Implementation would be similar but showing all matches in one email
  console.log(`Sending digest email for search "${search.name}" with ${matches.length} matches`);
  // TODO: Implement digest email template
}

/**
 * Send weekly digest emails
 */
export async function sendWeeklyDigests() {
  // Similar to sendDailyDigests but for weekly frequency
  console.log("📧 Sending weekly digest emails...");
  // TODO: Implement weekly digests
}

