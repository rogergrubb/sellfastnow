# AI Price Recommendation System - Implementation Plan

**Date:** October 26, 2025  
**Feature:** Smart Price Recommendations for Sellers  
**Goal:** Help sellers price items optimally using AI and historical data

---

## 🎯 Overview

The AI Price Recommendation system analyzes listing details and historical marketplace data to suggest optimal pricing. This helps sellers:
- Price competitively without undervaluing items
- Sell faster with data-backed pricing
- Build trust in the platform's intelligence
- Reduce decision paralysis

---

## 🏗️ System Architecture

### **Data Flow**

```
User enters listing details
    ↓
Extract: Title, Description, Category, Condition, Images
    ↓
AI Analysis (OpenAI GPT-4)
    ↓
Extract: Brand, Model, Key Features, Age/Condition
    ↓
Database Query: Find similar sold items
    ↓
Statistical Analysis: Calculate price distribution
    ↓
Generate Recommendation
    ↓
Display: Suggested Price + Confidence + Insights
```

---

## 📊 How It Works

### **Step 1: Data Collection**

When user creates a listing, we collect:
- **Title:** "iPhone 13 Pro 256GB Blue Unlocked"
- **Description:** "Excellent condition, no scratches, includes original box and charger"
- **Category:** Electronics > Phones
- **Condition:** Excellent
- **Images:** Product photos (optional for AI analysis)

### **Step 2: AI Extraction**

Use OpenAI GPT-4 to extract structured data:

```json
{
  "brand": "Apple",
  "model": "iPhone 13 Pro",
  "storage": "256GB",
  "color": "Blue",
  "carrier": "Unlocked",
  "condition": "Excellent",
  "accessories": ["Original Box", "Charger"],
  "keyFeatures": ["No scratches", "Fully functional"],
  "estimatedAge": "1-2 years"
}
```

### **Step 3: Database Query**

Query your database for similar sold items:

```sql
SELECT amount, createdAt, completedAt
FROM transactions
WHERE status = 'completed'
  AND listingId IN (
    SELECT id FROM listings
    WHERE category = 'Electronics > Phones'
      AND title ILIKE '%iPhone 13 Pro%'
      AND title ILIKE '%256GB%'
      AND condition IN ('Excellent', 'Good')
  )
  AND createdAt > NOW() - INTERVAL '90 days'
ORDER BY completedAt DESC
LIMIT 50
```

### **Step 4: Statistical Analysis**

Calculate price statistics:
- **Median price:** $750
- **Average price:** $765
- **Price range:** $650 - $850
- **Standard deviation:** $45
- **Confidence score:** High (50+ comparable sales)

### **Step 5: AI-Powered Insights**

Use OpenAI to generate insights:

```
Prompt:
"Based on 50 recent sales of iPhone 13 Pro 256GB in Excellent condition:
- Median: $750
- Range: $650-$850
- This listing includes: Original box, charger, no scratches

Generate pricing recommendation and insights."

Response:
"Recommended Price: $775
Confidence: High (50 comparable sales)

Insights:
- Items with original accessories sell 8% higher ($725 vs $775)
- Excellent condition phones sell 15% faster than Good condition
- Unlocked phones command 12% premium over carrier-locked
- Current market trend: Stable (prices unchanged in 30 days)

Pricing Strategy:
- List at $775 for quick sale (within 7 days)
- List at $825 if willing to wait 14+ days
- Don't go below $700 (undervalued for this condition)"
```

---

## 🎨 User Interface

### **Location 1: Post Ad Page - During Listing Creation**

When user enters title and description, show real-time price suggestion:

```
┌─────────────────────────────────────────────────────┐
│ 💡 AI Price Recommendation                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Based on 50 similar items sold recently:          │
│                                                     │
│  Suggested Price: $775                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  $650        $750        $850                       │
│  Low         Median      High                       │
│                ▲                                    │
│           Your listing                              │
│                                                     │
│  ✅ High Confidence (50 comparable sales)           │
│                                                     │
│  

📊 Market Insights:                              │
│  • Items with accessories sell 8% higher         │
│  • Excellent condition sells 15% faster          │
│  • Average time to sell: 5 days                  │
│                                                     │
│  [Use This Price]  [Customize]  [Learn More]      │
└─────────────────────────────────────────────────────┘
```

