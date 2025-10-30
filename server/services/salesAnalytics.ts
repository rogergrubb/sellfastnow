import { db } from "../db";
import { transactions, listings } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";

/**
 * Service for sales analytics and revenue tracking
 */

interface SalesDataPoint {
  date: string;
  sales: number;
  revenue: number;
  itemsSold: number;
}

interface SalesAnalytics {
  totalRevenue: number;
  totalSales: number;
  averageSalePrice: number;
  salesByPeriod: SalesDataPoint[];
  topCategories: Array<{ category: string; sales: number; revenue: number }>;
  recentSales: Array<{
    id: string;
    listingTitle: string;
    amount: number;
    date: string;
  }>;
}

/**
 * Get sales analytics for a seller
 */
export async function getSellerSalesAnalytics(
  userId: string,
  period: "7d" | "30d" | "90d" | "1y" | "all" = "30d"
): Promise<SalesAnalytics> {
  try {
    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get all completed transactions for the seller
    const sellerTransactions = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        createdAt: transactions.createdAt,
        listingId: transactions.listingId,
        status: transactions.status,
      })
      .from(transactions)
      .innerJoin(listings, eq(transactions.listingId, listings.id))
      .where(
        and(
          eq(listings.userId, userId),
          eq(transactions.status, "completed"),
          period !== "all" ? gte(transactions.createdAt, startDate) : sql`true`
        )
      );

    // Calculate totals
    const totalRevenue = sellerTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0
    );
    const totalSales = sellerTransactions.length;
    const averageSalePrice = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Group sales by date for charting
    const salesByDate = new Map<string, { sales: number; revenue: number; count: number }>();

    sellerTransactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt).toISOString().split("T")[0];
      const existing = salesByDate.get(date) || { sales: 0, revenue: 0, count: 0 };
      salesByDate.set(date, {
        sales: existing.sales + 1,
        revenue: existing.revenue + parseFloat(transaction.amount),
        count: existing.count + 1,
      });
    });

    // Convert to array and sort by date
    const salesByPeriod: SalesDataPoint[] = Array.from(salesByDate.entries())
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        revenue: Math.round(data.revenue * 100) / 100,
        itemsSold: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get listing details for transactions
    const listingIds = [...new Set(sellerTransactions.map(t => t.listingId))];
    const listingDetails = await db.query.listings.findMany({
      where: sql`${listings.id} IN (${sql.join(listingIds.map(id => sql`${id}`), sql`, `)})`,
      columns: {
        id: true,
        title: true,
        category: true,
      },
    });

    const listingMap = new Map(listingDetails.map(l => [l.id, l]));

    // Calculate sales by category
    const categoryMap = new Map<string, { sales: number; revenue: number }>();
    sellerTransactions.forEach((transaction) => {
      const listing = listingMap.get(transaction.listingId);
      if (listing) {
        const existing = categoryMap.get(listing.category) || { sales: 0, revenue: 0 };
        categoryMap.set(listing.category, {
          sales: existing.sales + 1,
          revenue: existing.revenue + parseFloat(transaction.amount),
        });
      }
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        sales: data.sales,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get recent sales
    const recentSales = sellerTransactions
      .slice(0, 10)
      .map((transaction) => {
        const listing = listingMap.get(transaction.listingId);
        return {
          id: transaction.id,
          listingTitle: listing?.title || "Unknown Item",
          amount: Math.round(parseFloat(transaction.amount) * 100) / 100,
          date: new Date(transaction.createdAt).toISOString(),
        };
      });

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSales,
      averageSalePrice: Math.round(averageSalePrice * 100) / 100,
      salesByPeriod,
      topCategories,
      recentSales,
    };
  } catch (error) {
    console.error(`Error getting sales analytics for user ${userId}:`, error);
    return {
      totalRevenue: 0,
      totalSales: 0,
      averageSalePrice: 0,
      salesByPeriod: [],
      topCategories: [],
      recentSales: [],
    };
  }
}

/**
 * Calculate platform fee comparison
 */
interface PlatformComparison {
  platform: string;
  listingFee: number;
  transactionFee: number;
  totalFees: number;
  netRevenue: number;
}

export function calculatePlatformFeeSavings(
  salePrice: number,
  totalSales: number
): {
  sellFastNow: PlatformComparison;
  ebay: PlatformComparison;
  etsy: PlatformComparison;
  estateSales: PlatformComparison;
  totalSavings: {
    vsEbay: number;
    vsEtsy: number;
    vsEstateSales: number;
  };
} {
  const totalRevenue = salePrice * totalSales;

  // SellFast.Now: 5% transaction fee, no listing fee
  const sellFastNow: PlatformComparison = {
    platform: "SellFast.Now",
    listingFee: 0,
    transactionFee: totalRevenue * 0.05,
    totalFees: totalRevenue * 0.05,
    netRevenue: totalRevenue * 0.95,
  };

  // eBay: 13.25% final value fee (average), $0.35 per listing
  const ebay: PlatformComparison = {
    platform: "eBay",
    listingFee: 0.35 * totalSales,
    transactionFee: totalRevenue * 0.1325,
    totalFees: 0.35 * totalSales + totalRevenue * 0.1325,
    netRevenue: totalRevenue - (0.35 * totalSales + totalRevenue * 0.1325),
  };

  // Etsy: $0.20 listing fee + 6.5% transaction fee + 3% payment processing
  const etsy: PlatformComparison = {
    platform: "Etsy",
    listingFee: 0.20 * totalSales,
    transactionFee: totalRevenue * 0.095, // 6.5% + 3%
    totalFees: 0.20 * totalSales + totalRevenue * 0.095,
    netRevenue: totalRevenue - (0.20 * totalSales + totalRevenue * 0.095),
  };

  // EstateSales.org: 15% commission
  const estateSales: PlatformComparison = {
    platform: "EstateSales.org",
    listingFee: 0,
    transactionFee: totalRevenue * 0.15,
    totalFees: totalRevenue * 0.15,
    netRevenue: totalRevenue * 0.85,
  };

  return {
    sellFastNow,
    ebay,
    etsy,
    estateSales,
    totalSavings: {
      vsEbay: Math.round((ebay.totalFees - sellFastNow.totalFees) * 100) / 100,
      vsEtsy: Math.round((etsy.totalFees - sellFastNow.totalFees) * 100) / 100,
      vsEstateSales: Math.round((estateSales.totalFees - sellFastNow.totalFees) * 100) / 100,
    },
  };
}

