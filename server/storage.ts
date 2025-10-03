import {
  users,
  listings,
  messages,
  favorites,
  type User,
  type UpsertUser,
  type Listing,
  type InsertListing,
  type Message,
  type InsertMessage,
  type Favorite,
  type InsertFavorite,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";

export interface SearchFilters {
  query?: string;
  category?: string;
  condition?: string;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  sortBy?: 'newest' | 'price-low' | 'price-high';
}

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(
    userId: string,
    customerId: string,
    subscriptionId: string
  ): Promise<User>;

  // Listing operations
  createListing(listing: InsertListing): Promise<Listing>;
  getListing(id: string): Promise<Listing | undefined>;
  getUserListings(userId: string): Promise<Listing[]>;
  getAllListings(): Promise<Listing[]>;
  getListingsByCategory(category: string): Promise<Listing[]>;
  updateListing(id: string, listing: Partial<InsertListing>): Promise<Listing>;
  deleteListing(id: string): Promise<void>;
  searchListings(query: string): Promise<Listing[]>;
  advancedSearch(filters: SearchFilters): Promise<Listing[]>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getListingMessages(listingId: string): Promise<Message[]>;
  getUserConversations(userId: string): Promise<Message[]>;
  markMessageAsRead(id: string): Promise<void>;

  // Favorite operations
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, listingId: string): Promise<void>;
  getUserFavorites(userId: string): Promise<Listing[]>;
  isFavorited(userId: string, listingId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(
    userId: string,
    customerId: string,
    subscriptionId: string
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Listing operations
  async createListing(listingData: InsertListing): Promise<Listing> {
    const [listing] = await db
      .insert(listings)
      .values(listingData)
      .returning();
    return listing;
  }

  async getListing(id: string): Promise<Listing | undefined> {
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id));
    return listing;
  }

  async getUserListings(userId: string): Promise<Listing[]> {
    return await db
      .select()
      .from(listings)
      .where(eq(listings.userId, userId))
      .orderBy(desc(listings.createdAt));
  }

  async getAllListings(): Promise<Listing[]> {
    return await db
      .select()
      .from(listings)
      .where(eq(listings.status, "active"))
      .orderBy(desc(listings.createdAt));
  }

  async getListingsByCategory(category: string): Promise<Listing[]> {
    return await db
      .select()
      .from(listings)
      .where(
        and(eq(listings.category, category), eq(listings.status, "active"))
      )
      .orderBy(desc(listings.createdAt));
  }

  async updateListing(
    id: string,
    listingData: Partial<InsertListing>
  ): Promise<Listing> {
    const [listing] = await db
      .update(listings)
      .set({
        ...listingData,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, id))
      .returning();
    return listing;
  }

  async deleteListing(id: string): Promise<void> {
    await db.delete(listings).where(eq(listings.id, id));
  }

  async searchListings(query: string): Promise<Listing[]> {
    return await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.status, "active"),
          or(
            sql`${listings.title} ILIKE ${`%${query}%`}`,
            sql`${listings.description} ILIKE ${`%${query}%`}`
          )
        )
      )
      .orderBy(desc(listings.createdAt));
  }

  async advancedSearch(filters: SearchFilters): Promise<Listing[]> {
    const conditions = [eq(listings.status, "active")];

    // Text search in title and description
    if (filters.query) {
      conditions.push(
        or(
          sql`${listings.title} ILIKE ${`%${filters.query}%`}`,
          sql`${listings.description} ILIKE ${`%${filters.query}%`}`
        )!
      );
    }

    // Category filter
    if (filters.category) {
      conditions.push(eq(listings.category, filters.category));
    }

    // Condition filter
    if (filters.condition) {
      conditions.push(eq(listings.condition, filters.condition));
    }

    // Price range filter
    if (filters.priceMin !== undefined) {
      conditions.push(sql`${listings.price}::numeric >= ${filters.priceMin}`);
    }
    if (filters.priceMax !== undefined) {
      conditions.push(sql`${listings.price}::numeric <= ${filters.priceMax}`);
    }

    // Location filter (case-insensitive partial match)
    if (filters.location) {
      conditions.push(
        sql`${listings.location} ILIKE ${`%${filters.location}%`}`
      );
    }

    // Build query
    let query = db
      .select()
      .from(listings)
      .where(and(...conditions));

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-low':
        query = query.orderBy(sql`${listings.price}::numeric ASC`);
        break;
      case 'price-high':
        query = query.orderBy(sql`${listings.price}::numeric DESC`);
        break;
      case 'newest':
      default:
        query = query.orderBy(desc(listings.createdAt));
        break;
    }

    return await query;
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  async getListingMessages(listingId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.listingId, listingId))
      .orderBy(desc(messages.createdAt));
  }

  async getUserConversations(userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
  }

  // Favorite operations
  async addFavorite(favoriteData: InsertFavorite): Promise<Favorite> {
    const [favorite] = await db
      .insert(favorites)
      .values(favoriteData)
      .returning();
    return favorite;
  }

  async removeFavorite(userId: string, listingId: string): Promise<void> {
    await db
      .delete(favorites)
      .where(
        and(eq(favorites.userId, userId), eq(favorites.listingId, listingId))
      );
  }

  async getUserFavorites(userId: string): Promise<Listing[]> {
    const result = await db
      .select({ listing: listings })
      .from(favorites)
      .innerJoin(listings, eq(favorites.listingId, listings.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    return result.map((row) => row.listing);
  }

  async isFavorited(userId: string, listingId: string): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(
        and(eq(favorites.userId, userId), eq(favorites.listingId, listingId))
      );
    return !!favorite;
  }
}

export const storage = new DatabaseStorage();