### **Location 2: Listing Detail Page - For Existing Listings**

Show price analysis to help sellers adjust pricing:

```
┌─────────────────────────────────────────────────────┐
│ 📊 Price Analysis                                   │
├─────────────────────────────────────────────────────┤
│  Your Price: $850                                   │
│  Market Median: $750                                │
│  Status: 13% above market                           │
│                                                     │
│  💡 To sell faster, consider lowering to $775       

│
│  Similar items at this price take 18 days to sell   │
│  Similar items at $775 sell in 7 days               │
│                                                     │
│  [Update Price]  [Keep Current Price]              │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Technical Implementation

### **Phase 1: Backend API (2-3 hours)**

#### **1.1 Create Price Recommendation Endpoint**

**File:** `server/routes/price-recommendations.ts`

```typescript
import express from "express";
import OpenAI from "openai";
import { db } from "../db";
import { listings, transactions } from "../../shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

const router = express.Router();
const openai = new OpenAI();

// POST /api/price-recommendations
router.post("/", async (req, res) => {
  try {
    const { title, description, category, condition, images } = req.body;

    // Step 1: Extract structured data using AI
    const extraction = await extractProductDetails(title, description);

    // Step 2: Query similar sold items
    const similarItems = await findSimilarSoldItems(
      category,
      extraction.keywords,
      condition
    );

    // Step 3: Calculate statistics
    const stats = calculatePriceStatistics(similarItems);

    // Step 4: Generate AI insights
    const insights = await generatePricingInsights(
      extraction,
      stats,
      condition
    );

    res.json({
      recommendedPrice: insights.recommendedPrice,
      confidence: stats.confidence,
      priceRange: {
        low: stats.percentile25,
        median: stats.median,
        high: stats.percentile75,
      },
      comparableCount: similarItems.length,
      insights: insights.insights,
      marketTrend: stats.trend,
    });
  } catch (error) {
    console.error("Error generating price recommendation:", error);
    res.status(500).json({ error: "Failed to generate recommendation" });
  }
});

