import {
  users,
  listings,
  messages,
  favorites,
  reviews,
  cancellationComments,
  userStatistics,
  reviewVotes,
  cancellationCommentVotes,
  transactionEvents,
  type User,
  type UpsertUser,
  type Listing,
  type InsertListing,
  type Message,
  type InsertMessage,
  type Favorite,
  type InsertFavorite,
  type Review,
  type InsertReview,
  type CancellationComment,
  type InsertCancellationComment,
  type UserStatistics,
  type ReviewVote,
  type InsertReviewVote,
  type CancellationCommentVote,
  type InsertCancellationCommentVote,
  type TransactionEvent,
  type InsertTransactionEvent,
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

  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getUserReviews(userId: string, role?: string, sort?: string, limit?: number): Promise<Review[]>;
  respondToReview(reviewId: string, userId: string, responseText: string): Promise<Review>;
  voteOnReview(reviewId: string, userId: string, voteType: string): Promise<{ helpful: number; notHelpful: number }>;
  flagReview(reviewId: string, reason: string): Promise<Review>;

  // Cancellation comment operations
  createCancellationComment(comment: InsertCancellationComment): Promise<CancellationComment>;
  respondToCancellationComment(commentId: string, userId: string, responseText: string): Promise<CancellationComment>;
  voteOnCancellationComment(commentId: string, userId: string, voteType: string): Promise<{ helpful: number; notHelpful: number }>;

  // Statistics operations
  getUserStatistics(userId: string): Promise<UserStatistics | undefined>;
  getUserTransactionTimeline(userId: string): Promise<TransactionEvent[]>;

  // Transaction history operations
  getUserTransactionHistory(userId: string, role?: string, status?: string, sort?: string): Promise<any[]>;
  getTransactionDetails(listingId: string): Promise<any>;
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

  async getUserReviews(userId: string, role?: string, sort?: string, limit: number = 20): Promise<Review[]> {
    const conditions = [eq(reviews.reviewedUserId, userId)];
    
    if (role) {
      conditions.push(eq(reviews.reviewerRole, role));
    }

    const orderByClause = 
      sort === 'rating-high' ? desc(reviews.overallRating) :
      sort === 'rating-low' ? reviews.overallRating :
      desc(reviews.createdAt);

    return await db
      .select()
      .from(reviews)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit);
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

    const [updatedReview] = await db
      .update(reviews)
      .set({
        sellerResponse: responseText,
        sellerResponseAt: new Date(),
      })
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

  async respondToCancellationComment(commentId: string, userId: string, responseText: string): Promise<CancellationComment> {
    const [comment] = await db
      .update(cancellationComments)
      .set({
        responseByUserId: userId,
        responseText,
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

  async getUserTransactionTimeline(userId: string): Promise<TransactionEvent[]> {
    return await db
      .select()
      .from(transactionEvents)
      .where(eq(transactionEvents.userId, userId))
      .orderBy(desc(transactionEvents.createdAt));
  }

  // Transaction history operations
  async getUserTransactionHistory(userId: string, role?: string, status?: string, sort?: string): Promise<any[]> {
    // For now, return listings as transactions
    // This would be replaced with actual transaction data
    const conditions = [eq(listings.userId, userId)];
    
    if (status) {
      conditions.push(eq(listings.status, status));
    }

    const orderByClause = sort === 'recent' ? desc(listings.createdAt) : desc(listings.createdAt);

    return await db
      .select()
      .from(listings)
      .where(and(...conditions))
      .orderBy(orderByClause);
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
    
    if (currentUserId && listing.listing.userId !== currentUserId) {
      // Check if there's a completed transaction with this user
      // Note: Transaction events must be created when a transaction completes, 
      // with eventType='completed' or 'confirmed' and userId set to the buyer
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
      const hasCancellation = events.some((e: any) => e.eventType === 'cancelled');
      
      if (hasInteraction && (hasCancellation || listing.listing.status === 'cancelled')) {
        eligibleForCancellationReport = true;
      }
    }

    return {
      ...listing,
      reviews: listingReviews,
      cancellationComments: comments,
      transactionEvents: events,
      eligibleForReview,
      eligibleForCancellationReport,
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
}

export const storage = new DatabaseStorage();
