import { db } from "../db";
import { savedSearches, searchAlertNotifications } from "@shared/schema/saved_searches";
import { listings, users } from "@shared/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import nodemailer from "nodemailer";
import twilio from "twilio";

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function doesListingMatchSearch(listing: any, search: any): boolean {
  if (search.searchQuery) {
    const query = search.searchQuery.toLowerCase();
    const titleMatch = listing.title?.toLowerCase().includes(query);
    const descMatch = listing.description?.toLowerCase().includes(query);
    if (!titleMatch && !descMatch) return false;
  }
  if (search.category && listing.category !== search.category) return false;
  if (search.condition && listing.condition !== search.condition) return false;
  if (search.priceMin && listing.price < search.priceMin) return false;
  if (search.priceMax && listing.price > search.priceMax) return false;
  if (search.location && listing.location) {
    const searchLoc = search.location.toLowerCase();
    const listingLoc = listing.location.toLowerCase();
    if (!listingLoc.includes(searchLoc)) return false;
  }
  return true;
}

export async function sendEmailNotification(
  userEmail: string,
  searchName: string,
  listing: any
): Promise<boolean> {
  try {
    const listingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/listings/${listing.id}`;
    const mailOptions = {
      from: process.env.SMTP_FROM || '"SellFast.Now" <noreply@sellfast.now>',
      to: userEmail,
      subject: `New Listing Alert: ${listing.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Listing Matches Your Search!</h2>
          <p>A new listing matching your saved search "<strong>${searchName}</strong>" has been posted:</p>
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${listing.title}</h3>
            <p style="font-size: 24px; color: #16a34a; font-weight: bold;">$${listing.price}</p>
            ${listing.imageUrl ? `<img src="${listing.imageUrl}" alt="${listing.title}" style="max-width: 100%; border-radius: 4px;">` : ''}
            <p>${listing.description?.substring(0, 200)}${listing.description?.length > 200 ? '...' : ''}</p>
          </div>
          <a href="${listingUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Listing</a>
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
            You're receiving this because you saved a search alert. <a href="${process.env.FRONTEND_URL}/settings">Manage your alerts</a>
          </p>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email notification:", error);
    return false;
  }
}

export async function sendSMSNotification(
  phoneNumber: string,
  searchName: string,
  listing: any
): Promise<boolean> {
  try {
    if (!twilioClient) {
      console.log("Twilio not configured. SMS would be sent to:", phoneNumber);
      return false;
    }

    const listingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/listings/${listing.id}`;
    const message = `New listing matches "${searchName}"!\n\n${listing.title}\n$${listing.price}\n\nView: ${listingUrl}`;

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`SMS sent successfully to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error("Error sending SMS notification:", error);
    return false;
  }
}

export async function checkAndNotifyNewListings(newListingId: number): Promise<void> {
  try {
    const [listing] = await db.select().from(listings).where(eq(listings.id, newListingId));
    if (!listing) return;
    
    const activeSearches = await db.select().from(savedSearches).where(eq(savedSearches.isActive, true));
    
    for (const search of activeSearches) {
      if (doesListingMatchSearch(listing, search)) {
        const [user] = await db.select().from(users).where(eq(users.id, search.userId));
        if (!user) continue;
        
        const [existingNotif] = await db
          .select()
          .from(searchAlertNotifications)
          .where(and(
            eq(searchAlertNotifications.savedSearchId, search.id),
            eq(searchAlertNotifications.listingId, listing.id)
          ));
        
        if (existingNotif) continue;
        
        const [notification] = await db
          .insert(searchAlertNotifications)
          .values({
            savedSearchId: search.id,
            listingId: listing.id,
            emailSent: false,
            smsSent: false,
          })
          .returning();
        
        if (search.emailNotifications && user.email) {
          const emailSent = await sendEmailNotification(user.email, search.name, listing);
          if (emailSent) {
            await db
              .update(searchAlertNotifications)
              .set({ emailSent: true, emailSentAt: new Date() })
              .where(eq(searchAlertNotifications.id, notification.id));
          }
        }
        
        if (search.smsNotifications && user.phoneNumber) {
          const smsSent = await sendSMSNotification(user.phoneNumber, search.name, listing);
          if (smsSent) {
            await db
              .update(searchAlertNotifications)
              .set({ smsSent: true, smsSentAt: new Date() })
              .where(eq(searchAlertNotifications.id, notification.id));
          }
        }
        
        await db
          .update(savedSearches)
          .set({ lastNotifiedAt: new Date() })
          .where(eq(savedSearches.id, search.id));
      }
    }
  } catch (error) {
    console.error("Error checking and notifying new listings:", error);
  }
}
