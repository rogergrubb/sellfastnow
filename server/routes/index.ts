/**
 * Central export file for all route modules
 * This provides a clean way to import routes in the main routes.ts file
 */

// Core routes
export { default as aiRoutes } from './ai';
export { default as analyticsRoutes } from './analytics';
export { default as boostsRoutes } from './boosts';
export { default as bulkEditRoutes } from './bulkEdit';
export { default as collectionsRoutes } from './collections';
export { default as conversationsRoutes } from './conversations';
export { default as draftFoldersRoutes } from './draft-folders';
export { default as emailVerificationRoutes } from './email-verification';
export { default as favoritesRoutes } from './favorites';
export { default as imagesRoutes } from './images';
export { default as listingsRoutes } from './listings';
export { default as locationRoutes } from './location';
export { default as meetupRoutes } from './meetup';
export { default as meetupsRoutes } from './meetups';
export { default as messageReadRoutes } from './message-read';
export { default as messageSearchRoutes } from './message-search';
export { default as messagesRoutes } from './messages';
export { default as notificationsRoutes } from './notifications';
export { default as offersRoutes } from './offers';
export { default as paymentsRoutes } from './payments';
export { default as photoUnlockRoutes } from './photo-unlock';
export { default as payoutsRoutes } from './payouts';
export { default as promotedListingsRoutes } from './promoted-listings';
export { default as referralsRoutes } from './referrals';
export { default as reviewsRoutes } from './reviews';
export { default as savedSearchesRoutes } from './saved-searches';
export { default as searchRoutes } from './search';
export { default as stripeRoutes } from './stripe';
export { default as subscriptionsRoutes } from './subscriptions';
export { default as trackingRoutes } from './tracking';
export { default as transactionsRoutes } from './transactions';
export { default as trustRoutes } from './trust';
export { default as upcycleRoutes } from './upcycle';
export { default as userRoutes } from './user';
export { default as usersRoutes } from './users';
export { default as welcomeSignupsRoutes } from './welcome-signups';

// Utility/admin routes (exported separately for clarity)
export { default as applyLocationSchemaRoutes } from './applyLocationSchema';
export { default as deleteUserListingsRoutes } from './deleteUserListings';
export { default as emergencyMigrationRoutes } from './emergencyMigration';
export { default as markMigrationsCompleteRoutes } from './markMigrationsComplete';
export { default as resetDatabaseRoutes } from './resetDatabase';
export { default as testAuthRoutes } from './testAuth';
export { default as testTransactionsRoutes } from './testTransactions';