// Extract product details using OpenAI
async function extractProductDetails(title: string, description: string) {
  const prompt = `Extract structured product information from this listing:

Title: ${title}
Description: ${description}

Extract and return JSON with:
- brand (string)
- model (string)
- keyFeatures (array of strings)
- condition (string)
- estimatedAge (string)
- searchKeywords (array of 5-10 relevant keywords for finding similar items)

Return only valid JSON, no explanation.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

// Find similar sold items in database
async function findSimilarSoldItems(
  category: string,
  keywords: string[],
  condition: string
) {
  // Build search query for similar items
  const keywordConditions = keywords.map((kw) =>
    sql`${listings.title} ILIKE ${"%" + kw + "%"}`
  );

  const similarListings = await db
    .select({
      listingId: listings.id,
      title: listings.title,
      condition: listings.condition,
      createdAt: listings.createdAt,
    })
    .from(listings)
    .where(
      and(
        eq(listings.category, category),
        sql`(${sql.join(keywordConditions, sql` OR `)})`,
        sql`${listings.condition} IN ('Excellent', 'Good', 'Fair')`
      )
    )
    .limit(100);

  // Get completed transactions for these listings
  const listingIds = similarListings.map((l) => l.listingId);

  if (listingIds.length === 0) {
    return [];
  }

  const soldItems = await db
    .select({
      amount: transactions.amount,
      completedAt: transactions.completedAt,
      createdAt: transactions.createdAt,
      listingTitle: listings.title,
      condition: listings.condition,
    })
    .from(transactions)
    .innerJoin(listings, eq(transactions.listingId, listings.id))
    .where(
      and(
        eq(transactions.status, "completed"),
        sql`${transactions.listingId} IN (${sql.join(listingIds, sql`, `)})`,
        sql`${transactions.completedAt} > NOW() - INTERVAL '90 days'`
      )
    )
    .orderBy(desc(transactions.completedAt))
    .limit(50);

  return soldItems;
}

// Calculate price statistics
function calculatePriceStatistics(items: any[]) {
  if (items.length === 0) {
    return {
      median: null,
      average: null,
      percentile25: null,
      percentile75: null,
      min: null,
      max: null,
      stdDev: null,
      confidence: "none",
      trend: "unknown",
    };
  }

  const prices = items.map((item) => parseFloat(item.amount)).sort((a, b) => a - b);
  const count = prices.length;

  const median = prices[Math.floor(count / 2)];
  const average = prices.reduce((a, b) => a + b, 0) / count;
  const percentile25 = prices[Math.floor(count * 0.25)];
  const percentile75 = prices[Math.floor(count * 0.75)];
  const min = prices[0];
  const max = prices[count - 1];

  // Calculate standard deviation
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - average, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  // Determine confidence based on sample size
  let confidence: string;
  if (count >= 30) confidence = "high";
  else if (count >= 10) confidence = "medium";
  else if (count >= 3) confidence = "low";
  else confidence = "very low";

  // Calculate trend (compare recent vs older sales)
  const recentItems = items.slice(0, Math.floor(count / 3));
  const olderItems = items.slice(-Math.floor(count / 3));

  const recentAvg = recentItems.reduce((sum, item) => sum + parseFloat(item.amount), 0) / recentItems.length;
  const olderAvg = olderItems.reduce((sum, item) => sum + parseFloat(item.amount), 0) / olderItems.length;

  const priceDiff = ((recentAvg - olderAvg) / olderAvg) * 100;

  let trend: string;
  if (priceDiff > 5) trend = "increasing";
  else if (priceDiff < -5) trend = "decreasing";
  else trend = "stable";

  return {
    median,
    average,
    percentile25,
    percentile75,
    min,
    max,
    stdDev,
    confidence,
    trend,
    count,
  };
}

// Generate AI-powered pricing insights
async function generatePricingInsights(
  extraction: any,
  stats: any,
  condition: string
) {
  if (!stats.median) {
    return {
      recommendedPrice: null,
      insights: ["Not enough data to generate recommendation. Try a different category or broader description."],
    };
  }

  const prompt = `You are a marketplace pricing expert. Based on this data, provide pricing recommendations:

Product: ${extraction.brand} ${extraction.model}
Condition: ${condition}
Key Features: ${extraction.keyFeatures?.join(", ")}

Market Data (last 90 days):
- Median Price: $${stats.median}
- Price Range: $${stats.percentile25} - $${stats.percentile75}
- Sample Size: ${stats.count} sales
- Market Trend: ${stats.trend}

Generate:
1. Recommended listing price (single number)
2. 3-4 actionable insights about pricing strategy
3. Expected time to sell at recommended price

Format as JSON:
{
  "recommendedPrice": number,
  "insights": [string array],
  "expectedDaysToSell": number
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

export default router;
```

#### **1.2 Register Route**

**File:** `server/routes.ts`

```typescript
import priceRecommendationRoutes from "./routes/price-recommendations";

// Add to routes registration
app.use("/api/price-recommendations", priceRecommendationRoutes);
```

---

### **Phase 2: Frontend Component (2-3 hours)**

#### **2.1 Create Price Recommendation Component**

**File:** `client/src/components/PriceRecommendation.tsx`

```typescript
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Minus, Lightbulb, CheckCircle } from "lucide-react";

interface PriceRecommendationProps {
  title: string;
  description: string;
  category: string;
  condition: string;
  onPriceSelect?: (price: number) => void;
}

export function PriceRecommendation({
  title,
  description,
  category,
  condition,
  onPriceSelect,
}: PriceRecommendationProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Fetch price recommendation
  const { data, isLoading, error } = useQuery({
    queryKey: ["price-recommendation", title, description, category, condition],
    queryFn: async () => {
      const response = await fetch("/api/price-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, condition }),
      });
      if (!response.ok) throw new Error("Failed to fetch recommendation");
      return response.json();
    },
    enabled: title.length > 5 && description.length > 10,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (!title || !description) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Analyzing market data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.recommendedPrice) {
    return null;
  }

  const confidenceColor = {
    high: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-orange-100 text-orange-800",
    "very low": "bg-red-100 text-red-800",
  }[data.confidence] || "bg-gray-100 text-gray-800";

  const trendIcon = {
    increasing: <TrendingUp className="h-4 w-4 text-green-600" />,
    decreasing: <TrendingDown className="h-4 w-4 text-red-600" />,
    stable: <Minus className="h-4 w-4 text-gray-600" />,
  }[data.marketTrend];

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          AI Price Recommendation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recommended Price */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Suggested Price</p>
          <p className="text-4xl font-bold text-blue-600">
            ${data.recommendedPrice}
          </p>
          <Badge className={`mt-2 ${confidenceColor}`}>
            {data.confidence} confidence ({data.comparableCount} sales)
          </Badge>
        </div>

        {/* Price Range Visualization */}
        <div className="relative pt-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Low</span>
            <span>Median</span>
            <span>High</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full relative">
            <div
              className="absolute h-2 bg-blue-400 rounded-full"
              style={{
                left: "0%",
                width: "50%",
              }}
            />
            <div
              className="absolute h-4 w-4 bg-blue-600 rounded-full -top-1 transform -translate-x-1/2"
              style={{
                left: `${
                  ((data.recommendedPrice - data.priceRange.low) /
                    (data.priceRange.high - data.priceRange.low)) *
                  100
                }%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs font-medium mt-1">
            <span>${data.priceRange.low}</span>
            <span>${data.priceRange.median}</span>
            <span>${data.priceRange.high}</span>
          </div>
        </div>

        {/* Market Trend */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <span className="text-sm text-gray-600">Market Trend</span>
          <div className="flex items-center gap-2">
            {trendIcon}
            <span className="text-sm font-medium capitalize">{data.marketTrend}</span>
          </div>
        </div>

        {/* Insights */}
        {showDetails && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <p className="text-sm font-medium text-gray-700">💡 Pricing Insights:</p>
            {data.insights.map((insight: string, index: number) => (
              <div key={index} className="flex gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
            {data.expectedDaysToSell && (
              <p className="text-sm text-gray-600 mt-3">
                ⏱️ Expected to sell in <strong>{data.expectedDaysToSell} days</strong> at this price
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onPriceSelect?.(data.recommendedPrice)}
            className="flex-1"
          >
            Use This Price
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide" : "Learn More"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### **2.2 Integrate into Post Ad Page**

**File:** `client/src/pages/PostAdEnhanced.tsx`

```typescript
import { PriceRecommendation } from "@/components/PriceRecommendation";

// Inside the form, after description field:
{formData.title && formData.description && (
  <PriceRecommendation
    title={formData.title}
    description={formData.description}
    category={formData.category}
    condition={formData.condition}
    onPriceSelect={(price) => {
      setFormData({ ...formData, price: price.toString() });
    }}
  />
)}
```

---

### **Phase 3: Database Optimization (1 hour)**

#### **3.1 Add Indexes for Fast Queries**

```sql
-- Index for category + title search
CREATE INDEX idx_listings_category_title 
ON listings(category, title);

-- Index for completed transactions
CREATE INDEX idx_transactions_status_completed 
ON transactions(status, completed_at) 
WHERE status = 'completed';

-- Full-text search index for title
CREATE INDEX idx_listings_title_fulltext 
ON listings USING GIN(to_tsvector('english', title));
```

#### **3.2 Cache Layer (Optional)**

Use Redis to cache price recommendations:

```typescript
import { Redis } from "ioredis";
const redis = new Redis(process.env.REDIS_URL);

// Cache key based on listing attributes
const cacheKey = `price:${category}:${keywords.join(":")}:${condition}`;

// Check cache first
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

// Calculate and cache for 1 hour
const result = await calculatePriceRecommendation(...);
await redis.setex(cacheKey, 3600, JSON.stringify(result));
```

---

## 📈 Rollout Strategy

### **Week 1: Soft Launch (Beta)**
- Enable for 10% of users
- Show "Beta" badge on feature
- Collect feedback
- Monitor AI costs
- Fix bugs

### **Week 2: Expand to 50%**
- Add A/B testing
- Track metrics:
  - % of users who use suggested price
  - Listing success rate with vs without AI pricing
  - Time to sell comparison
- Optimize prompts based on feedback

### **Week 3: Full Launch**
- Enable for 100% of users
- Add to marketing materials
- Blog post: "How AI Helps You Price Items Perfectly"
- Email existing sellers about new feature

### **Week 4: Premium Features**
- Add "Price History Chart" (premium)
- Add "Competitive Analysis" (premium)
- Add "Optimal Listing Time" suggestion (premium)

---

## 💰 Cost Analysis

### **OpenAI API Costs**

**Per recommendation:**
- Extraction call: ~500 tokens × $0.15/1M = $0.000075
- Insights call: ~800 tokens × $0.15/1M = $0.00012
- **Total per recommendation: ~$0.0002 (0.02 cents)**

**Monthly costs (estimate):**
- 1,000 listings/month: $0.20
- 10,000 listings/month: $2.00
- 100,000 listings/month: $20.00

**Extremely affordable!**

---

## 📊 Success Metrics

### **Track These KPIs:**

1. **Adoption Rate**
   - % of listings using AI pricing
   - Target: 60%+ within 3 months

2. **Accuracy**
   - % of AI-priced items that sell within 14 days
   - Target: 75%+

3. **User Satisfaction**
   - Survey: "How helpful was the price recommendation?"
   - Target: 4.5/5 stars

4. **Business Impact**
   - Increase in listing completion rate
   - Decrease in time to first sale
   - Increase in successful transactions

---

## 🚀 Future Enhancements

### **Phase 2 Features:**

1. **Image Analysis**
   - Analyze product photos to assess condition
   - Detect brand/model from images
   - Adjust price based on visual quality

2. **Seasonal Pricing**
   - Adjust recommendations based on time of year
   - "Winter coats sell 40% higher in October"

3. **Dynamic Repricing**
   - Auto-suggest price drops after X days
   - "Lower by $20 to match recent sales"

4. **Competitive Intelligence**
   - Show active competing listings
   - "3 similar items listed at lower prices"

5. **Price Negotiation AI**
   - Suggest counter-offers to buyers
   - "Based on condition, offer $X instead"

---

## ✅ Implementation Checklist

### **Backend (3-4 hours)**
- [ ] Create `price-recommendations.ts` route
- [ ] Implement `extractProductDetails()` function
- [ ] Implement `findSimilarSoldItems()` query
- [ ] Implement `calculatePriceStatistics()` function
- [ ] Implement `generatePricingInsights()` function
- [ ] Add database indexes
- [ ] Register route in `routes.ts`
- [ ] Test API endpoint

### **Frontend (2-3 hours)**
- [ ] Create `PriceRecommendation.tsx` component
- [ ] Add loading states
- [ ] Add error handling
- [ ] Integrate into `PostAdEnhanced.tsx`
- [ ] Add "Use This Price" button functionality
- [ ] Style with Tailwind
- [ ] Test user flow

### **Testing (1-2 hours)**
- [ ] Test with various product types
- [ ] Test with insufficient data
- [ ] Test with edge cases
- [ ] Verify AI extraction accuracy
- [ ] Verify price calculations
- [ ] Test mobile responsiveness

### **Deployment (30 minutes)**
- [ ] Add OpenAI API key to environment
- [ ] Run database migrations (indexes)
- [ ] Deploy to Railway
- [ ] Monitor logs for errors
- [ ] Test in production

---

## 🎯 Total Implementation Time

**Estimated: 8-10 hours**

- Backend API: 3-4 hours
- Frontend Component: 2-3 hours
- Database Optimization: 1 hour
- Testing: 1-2 hours
- Deployment: 30 minutes

**Can be completed in 1-2 days!**

---

## 💡 Why This Will Work

1. **Solves Real Pain Point**
   - Sellers struggle with pricing
   - Fear of overpricing (no sales) or underpricing (losing money)

2. **Builds Trust**
   - Shows platform intelligence
   - Data-backed recommendations

3. **Increases Success Rate**
   - Better pricing = faster sales
   - Faster sales = more listings

4. **Competitive Advantage**
   - Craigslist doesn't have this
   - Facebook Marketplace doesn't have this
   - You'll be first!

5. **Low Cost, High Value**
   - $0.0002 per recommendation
   - Massive perceived value to users

---

**Ready to implement? Let's build it!** 🚀

