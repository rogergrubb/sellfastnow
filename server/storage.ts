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

export interface DashboardStats {
  totalActive: number;
  totalViews: number;
  totalMessages: number;
  totalSold: number;
}

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(userId: string, data: Partial<User>): Promise<User>;
  updateUserStripeInfo(
    userId: string,
    customerId: string,
    subscriptionId: string
  ): Promise<User>;

  // Listing operations
  createListing(listing: InsertListing): Promise<Listing>;
  getListing(id: string): Promise<Listing | undefined>;
  getListingWithSeller(id: string): Promise<{ listing: Listing; seller: User } | undefined>;
  getSimilarListings(listingId: string, limit?: number): Promise<Listing[]>;
  getUserListings(userId: string): Promise<Listing[]>;
  getUserListingsStats(userId: string): Promise<DashboardStats>;
  getAllListings(): Promise<Listing[]>;
  getListingsByCategory(category: string): Promise<Listing[]>;
  updateListing(id: string, listing: Partial<InsertListing>): Promise<Listing>;
  updateListingStatus(id: string, status: string): Promise<Listing>;
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
  toggleFavorite(userId: string, listingId: string): Promise<{ isFavorited: boolean }>;
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

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
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

  async getListingWithSeller(id: string): Promise<{ listing: Listing; seller: User } | undefined> {
    const result = await db
      .select({
        listing: listings,
        seller: users,
      })
      .from(listings)
      .innerJoin(users, eq(listings.userId, users.id))
      .where(eq(listings.id, id));
    
    if (result.length === 0) return undefined;
    return result[0];
  }

  async getSimilarListings(listingId: string, limit: number = 6): Promise<Listing[]> {
    const currentListing = await this.getListing(listingId);
    if (!currentListing) return [];

    return await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.category, currentListing.category),
          eq(listings.status, "active"),
          sql`${listings.id} != ${listingId}`
        )
      )
      .orderBy(desc(listings.createdAt))
      .limit(limit);
  }

  async getUserListings(userId: string): Promise<Listing[]> {
    return await db
      .select()
      .from(listings)
      .where(eq(listings.userId, userId))
      .orderBy(desc(listings.createdAt));
  }

  async getUserListingsStats(userId: string): Promise<DashboardStats> {
    const userListings = await this.getUserListings(userId);
    
    const totalActive = userListings.filter(l => l.status === 'active').length;
    const totalSold = userListings.filter(l => l.status === 'sold').length;
    
    const listingIds = userListings.map(l => l.id);
    let totalMessages = 0;
    
    if (listingIds.length > 0) {
      const messagesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(sql`${messages.listingId} IN (${sql.join(listingIds.map(id => sql`${id}`), sql`, `)})`);
      
      totalMessages = Number(messagesResult[0]?.count || 0);
    }
    
    return {
      totalActive,
      totalViews: 0,
      totalMessages,
      totalSold,
    };
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

  async updateListingStatus(id: string, status: string): Promise<Listing> {
    const [listing] = await db
      .update(listings)
      .set({
        status,
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

  async toggleFavorite(userId: string, listingId: string): Promise<{ isFavorited: boolean }> {
    const existing = await this.isFavorited(userId, listingId);
    
    if (existing) {
      await this.removeFavorite(userId, listingId);
      return { isFavorited: false };
    } else {
      await this.addFavorite({ userId, listingId });
      return { isFavorited: true };
    }
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
