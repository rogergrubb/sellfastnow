import {
  users,
  listings,
  messages,
  favorites,
  offers,
  reviews,
  cancellationComments,
  userStatistics,
  reviewVotes,
  cancellationCommentVotes,
  transactionEvents,
  reviewRequestEmails,
  reviewTokens,
  uploadSessions,
  userCredits,
  creditTransactions,
  type User,
  type UpsertUser,
  type Listing,
  type InsertListing,
  type Message,
  type InsertMessage,
  type Favorite,
  type InsertFavorite,
  type Offer,
  type InsertOffer,
  type Review,
  type InsertReview,
  type ReviewWithMetadata,
  type CancellationComment,
  type InsertCancellationComment,
  type UserStatistics,
  type ReviewVote,
  type InsertReviewVote,
  type CancellationCommentVote,
  type InsertCancellationCommentVote,
  type TransactionEvent,
  type InsertTransactionEvent,
  type ReviewRequestEmail,
  type InsertReviewRequestEmail,
  type ReviewToken,
  type InsertReviewToken,
  type UploadSession,
  type InsertUploadSession,
  type UserCredits,
  type InsertUserCredits,
  type CreditTransaction,
  type InsertCreditTransaction,
  draftCollections,
  userSegments,
  monetizationEvents,
  transactions,
  type DraftCollection,
  type InsertDraftCollection,
  type UserSegment,
  type InsertUserSegment,
  type MonetizationEvent,
  type InsertMonetizationEvent,
  type Transaction,
  type InsertTransaction,
  welcomeSignups,
  giveawayEntries,
  type WelcomeSignup,
  type InsertWelcomeSignup,
  type GiveawayEntry,
  type InsertGiveawayEntry,
  type ListingWithSeller,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, inArray } from "drizzle-orm";

export interface SearchFilters {
  query?: string;
  category?: string;
  condition?: string;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  distance?: number; // Distance in miles
  userLocation?: { latitude: number; longitude: number };
  sortBy?: 'newest' | 'price-low' | 'price-high' | 'distance';
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
  getAllListings(): Promise<ListingWithSeller[]>;
  getListingsByCategory(category: string): Promise<ListingWithSeller[]>;
  getListingsByBatchId(batchId: string): Promise<Listing[]>;
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
  getUserFavorites(userId: string): Promise<ListingWithSeller[]>;
  isFavorited(userId: string, listingId: string): Promise<boolean>;

  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getUserReviews(
    userId: string, 
    filters?: {
      stars?: number;
      role?: 'seller' | 'buyer';
      period?: '30d' | '3m' | '6m' | '12m' | 'all';
      sort?: 'recent' | 'oldest' | 'highest' | 'lowest' | 'helpful';
      limit?: number;
      offset?: number;
    }
  ): Promise<ReviewWithMetadata[]>;
  getUserReviewsCount(
    userId: string,
    filters?: {
      stars?: number;
      role?: 'seller' | 'buyer';
      period?: '30d' | '3m' | '6m' | '12m' | 'all';
    }
  ): Promise<number>;
  respondToReview(reviewId: string, userId: string, responseText: string): Promise<Review>;
  voteOnReview(reviewId: string, userId: string, voteType: string): Promise<{ helpful: number; notHelpful: number }>;
  flagReview(reviewId: string, reason: string): Promise<Review>;

  // Cancellation comment operations
  createCancellationComment(comment: InsertCancellationComment): Promise<CancellationComment>;
  getCancellationComment(commentId: string): Promise<CancellationComment | undefined>;
  respondToCancellationComment(commentId: string, userId: string, responseText: string, responseIsPublic: boolean): Promise<CancellationComment>;
  voteOnCancellationComment(commentId: string, userId: string, voteType: string): Promise<{ helpful: number; notHelpful: number }>;

  // Statistics operations
  getUserStatistics(userId: string): Promise<UserStatistics | undefined>;
  getUserStatisticsSummary(userId: string): Promise<any>;
  getUserMonthlyStatistics(userId: string): Promise<any[]>;
  getUserTransactionTimeline(userId: string): Promise<TransactionEvent[]>;
  recalculateUserStatistics(userId: string): Promise<UserStatistics>;
  updateStatisticsOnCompletion(transactionId: string): Promise<void>;
  updateStatisticsOnCancellation(transactionId: string): Promise<void>;

  // Transaction history operations
  getUserTransactionHistory(userId: string, role?: string, status?: string, sort?: string): Promise<any[]>;
  getTransactionDetails(listingId: string): Promise<any>;
  
  // Offer operations
  createOffer(offer: any): Promise<any>;
  getListingOffers(listingId: string): Promise<any[]>;
  getOffer(offerId: string): Promise<any>;
  updateOfferStatus(offerId: string, status: string, updates?: any): Promise<any>;
  getUserOffersMade(userId: string): Promise<any[]>;
  getUserOffersReceived(userId: string): Promise<any[]>;

  // Review request email operations
  trackReviewRequestEmail(data: InsertReviewRequestEmail): Promise<ReviewRequestEmail>;
  markReviewAsLeft(listingId: string, userId: string): Promise<void>;
  getPendingReviewReminders(daysAgo: number): Promise<Array<{listing: Listing, user: User, recipientUserId: string}>>;
  
  // Review token operations
  createReviewToken(data: InsertReviewToken): Promise<ReviewToken>;
  getReviewToken(token: string): Promise<ReviewToken | undefined>;
  markTokenAsUsed(tokenId: string): Promise<void>;

  // Upload session operations (QR code phone-to-desktop uploads)
  createUploadSession(session: InsertUploadSession): Promise<UploadSession>;
  getUploadSession(id: string): Promise<UploadSession | undefined>;
  addImagesToSession(sessionId: string, imageUrls: string[]): Promise<UploadSession>;
  deleteUploadSession(id: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;

  // AI usage tracking operations
  checkAndResetAIUsage(userId: string): Promise<User>;
  incrementAIUsage(userId: string, count: number): Promise<User>;
  getAIUsageInfo(userId: string): Promise<{
    usesThisMonth: number;
    resetDate: Date;
    creditsPurchased: number;
    subscriptionTier: string;
    remainingFree: number;
  }>;
  addAICredits(userId: string, credits: number): Promise<User>;
  updateSubscriptionTier(userId: string, tier: string): Promise<User>;

  // Credit system operations
  getUserCredits(userId: string): Promise<UserCredits | undefined>;
  createOrUpdateUserCredits(userId: string, email: string): Promise<UserCredits>;
  purchaseCredits(userId: string, amount: number, cost: number, stripePaymentId?: string): Promise<UserCredits>;
  useCredits(userId: string, amount: number, description?: string): Promise<UserCredits>;
  getCreditTransactions(userId: string, limit?: number): Promise<CreditTransaction[]>;

  // Welcome signup operations
  createWelcomeSignup(signup: any): Promise<any>;
  createGiveawayEntry(entry: any): Promise<any>;
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
    
    // Trigger search alerts for the new listing
    try {
      const { checkAndNotifyNewListings } = await import("./services/searchAlertService");
      await checkAndNotifyNewListings(listing.id);
    } catch (error) {
      console.error("Error triggering search alerts:", error);
      // Don't fail listing creation if alerts fail
    }
    
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
    
    let totalMessages = 0;
    
    if (userListings.length > 0) {
      const listingIds = userListings.map(l => l.id);
      const messagesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(or(...listingIds.map(id => eq(messages.listingId, id))));
      
      totalMessages = Number(messagesResult[0]?.count || 0);
    }
    
    return {
      totalActive,
      totalViews: 0,
      totalMessages,
      totalSold,
    };
  }

  async getAllListings(): Promise<ListingWithSeller[]> {
    // Get all active listings
    const allListings = await db
      .select()
      .from(listings)
      .where(eq(listings.status, "active"))
      .orderBy(desc(listings.createdAt));
    
    // Get unique user IDs
    const userIds = [...new Set(allListings.map(l => l.userId))];
    
    if (userIds.length === 0) {
      return [];
    }
    
    // Fetch seller information for all unique users
    const sellersData = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        emailVerified: users.emailVerified,
        phoneVerified: users.phoneVerified,
        idVerified: users.idVerified,
        addressVerified: users.addressVerified,
        averageRating: userStatistics.averageRating,
        totalReviews: userStatistics.totalReviewsReceived,
        successRate: userStatistics.sellerSuccessRate,
      })
      .from(users)
      .leftJoin(userStatistics, eq(users.id, userStatistics.userId))
      .where(inArray(users.id, userIds));
    
    // Create a map for quick lookup
    const sellersMap = new Map(
      sellersData.map(seller => [
        seller.userId,
        {
          seller: {
            id: seller.userId,
            firstName: seller.firstName,
            lastName: seller.lastName,
            profileImageUrl: seller.profileImageUrl,
            emailVerified: seller.emailVerified,
            phoneVerified: seller.phoneVerified,
            idVerified: seller.idVerified,
            addressVerified: seller.addressVerified,
          },
          sellerStats: {
            averageRating: seller.averageRating,
            totalReviews: seller.totalReviews || 0,
            successRate: seller.successRate,
          },
        },
      ])
    );
    
    // Combine listings with seller data
    return allListings.map(listing => ({
      ...listing,
      ...(sellersMap.get(listing.userId) || {}),
    }));
  }

  async getListingsByCategory(category: string): Promise<ListingWithSeller[]> {
    // Get listings by category
    const categoryListings = await db
      .select()
      .from(listings)
      .where(
        and(eq(listings.category, category), eq(listings.status, "active"))
      )
      .orderBy(desc(listings.createdAt));
    
    // Get unique user IDs
    const userIds = [...new Set(categoryListings.map(l => l.userId))];
    
    if (userIds.length === 0) {
      return [];
    }
    
    // Fetch seller information
    const sellersData = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        emailVerified: users.emailVerified,
        phoneVerified: users.phoneVerified,
        idVerified: users.idVerified,
        addressVerified: users.addressVerified,
        averageRating: userStatistics.averageRating,
        totalReviews: userStatistics.totalReviewsReceived,
        successRate: userStatistics.sellerSuccessRate,
      })
      .from(users)
      .leftJoin(userStatistics, eq(users.id, userStatistics.userId))
      .where(inArray(users.id, userIds));
    
    // Create a map for quick lookup
    const sellersMap = new Map(
      sellersData.map(seller => [
        seller.userId,
        {
          seller: {
            id: seller.userId,
            firstName: seller.firstName,
            lastName: seller.lastName,
            profileImageUrl: seller.profileImageUrl,
            emailVerified: seller.emailVerified,
            phoneVerified: seller.phoneVerified,
            idVerified: seller.idVerified,
            addressVerified: seller.addressVerified,
          },
          sellerStats: {
            averageRating: seller.averageRating,
            totalReviews: seller.totalReviews || 0,
            successRate: seller.successRate,
          },
        },
      ])
    );
    
    // Combine listings with seller data
    return categoryListings.map(listing => ({
      ...listing,
      ...(sellersMap.get(listing.userId) || {}),
    }));
  }

  async getListingsByBatchId(batchId: string): Promise<Listing[]> {
    return await db
      .select()
      .from(listings)
      .where(
        and(eq(listings.batchId, batchId), eq(listings.status, "active"))
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

  // Helper function to calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async advancedSearch(filters: SearchFilters): Promise<any[]> {
    const conditions = [eq(listings.status, "active")];

    // Text search in title, description, and meta tags
    if (filters.query) {
      conditions.push(
        or(
          sql`${listings.title} ILIKE ${`%${filters.query}%`}`,
          sql`${listings.description} ILIKE ${`%${filters.query}%`}`,
          sql`${listings.metaTags} ILIKE ${`%${filters.query}%`}`
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

    // Determine sort order (distance sorting handled after fetch)
    let orderByClause;
    switch (filters.sortBy) {
      case 'price-low':
        orderByClause = sql`${listings.price}::numeric ASC`;
        break;
      case 'price-high':
        orderByClause = sql`${listings.price}::numeric DESC`;
        break;
      case 'distance':
      case 'newest':
      default:
        orderByClause = desc(listings.createdAt);
        break;
    }

    // Get promoted listings first
    const { promotedListings: promotedListingsTable } = await import("@shared/schema");
    
    const promotedListingIds = await db
      .select({ listingId: promotedListingsTable.listingId })
      .from(promotedListingsTable)
      .where(
        and(
          eq(promotedListingsTable.status, "active"),
          sql`${promotedListingsTable.expiresAt} > NOW()`
        )
      );

    const promotedIds = promotedListingIds.map(p => p.listingId);

    // Get listings
    const listingResults = await db
      .select()
      .from(listings)
      .where(and(...conditions))
      .orderBy(orderByClause);

    // Separate promoted and organic listings
    const promotedResults = listingResults.filter(l => promotedIds.includes(l.id));
    const organicResults = listingResults.filter(l => !promotedIds.includes(l.id));

    // Combine: promoted first, then organic
    const combinedResults = [...promotedResults, ...organicResults];

    // Get unique user IDs
    const userIds = [...new Set(combinedResults.map(l => l.userId))];

    // Fetch seller information for all unique users
    const sellersData = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        emailVerified: users.emailVerified,
        phoneVerified: users.phoneVerified,
        idVerified: users.idVerified,
        addressVerified: users.addressVerified,
        averageRating: userStatistics.averageRating,
        totalReviews: userStatistics.totalReviewsReceived,
        successRate: userStatistics.sellerSuccessRate,
      })
      .from(users)
      .leftJoin(userStatistics, eq(users.id, userStatistics.userId))
      .where(inArray(users.id, userIds));

    // Create a map for quick lookup
    const sellersMap = new Map(
      sellersData.map(seller => [
        seller.userId,
        {
          seller: {
            id: seller.userId,
            firstName: seller.firstName,
            lastName: seller.lastName,
            profileImageUrl: seller.profileImageUrl,
            emailVerified: seller.emailVerified,
            phoneVerified: seller.phoneVerified,
            idVerified: seller.idVerified,
            addressVerified: seller.addressVerified,
          },
          sellerStats: {
            averageRating: seller.averageRating,
            totalReviews: seller.totalReviews || 0,
            successRate: seller.successRate,
          },
        },
      ])
    );

    // Combine listings with seller data and calculate distances
    let resultsWithSellers = combinedResults.map(listing => ({
      ...listing,
      isPromoted: promotedIds.includes(listing.id),
      ...(sellersMap.get(listing.userId) || {}),
    }));

    // Calculate distances and filter by distance if user location is provided
    if (filters.userLocation && filters.distance) {
      resultsWithSellers = resultsWithSellers
        .map(listing => {
          // Calculate distance if listing has coordinates
          let distance = null;
          if (listing.locationLatitude && listing.locationLongitude) {
            distance = this.calculateDistance(
              filters.userLocation!.latitude,
              filters.userLocation!.longitude,
              parseFloat(listing.locationLatitude),
              parseFloat(listing.locationLongitude)
            );
          }
          return { ...listing, distance };
        })
        .filter(listing => {
          // Include listings within distance radius OR listings without coordinates
          if (listing.distance === null) return true; // Include listings without coordinates
          return listing.distance <= filters.distance!;
        });

      // Sort by distance if requested
      if (filters.sortBy === 'distance') {
        resultsWithSellers.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
    } else if (filters.userLocation) {
      // Just add distance info without filtering
      resultsWithSellers = resultsWithSellers.map(listing => {
        let distance = null;
        if (listing.locationLatitude && listing.locationLongitude) {
          distance = this.calculateDistance(
            filters.userLocation!.latitude,
            filters.userLocation!.longitude,
            parseFloat(listing.locationLatitude),
            parseFloat(listing.locationLongitude)
          );
        }
        return { ...listing, distance };
      });
    }

    return resultsWithSellers;
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

  async getUserFavorites(userId: string): Promise<ListingWithSeller[]> {
    // Get favorite listings
    const favoriteResults = await db
      .select({ listing: listings })
      .from(favorites)
      .innerJoin(listings, eq(favorites.listingId, listings.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
    
    const favoriteListings = favoriteResults.map(r => r.listing);
    
    // Get unique user IDs
    const userIds = [...new Set(favoriteListings.map(l => l.userId))];
    
    if (userIds.length === 0) {
      return [];
    }
    
    // Fetch seller information
    const sellersData = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        emailVerified: users.emailVerified,
        phoneVerified: users.phoneVerified,
        idVerified: users.idVerified,
        addressVerified: users.addressVerified,
        averageRating: userStatistics.averageRating,
        totalReviews: userStatistics.totalReviewsReceived,
        successRate: userStatistics.sellerSuccessRate,
      })
      .from(users)
      .leftJoin(userStatistics, eq(users.id, userStatistics.userId))
      .where(inArray(users.id, userIds));
    
    // Create a map for quick lookup
    const sellersMap = new Map(
      sellersData.map(seller => [
        seller.userId,
        {
          seller: {
            id: seller.userId,
            firstName: seller.firstName,
            lastName: seller.lastName,
            profileImageUrl: seller.profileImageUrl,
            emailVerified: seller.emailVerified,
            phoneVerified: seller.phoneVerified,
            idVerified: seller.idVerified,
            addressVerified: seller.addressVerified,
          },
          sellerStats: {
            averageRating: seller.averageRating,
            totalReviews: seller.totalReviews || 0,
            successRate: seller.successRate,
          },
        },
      ])
    );
    
    // Combine listings with seller data
    return favoriteListings.map(listing => ({
      ...listing,
      ...(sellersMap.get(listing.userId) || {}),
    }));
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

  // Review operations
  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(reviewData)
      .returning();
    
    // Update user statistics
    await this.updateUserStatisticsAfterReview(review);
    
    return review;
  }

  async getUserReviews(
    userId: string, 
    filters?: {
      stars?: number;
      role?: 'seller' | 'buyer';
      period?: '30d' | '3m' | '6m' | '12m' | 'all';
      sort?: 'recent' | 'oldest' | 'highest' | 'lowest' | 'helpful';
      limit?: number;
      offset?: number;
    }
  ): Promise<ReviewWithMetadata[]> {
    const conditions = [eq(reviews.reviewedUserId, userId)];
    
    // Filter by stars
    if (filters?.stars) {
      conditions.push(eq(reviews.overallRating, filters.stars));
    }
    
    // Filter by role (if user wants reviews "as seller", show reviews from buyers)
    if (filters?.role) {
      const reviewerRole = filters.role === 'seller' ? 'buyer' : 'seller';
      conditions.push(eq(reviews.reviewerRole, reviewerRole));
    }
    
    // Filter by period
    if (filters?.period && filters.period !== 'all') {
      const periodMap = {
        '30d': sql`NOW() - INTERVAL '30 days'`,
        '3m': sql`NOW() - INTERVAL '3 months'`,
        '6m': sql`NOW() - INTERVAL '6 months'`,
        '12m': sql`NOW() - INTERVAL '12 months'`,
      };
      conditions.push(sql`${reviews.createdAt} >= ${periodMap[filters.period]}`);
    }

    // Sort options
    let orderByClause;
    switch (filters?.sort) {
      case 'oldest':
        orderByClause = [reviews.createdAt];
        break;
      case 'highest':
        orderByClause = [desc(reviews.overallRating), desc(reviews.createdAt)];
        break;
      case 'lowest':
        orderByClause = [reviews.overallRating, desc(reviews.createdAt)];
        break;
      case 'helpful':
        orderByClause = [desc(reviews.helpfulCount), desc(reviews.createdAt)];
        break;
      case 'recent':
      default:
        orderByClause = [desc(reviews.createdAt)];
        break;
    }

    const result = await db
      .select({
        review: reviews,
        reviewer: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(and(...conditions))
      .orderBy(...orderByClause)
      .limit(filters?.limit || 20)
      .offset(filters?.offset || 0);

    // Transform to include reviewer data in flat structure
    return result.map((row) => ({
      ...row.review,
      reviewerName: row.reviewer.firstName && row.reviewer.lastName
        ? `${row.reviewer.firstName} ${row.reviewer.lastName}`
        : row.reviewer.firstName || row.reviewer.lastName || 'Anonymous',
      reviewerProfileImage: row.reviewer.profileImageUrl || undefined,
    }));
  }

  async getUserReviewsCount(
    userId: string,
    filters?: {
      stars?: number;
      role?: 'seller' | 'buyer';
      period?: '30d' | '3m' | '6m' | '12m' | 'all';
    }
  ): Promise<number> {
    const conditions = [eq(reviews.reviewedUserId, userId)];
    
    // Filter by stars
    if (filters?.stars) {
      conditions.push(eq(reviews.overallRating, filters.stars));
    }
    
    // Filter by role
    if (filters?.role) {
      const reviewerRole = filters.role === 'seller' ? 'buyer' : 'seller';
      conditions.push(eq(reviews.reviewerRole, reviewerRole));
    }
    
    // Filter by period
    if (filters?.period && filters.period !== 'all') {
      const periodMap = {
        '30d': sql`NOW() - INTERVAL '30 days'`,
        '3m': sql`NOW() - INTERVAL '3 months'`,
        '6m': sql`NOW() - INTERVAL '6 months'`,
        '12m': sql`NOW() - INTERVAL '12 months'`,
      };
      conditions.push(sql`${reviews.createdAt} >= ${periodMap[filters.period]}`);
    }

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(and(...conditions));

    return result[0]?.count || 0;
  }

  async respondToReview(reviewId: string, userId: string, responseText: string): Promise<Review> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId));

    if (!review) {
      throw new Error("Review not found");
    }

    if (review.reviewedUserId !== userId) {
      throw new Error("Only the reviewed user can respond to this review");
    }

    // Check if editing an existing response
    const isEditing = !!review.sellerResponse;
    
    if (isEditing) {
      // Check 24-hour window against original post time (sellerResponseAt)
      // This prevents infinite editing by always measuring from the original post
      if (!review.sellerResponseAt) {
        throw new Error("Invalid review state: response exists but no post timestamp found");
      }
      
      const hoursSinceOriginalPost = (Date.now() - new Date(review.sellerResponseAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceOriginalPost > 24) {
        throw new Error("Response can only be edited within 24 hours of posting");
      }
    }

    const updateData: any = {
      sellerResponse: responseText,
    };

    if (isEditing) {
      // Set edited timestamp when modifying existing response
      updateData.sellerResponseEditedAt = new Date();
    } else {
      // Set initial response timestamp when creating new response
      updateData.sellerResponseAt = new Date();
    }

    const [updatedReview] = await db
      .update(reviews)
      .set(updateData)
      .where(eq(reviews.id, reviewId))
      .returning();

    return updatedReview;
  }

  async voteOnReview(reviewId: string, userId: string, voteType: string): Promise<{ helpful: number; notHelpful: number }> {
    // Check if user already voted
    const [existingVote] = await db
      .select()
      .from(reviewVotes)
      .where(and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.userId, userId)));

    if (existingVote) {
      // Update existing vote if different
      if (existingVote.voteType !== voteType) {
        await db
          .update(reviewVotes)
          .set({ voteType })
          .where(eq(reviewVotes.id, existingVote.id));
      }
    } else {
      // Create new vote
      await db
        .insert(reviewVotes)
        .values({ reviewId, userId, voteType });
    }

    // Count votes
    const helpfulVotes = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviewVotes)
      .where(and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.voteType, 'helpful')));

    const notHelpfulVotes = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviewVotes)
      .where(and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.voteType, 'not_helpful')));

    const helpful = Number(helpfulVotes[0]?.count || 0);
    const notHelpful = Number(notHelpfulVotes[0]?.count || 0);

    // Update review counts
    await db
      .update(reviews)
      .set({ helpfulCount: helpful, notHelpfulCount: notHelpful })
      .where(eq(reviews.id, reviewId));

    return { helpful, notHelpful };
  }

  async flagReview(reviewId: string, reason: string): Promise<Review> {
    const [review] = await db
      .update(reviews)
      .set({ isFlagged: true, flagReason: reason })
      .where(eq(reviews.id, reviewId))
      .returning();

    if (!review) {
      throw new Error("Review not found");
    }

    return review;
  }

  // Cancellation comment operations
  async createCancellationComment(commentData: InsertCancellationComment): Promise<CancellationComment> {
    const [comment] = await db
      .insert(cancellationComments)
      .values(commentData)
      .returning();
    return comment;
  }

  async getCancellationComment(commentId: string): Promise<CancellationComment | undefined> {
    const [comment] = await db
      .select()
      .from(cancellationComments)
      .where(eq(cancellationComments.id, commentId));
    return comment;
  }

  async respondToCancellationComment(commentId: string, userId: string, responseText: string, responseIsPublic: boolean): Promise<CancellationComment> {
    const [comment] = await db
      .update(cancellationComments)
      .set({
        responseByUserId: userId,
        responseText,
        responseIsPublic,
        responseAt: new Date(),
      })
      .where(eq(cancellationComments.id, commentId))
      .returning();

    if (!comment) {
      throw new Error("Cancellation comment not found");
    }

    return comment;
  }

  async voteOnCancellationComment(commentId: string, userId: string, voteType: string): Promise<{ helpful: number; notHelpful: number }> {
    // Check if user already voted
    const [existingVote] = await db
      .select()
      .from(cancellationCommentVotes)
      .where(and(eq(cancellationCommentVotes.commentId, commentId), eq(cancellationCommentVotes.userId, userId)));

    if (existingVote) {
      // Update existing vote if different
      if (existingVote.voteType !== voteType) {
        await db
          .update(cancellationCommentVotes)
          .set({ voteType })
          .where(eq(cancellationCommentVotes.id, existingVote.id));
      }
    } else {
      // Create new vote
      await db
        .insert(cancellationCommentVotes)
        .values({ commentId, userId, voteType });
    }

    // Count votes
    const helpfulVotes = await db
      .select({ count: sql<number>`count(*)` })
      .from(cancellationCommentVotes)
      .where(and(eq(cancellationCommentVotes.commentId, commentId), eq(cancellationCommentVotes.voteType, 'helpful')));

    const notHelpfulVotes = await db
      .select({ count: sql<number>`count(*)` })
      .from(cancellationCommentVotes)
      .where(and(eq(cancellationCommentVotes.commentId, commentId), eq(cancellationCommentVotes.voteType, 'not_helpful')));

    const helpful = Number(helpfulVotes[0]?.count || 0);
    const notHelpful = Number(notHelpfulVotes[0]?.count || 0);

    // Update comment counts
    await db
      .update(cancellationComments)
      .set({ helpfulCount: helpful, notHelpfulCount: notHelpful })
      .where(eq(cancellationComments.id, commentId));

    return { helpful, notHelpful };
  }

  // Statistics operations
  async getUserStatistics(userId: string): Promise<UserStatistics | undefined> {
    const [stats] = await db
      .select()
      .from(userStatistics)
      .where(eq(userStatistics.userId, userId));

    if (!stats) {
      // Create default statistics for new users
      const [newStats] = await db
        .insert(userStatistics)
        .values({
          userId,
          memberSince: new Date(),
        })
        .returning();
      return newStats;
    }

    return stats;
  }

  async getUserStatisticsSummary(userId: string): Promise<any> {
    // Get user basic info
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return null;
    }

    // Get statistics
    const stats = await this.getUserStatistics(userId);
    if (!stats) {
      return null;
    }

    // Get recent cancellations (last 90 days, max 3)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentCancellations = await db
      .select({
        cancellation: cancellationComments,
        listing: {
          id: listings.id,
          title: listings.title,
        },
      })
      .from(cancellationComments)
      .innerJoin(listings, eq(cancellationComments.listingId, listings.id))
      .where(
        and(
          eq(cancellationComments.cancelledByUserId, userId),
          eq(cancellationComments.isPublic, true),
          sql`${cancellationComments.createdAt} >= ${ninetyDaysAgo.toISOString()}`
        )
      )
      .orderBy(desc(cancellationComments.createdAt))
      .limit(3);

    // Get top reviews (max 3, highest rated)
    const topReviews = await db
      .select({
        review: reviews,
        reviewer: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(
        and(
          eq(reviews.reviewedUserId, userId),
          eq(reviews.isPublic, true)
        )
      )
      .orderBy(desc(reviews.overallRating), desc(reviews.createdAt))
      .limit(3);

    // Calculate days since last cancellation
    let lastCancellationDaysAgo = null;
    if (recentCancellations.length > 0) {
      const lastCancellation = recentCancellations[0].cancellation.createdAt;
      if (lastCancellation) {
        const daysDiff = Math.floor((Date.now() - new Date(lastCancellation).getTime()) / (1000 * 60 * 60 * 24));
        lastCancellationDaysAgo = daysDiff;
      }
    }

    // Format response
    return {
      userId: user.id,
      displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      profileImageUrl: user.profileImageUrl,
      averageRating: Number(stats.averageRating) || 0,
      totalReviews: stats.totalReviewsReceived || 0,
      memberSince: stats.memberSince || user.createdAt,

      asBuyer: {
        totalPurchases: stats.totalPurchases || 0,
        successfulPurchases: stats.successfulPurchases || 0,
        successRate: Number(stats.buyerSuccessRate) || 0,
        cancelledByBuyer: stats.cancelledByBuyer || 0,
        buyerNoShows: stats.buyerNoShows || 0,
        recentTransactions90d: stats.recentTransactions90d || 0,
        recentCancellations90d: stats.recentCancellations90d || 0,
        recentNoShows90d: stats.recentNoShows90d || 0,
        lastCancellationDaysAgo,
        avgResponseMinutes: stats.avgResponseTimeMinutes || 0,
        responseRate: Number(stats.responseRatePercent) || 0,
      },

      asSeller: {
        totalSales: stats.totalSales || 0,
        successfulSales: stats.successfulSales || 0,
        successRate: Number(stats.sellerSuccessRate) || 0,
        cancelledBySeller: stats.cancelledBySeller || 0,
        sellerNoShows: stats.sellerNoShows || 0,
        recentTransactions90d: stats.recentTransactions90d || 0,
        recentCancellations90d: stats.recentCancellations90d || 0,
        recentNoShows90d: stats.recentNoShows90d || 0,
        avgResponseMinutes: stats.avgResponseTimeMinutes || 0,
        responseRate: Number(stats.responseRatePercent) || 0,
      },

      recentCancellations: recentCancellations.map((rc) => ({
        date: rc.cancellation.createdAt,
        item: rc.listing.title,
        role: rc.cancellation.cancelledRole,
        timing: rc.cancellation.cancellationTiming,
        comment: rc.cancellation.comment,
        hasResponse: !!rc.cancellation.responseText,
      })),

      topReviews: topReviews.map((tr) => ({
        rating: tr.review.overallRating,
        text: tr.review.reviewText,
        reviewerName: `${tr.reviewer.firstName || ''} ${tr.reviewer.lastName || ''}`.trim(),
        date: tr.review.createdAt,
      })),
    };
  }

  async getUserTransactionTimeline(userId: string): Promise<TransactionEvent[]> {
    return await db
      .select()
      .from(transactionEvents)
      .where(eq(transactionEvents.userId, userId))
      .orderBy(desc(transactionEvents.createdAt));
  }

  async getUserMonthlyStatistics(userId: string, months: number = 3): Promise<any[]> {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - months);

    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE event_type = 'completed') as completed,
        COUNT(*) FILTER (WHERE event_type = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE event_type = 'no_show') as no_shows
      FROM transaction_events te
      WHERE 
        (te.user_id = ${userId} OR 
         te.listing_id IN (SELECT id FROM listings WHERE user_id = ${userId}))
        AND te.created_at >= ${monthsAgo.toISOString()}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT ${months}
    `);

    return result.rows.map((row: any) => ({
      month: row.month,
      total: Number(row.total),
      completed: Number(row.completed),
      cancelled: Number(row.cancelled),
      noShows: Number(row.no_shows),
    }));
  }

  async recalculateUserStatistics(userId: string): Promise<UserStatistics> {
    // Call the PostgreSQL function to recalculate
    await db.execute(sql`SELECT recalculate_success_rates(${userId})`);
    
    // Return updated statistics
    const stats = await this.getUserStatistics(userId);
    if (!stats) {
      throw new Error("Failed to get user statistics after recalculation");
    }
    return stats;
  }

  async updateStatisticsOnCompletion(transactionId: string): Promise<void> {
    // The trigger will handle this automatically
    // This method exists for manual updates if needed
    const [event] = await db
      .select()
      .from(transactionEvents)
      .where(eq(transactionEvents.id, transactionId));
    
    if (!event) {
      throw new Error("Transaction event not found");
    }

    // Trigger will fire automatically on insert, so just verify it exists
    console.log(`Transaction ${transactionId} completion statistics updated by trigger`);
  }

  async updateStatisticsOnCancellation(transactionId: string): Promise<void> {
    // The trigger will handle this automatically
    // This method exists for manual updates if needed
    const [event] = await db
      .select()
      .from(transactionEvents)
      .where(eq(transactionEvents.id, transactionId));
    
    if (!event) {
      throw new Error("Transaction event not found");
    }

    // Trigger will fire automatically on insert, so just verify it exists
    console.log(`Transaction ${transactionId} cancellation statistics updated by trigger`);
  }

  // Transaction history operations
  async getUserTransactionHistory(userId: string, role?: string, status?: string, sort?: string): Promise<any[]> {
    // Get all transaction events for this user
    const events = await db
      .select({
        event: transactionEvents,
        listing: listings,
        seller: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(transactionEvents)
      .innerJoin(listings, eq(transactionEvents.listingId, listings.id))
      .innerJoin(users, eq(listings.userId, users.id))
      .where(
        or(
          eq(transactionEvents.userId, userId), // user was buyer
          eq(listings.userId, userId) // user was seller
        )
      )
      .orderBy(desc(transactionEvents.createdAt));

    // Enrich with buyer info, reviews, and cancellation comments
    const enrichedTransactions = await Promise.all(
      events.map(async (item) => {
        const { event, listing, seller } = item;
        const isSeller = listing.userId === userId;
        const buyerId = event.userId;

        // Get buyer info
        const [buyer] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          })
          .from(users)
          .where(eq(users.id, buyerId));

        // Get statistics for the other party
        const otherPartyId = isSeller ? buyerId : seller.id;
        const [otherPartyStats] = await db
          .select()
          .from(userStatistics)
          .where(eq(userStatistics.userId, otherPartyId));

        // Get reviews for this listing
        const listingReviews = await db
          .select()
          .from(reviews)
          .where(eq(reviews.listingId, listing.id));

        // Get cancellation comment if cancelled
        const cancellationComment =
          event.eventType === "cancelled"
            ? await db
                .select()
                .from(cancellationComments)
                .where(eq(cancellationComments.listingId, listing.id))
                .limit(1)
            : [];

        return {
          ...event,
          listing,
          seller,
          buyer,
          role: isSeller ? "seller" : "buyer",
          otherParty: isSeller ? buyer : seller,
          otherPartyStats,
          reviews: listingReviews,
          cancellationComment: cancellationComment[0] || null,
        };
      })
    );

    // Apply filters
    let filtered = enrichedTransactions;

    if (role) {
      filtered = filtered.filter((t) => t.role === role);
    }

    if (status) {
      filtered = filtered.filter((t) => t.eventType === status);
    }

    return filtered;
  }

  async getTransactionDetails(listingId: string, currentUserId?: string | null): Promise<any> {
    const listing = await this.getListingWithSeller(listingId);
    
    if (!listing) {
      return null;
    }

    // Get reviews for this listing
    const listingReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.listingId, listingId));

    // Get cancellation comments for this listing
    const comments = await db
      .select()
      .from(cancellationComments)
      .where(eq(cancellationComments.listingId, listingId));

    // Get transaction events for this listing
    const events = await db
      .select()
      .from(transactionEvents)
      .where(eq(transactionEvents.listingId, listingId))
      .orderBy(desc(transactionEvents.createdAt));

    // Determine eligibility for review/cancellation
    let eligibleForReview = false;
    let eligibleForCancellationReport = false;
    let canCancelTransaction = false;
    let userRole: 'buyer' | 'seller' | null = null;
    
    if (currentUserId) {
      const isSeller = listing.listing.userId === currentUserId;
      const isBuyer = !isSeller && events.some((e: any) => e.userId === currentUserId);
      
      if (isSeller) {
        userRole = 'seller';
      } else if (isBuyer) {
        userRole = 'buyer';
      }

      // Check if there's a completed transaction
      const hasCompleted = events.some(
        (e: any) => e.eventType === 'completed' || e.eventType === 'confirmed'
      );
      
      // Check if already cancelled
      const hasCancellation = events.some((e: any) => e.eventType === 'cancelled');

      // User can cancel if they're buyer or seller, and transaction is not completed or cancelled
      if ((isSeller || isBuyer) && !hasCompleted && !hasCancellation) {
        canCancelTransaction = true;
      }

      if (!isSeller) {
        // Check if eligible for review (completed transaction as buyer)
        const completedEvent = events.find(
          (e: any) => 
            (e.eventType === 'completed' || e.eventType === 'confirmed') && 
            e.userId === currentUserId
        );
        
        if (completedEvent) {
          eligibleForReview = true;
        }

        // Check if user can report cancellation (had an interaction but transaction didn't complete)
        const hasInteraction = events.some((e: any) => e.userId === currentUserId);
        
        if (hasInteraction && (hasCancellation || listing.listing.status === 'cancelled')) {
          eligibleForCancellationReport = true;
        }
      }
    }

    return {
      ...listing,
      reviews: listingReviews,
      cancellationComments: comments,
      transactionEvents: events,
      eligibleForReview,
      eligibleForCancellationReport,
      canCancelTransaction,
      userRole,
    };
  }

  // Helper method to update user statistics after a review
  private async updateUserStatisticsAfterReview(review: Review): Promise<void> {
    const stats = await this.getUserStatistics(review.reviewedUserId);
    
    if (!stats) return;

    const totalReviews = (stats.totalReviewsReceived || 0) + 1;
    const updates: Partial<typeof userStatistics.$inferInsert> = {
      totalReviewsReceived: totalReviews,
    };

    // Update star counts
    switch (review.overallRating) {
      case 5:
        updates.fiveStarReviews = (stats.fiveStarReviews || 0) + 1;
        break;
      case 4:
        updates.fourStarReviews = (stats.fourStarReviews || 0) + 1;
        break;
      case 3:
        updates.threeStarReviews = (stats.threeStarReviews || 0) + 1;
        break;
      case 2:
        updates.twoStarReviews = (stats.twoStarReviews || 0) + 1;
        break;
      case 1:
        updates.oneStarReviews = (stats.oneStarReviews || 0) + 1;
        break;
    }

    // Calculate average rating
    const totalStars = 
      (updates.fiveStarReviews || stats.fiveStarReviews || 0) * 5 +
      (updates.fourStarReviews || stats.fourStarReviews || 0) * 4 +
      (updates.threeStarReviews || stats.threeStarReviews || 0) * 3 +
      (updates.twoStarReviews || stats.twoStarReviews || 0) * 2 +
      (updates.oneStarReviews || stats.oneStarReviews || 0) * 1;

    updates.averageRating = String(totalStars / totalReviews);

    await db
      .update(userStatistics)
      .set(updates)
      .where(eq(userStatistics.userId, review.reviewedUserId));
  }

  // Offer operations
  async createOffer(offerData: any): Promise<any> {
    const [offer] = await db
      .insert(offers)
      .values(offerData)
      .returning();
    return offer;
  }

  async getListingOffers(listingId: string): Promise<any[]> {
    const allOffers = await db
      .select({
        offer: offers,
        buyer: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(offers)
      .innerJoin(users, eq(offers.buyerId, users.id))
      .where(eq(offers.listingId, listingId))
      .orderBy(desc(offers.createdAt));

    return allOffers;
  }

  async getOffer(offerId: string): Promise<any> {
    const { alias } = await import("drizzle-orm/pg-core");
    const buyerUser = alias(users, "buyer_user");
    const sellerUser = alias(users, "seller_user");
    
    const [offer] = await db
      .select({
        offer: offers,
        buyer: {
          id: buyerUser.id,
          firstName: buyerUser.firstName,
          lastName: buyerUser.lastName,
          profileImageUrl: buyerUser.profileImageUrl,
        },
        seller: {
          id: sellerUser.id,
          firstName: sellerUser.firstName,
          lastName: sellerUser.lastName,
          profileImageUrl: sellerUser.profileImageUrl,
        },
      })
      .from(offers)
      .innerJoin(buyerUser, eq(offers.buyerId, buyerUser.id))
      .innerJoin(sellerUser, eq(offers.sellerId, sellerUser.id))
      .where(eq(offers.id, offerId));

    return offer;
  }

  async updateOfferStatus(offerId: string, status: string, updates: any = {}): Promise<any> {
    const [offer] = await db
      .update(offers)
      .set({
        status,
        respondedAt: new Date(),
        ...updates,
      })
      .where(eq(offers.id, offerId))
      .returning();
    return offer;
  }

  async getUserOffersMade(userId: string): Promise<any[]> {
    const userOffers = await db
      .select({
        offer: offers,
        listing: {
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images,
        },
        seller: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(offers)
      .innerJoin(listings, eq(offers.listingId, listings.id))
      .innerJoin(users, eq(offers.sellerId, users.id))
      .where(eq(offers.buyerId, userId))
      .orderBy(desc(offers.createdAt));

    return userOffers;
  }

  async getUserOffersReceived(userId: string): Promise<any[]> {
    const receivedOffers = await db
      .select({
        offer: offers,
        listing: {
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images,
        },
        buyer: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(offers)
      .innerJoin(listings, eq(offers.listingId, listings.id))
      .innerJoin(users, eq(offers.buyerId, users.id))
      .where(eq(offers.sellerId, userId))
      .orderBy(desc(offers.createdAt));

    return receivedOffers;
  }

  // Review request email operations
  async trackReviewRequestEmail(data: InsertReviewRequestEmail): Promise<ReviewRequestEmail> {
    const [email] = await db
      .insert(reviewRequestEmails)
      .values(data)
      .onConflictDoNothing()
      .returning();
    return email;
  }

  async hasUserReviewedListing(userId: string, listingId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.reviewerId, userId),
          eq(reviews.listingId, listingId)
        )
      )
      .limit(1);
    
    return !!existing;
  }

  async markReviewAsLeft(listingId: string, userId: string): Promise<void> {
    await db
      .update(reviewRequestEmails)
      .set({
        reviewLeft: true,
        reviewLeftAt: new Date(),
      })
      .where(
        and(
          eq(reviewRequestEmails.listingId, listingId),
          eq(reviewRequestEmails.recipientUserId, userId)
        )
      );
  }

  async getPendingReviewReminders(daysAgo: number): Promise<Array<{listing: Listing, user: User, recipientUserId: string}>> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.setDate(-daysAgo));
    
    const pendingReminders = await db
      .select({
        listing: listings,
        user: users,
        recipientUserId: reviewRequestEmails.recipientUserId,
      })
      .from(reviewRequestEmails)
      .innerJoin(listings, eq(reviewRequestEmails.listingId, listings.id))
      .innerJoin(users, eq(reviewRequestEmails.recipientUserId, users.id))
      .where(
        and(
          eq(reviewRequestEmails.emailType, 'initial'),
          eq(reviewRequestEmails.reviewLeft, false),
          eq(users.reviewEmailsEnabled, true),
          sql`DATE(${reviewRequestEmails.sentAt}) = DATE(${targetDate})`
        )
      );

    const pendingWithoutReminder = [];
    for (const item of pendingReminders) {
      const [existingReminder] = await db
        .select()
        .from(reviewRequestEmails)
        .where(
          and(
            eq(reviewRequestEmails.listingId, item.listing.id),
            eq(reviewRequestEmails.recipientUserId, item.recipientUserId),
            eq(reviewRequestEmails.emailType, 'reminder')
          )
        );
      
      if (!existingReminder) {
        pendingWithoutReminder.push(item);
      }
    }

    return pendingWithoutReminder;
  }

  // Review token operations
  async createReviewToken(data: InsertReviewToken): Promise<ReviewToken> {
    const [token] = await db
      .insert(reviewTokens)
      .values(data)
      .returning();
    return token;
  }

  async getReviewToken(token: string): Promise<ReviewToken | undefined> {
    const [reviewToken] = await db
      .select()
      .from(reviewTokens)
      .where(eq(reviewTokens.token, token));
    return reviewToken;
  }

  async markTokenAsUsed(tokenId: string): Promise<void> {
    await db
      .update(reviewTokens)
      .set({ used: true })
      .where(eq(reviewTokens.id, tokenId));
  }

  // Upload session operations (QR code phone-to-desktop uploads)
  async createUploadSession(session: InsertUploadSession): Promise<UploadSession> {
    const [newSession] = await db
      .insert(uploadSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getUploadSession(id: string): Promise<UploadSession | undefined> {
    const [session] = await db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.id, id));
    return session;
  }

  async addImagesToSession(sessionId: string, imageUrls: string[]): Promise<UploadSession> {
    const session = await this.getUploadSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const updatedImages = [...session.images, ...imageUrls];
    const [updated] = await db
      .update(uploadSessions)
      .set({ images: updatedImages })
      .where(eq(uploadSessions.id, sessionId))
      .returning();
    
    return updated;
  }

  async deleteUploadSession(id: string): Promise<void> {
    await db.delete(uploadSessions).where(eq(uploadSessions.id, id));
  }

  async cleanupExpiredSessions(): Promise<void> {
    await db
      .delete(uploadSessions)
      .where(sql`${uploadSessions.expiresAt} < NOW()`);
  }

  // AI usage tracking implementations
  async checkAndResetAIUsage(userId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date();
    const resetDate = user.aiResetDate ? new Date(user.aiResetDate) : new Date();
    
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfResetMonth = new Date(resetDate.getFullYear(), resetDate.getMonth(), 1);
    
    if (startOfCurrentMonth > startOfResetMonth) {
      const [updatedUser] = await db
        .update(users)
        .set({
          aiUsesThisMonth: 0,
          aiResetDate: now,
          updatedAt: now,
        })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    }
    
    return user;
  }

  async incrementAIUsage(userId: string, count: number): Promise<User> {
    const user = await this.checkAndResetAIUsage(userId);
    
    const [updatedUser] = await db
      .update(users)
      .set({
        aiUsesThisMonth: (user.aiUsesThisMonth || 0) + count,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async getAIUsageInfo(userId: string): Promise<{
    usesThisMonth: number;
    resetDate: Date;
    creditsPurchased: number;
    subscriptionTier: string;
    remainingFree: number;
  }> {
    const user = await this.checkAndResetAIUsage(userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const FREE_TIER_LIMIT = 5;
    const usesThisMonth = user.aiUsesThisMonth || 0;
    const creditsPurchased = user.aiCreditsPurchased || 0;
    const subscriptionTier = user.subscriptionTier || 'free';
    
    const remainingFree = Math.max(0, FREE_TIER_LIMIT - usesThisMonth);
    
    return {
      usesThisMonth,
      resetDate: user.aiResetDate || new Date(),
      creditsPurchased,
      subscriptionTier,
      remainingFree,
    };
  }

  async addAICredits(userId: string, credits: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        aiCreditsPurchased: (user.aiCreditsPurchased || 0) + credits,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async updateSubscriptionTier(userId: string, tier: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        subscriptionTier: tier,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async checkAndDeductAICredit(userId: string): Promise<{ success: boolean; remainingCredits: number; usedPurchased: boolean }> {
    const user = await this.checkAndResetAIUsage(userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const FREE_TIER_LIMIT = 5;
    const usesThisMonth = user.aiUsesThisMonth || 0;
    const creditsPurchased = user.aiCreditsPurchased || 0;
    const remainingFree = Math.max(0, FREE_TIER_LIMIT - usesThisMonth);
    
    // Check if user has any credits available (free or purchased)
    if (remainingFree > 0) {
      // Use free credit and get updated user
      const [updatedUser] = await db
        .update(users)
        .set({
          aiUsesThisMonth: usesThisMonth + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      
      // Recalculate remaining credits from updated user
      const newRemainingFree = Math.max(0, FREE_TIER_LIMIT - (updatedUser.aiUsesThisMonth || 0));
      const newCreditsPurchased = updatedUser.aiCreditsPurchased || 0;
      
      return {
        success: true,
        remainingCredits: newRemainingFree + newCreditsPurchased,
        usedPurchased: false,
      };
    } else if (creditsPurchased > 0) {
      // Use purchased credit and get updated user
      const [updatedUser] = await db
        .update(users)
        .set({
          aiCreditsPurchased: creditsPurchased - 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      
      // Calculate remaining credits from updated user
      const newRemainingFree = Math.max(0, FREE_TIER_LIMIT - (updatedUser.aiUsesThisMonth || 0));
      const newCreditsPurchased = updatedUser.aiCreditsPurchased || 0;
      
      return {
        success: true,
        remainingCredits: newRemainingFree + newCreditsPurchased,
        usedPurchased: true,
      };
    } else {
      // No credits available
      return {
        success: false,
        remainingCredits: 0,
        usedPurchased: false,
      };
    }
  }

  // Credit system methods
  async getUserCredits(userId: string): Promise<UserCredits | undefined> {
    const [credits] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);
    return credits;
  }

  async createOrUpdateUserCredits(userId: string, email: string): Promise<UserCredits> {
    const existing = await this.getUserCredits(userId);
    
    if (existing) {
      return existing;
    }

    const [newCredits] = await db
      .insert(userCredits)
      .values({
        userId,
        email,
        creditsRemaining: 0,
        creditsPurchased: 0,
        creditsUsed: 0,
      })
      .returning();
    
    return newCredits;
  }

  async purchaseCredits(userId: string, amount: number, cost: number, stripePaymentId?: string): Promise<UserCredits> {
    // Ensure user credits record exists
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    await this.createOrUpdateUserCredits(userId, user.email!);

    // Update credits
    const [updated] = await db
      .update(userCredits)
      .set({
        creditsRemaining: sql`${userCredits.creditsRemaining} + ${amount}`,
        creditsPurchased: sql`${userCredits.creditsPurchased} + ${amount}`,
        lastPurchaseDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId))
      .returning();

    // Log transaction
    await db.insert(creditTransactions).values({
      userId,
      transactionType: 'purchase',
      amount,
      cost: cost.toString(),
      description: `Purchased ${amount} AI credits`,
      stripePaymentId,
    });

    return updated;
  }

  async useCredits(userId: string, amount: number, description?: string): Promise<UserCredits> {
    const credits = await this.getUserCredits(userId);
    
    if (!credits) {
      throw new Error("User credits not found");
    }

    if (credits.creditsRemaining < amount) {
      throw new Error("Insufficient credits");
    }

    // Deduct credits
    const [updated] = await db
      .update(userCredits)
      .set({
        creditsRemaining: sql`${userCredits.creditsRemaining} - ${amount}`,
        creditsUsed: sql`${userCredits.creditsUsed} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId))
      .returning();

    // Log transaction
    await db.insert(creditTransactions).values({
      userId,
      transactionType: 'use',
      amount,
      description: description || `Used ${amount} AI credits`,
    });

    return updated;
  }

  async getCreditTransactions(userId: string, limit: number = 50): Promise<CreditTransaction[]> {
    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit);
    
    return transactions;
  }

  // ============================================
  // DRAFT COLLECTIONS METHODS
  // ============================================

  async createDraftCollection(data: InsertDraftCollection): Promise<DraftCollection> {
    const [collection] = await db.insert(draftCollections).values(data).returning();
    return collection;
  }

  async getUserCollections(userId: string): Promise<DraftCollection[]> {
    return await db
      .select()
      .from(draftCollections)
      .where(eq(draftCollections.userId, userId))
      .orderBy(desc(draftCollections.createdAt));
  }

  async getCollectionById(id: string): Promise<DraftCollection | null> {
    const [collection] = await db
      .select()
      .from(draftCollections)
      .where(eq(draftCollections.id, id))
      .limit(1);
    return collection || null;
  }

  async updateDraftCollection(id: string, data: Partial<InsertDraftCollection>): Promise<DraftCollection> {
    const [updated] = await db
      .update(draftCollections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(draftCollections.id, id))
      .returning();
    return updated;
  }

  async deleteDraftCollection(id: string): Promise<void> {
    await db.delete(draftCollections).where(eq(draftCollections.id, id));
  }

  async getCollectionsByName(userId: string, collectionName: string): Promise<DraftCollection[]> {
    return await db
      .select()
      .from(draftCollections)
      .where(
        and(
          eq(draftCollections.userId, userId),
          eq(draftCollections.collectionName, collectionName)
        )
      )
      .orderBy(desc(draftCollections.createdAt));
  }

  // ============================================
  // USER SEGMENTS METHODS
  // ============================================

  async upsertUserSegment(data: InsertUserSegment): Promise<UserSegment> {
    // Check if segment already exists for this user
    const [existing] = await db
      .select()
      .from(userSegments)
      .where(
        and(
          eq(userSegments.userId, data.userId),
          eq(userSegments.segment, data.segment)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing segment
      const [updated] = await db
        .update(userSegments)
        .set({
          confidence: data.confidence,
          detectionSignals: data.detectionSignals,
          lastDetectedAt: new Date(),
          detectionCount: sql`${userSegments.detectionCount}::int + 1`,
        })
        .where(eq(userSegments.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new segment
      const [created] = await db.insert(userSegments).values(data).returning();
      return created;
    }
  }

  async getUserSegments(userId: string): Promise<UserSegment[]> {
    return await db
      .select()
      .from(userSegments)
      .where(eq(userSegments.userId, userId))
      .orderBy(desc(userSegments.lastDetectedAt));
  }

  async getPrimaryUserSegment(userId: string): Promise<UserSegment | null> {
    const [segment] = await db
      .select()
      .from(userSegments)
      .where(eq(userSegments.userId, userId))
      .orderBy(desc(userSegments.lastDetectedAt))
      .limit(1);
    return segment || null;
  }

  // ============================================
  // MONETIZATION EVENTS METHODS
  // ============================================

  async logMonetizationEvent(data: InsertMonetizationEvent): Promise<MonetizationEvent> {
    const [event] = await db.insert(monetizationEvents).values(data).returning();
    return event;
  }

  async getMonetizationEvents(userId: string, limit: number = 50): Promise<MonetizationEvent[]> {
    return await db
      .select()
      .from(monetizationEvents)
      .where(eq(monetizationEvents.userId, userId))
      .orderBy(desc(monetizationEvents.createdAt))
      .limit(limit);
  }

  // ============================================
  // TRANSACTIONS METHODS
  // ============================================

  async createTransaction(data: any): Promise<any> {
    const [transaction] = await db
      .insert(transactions)
      .values(data)
      .returning();
    return transaction;
  }

  async getTransaction(transactionId: string): Promise<any> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId));
    return transaction;
  }

  async updateTransaction(transactionId: string, updates: any): Promise<any> {
    const [transaction] = await db
      .update(transactions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, transactionId))
      .returning();
    return transaction;
  }

  async getTransactionByOfferId(offerId: string): Promise<any> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.offerId, offerId));
    return transaction;
  }

  // ============================================
  // DRAFT FOLDERS METHODS
  // ============================================

  async getDraftFolders(userId: string): Promise<{ batchId: string; batchTitle: string; count: number }[]> {
    // Get all unique batch_id/batch_title combinations for draft listings
    const result = await db
      .select({
        batchId: listings.batchId,
        batchTitle: listings.batchTitle,
        count: sql<number>`count(*)::int`,
      })
      .from(listings)
      .where(
        and(
          eq(listings.userId, userId),
          eq(listings.status, "draft"),
          sql`${listings.batchId} IS NOT NULL`
        )
      )
      .groupBy(listings.batchId, listings.batchTitle)
      .orderBy(desc(sql`max(${listings.createdAt})`)); // Most recent first

    return result.map(row => ({
      batchId: row.batchId!,
      batchTitle: row.batchTitle!,
      count: row.count,
    }));
  }

  // ============================================
  // WELCOME SIGNUP METHODS
  // ============================================

  async createWelcomeSignup(signup: InsertWelcomeSignup): Promise<WelcomeSignup> {
    const [newSignup] = await db
      .insert(welcomeSignups)
      .values(signup)
      .returning();
    return newSignup;
  }

  async createGiveawayEntry(entry: InsertGiveawayEntry): Promise<GiveawayEntry> {
    const [newEntry] = await db
      .insert(giveawayEntries)
      .values(entry)
      .returning();
    return newEntry;
  }
}
export const storage = new DatabaseStorage();;
export { db };
