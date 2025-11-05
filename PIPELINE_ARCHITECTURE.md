# Product Image Intelligence Pipeline Architecture

## Overview

A 3-step automated pipeline that transforms product images into rich, structured metadata using multiple AI/ML services and marketplace APIs.

## Architecture Diagram

```
┌─────────────────┐
│  Product Image  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  STEP 1: Image Analysis Layer           │
│  ┌─────────────────┐ ┌────────────────┐│
│  │ AWS Rekognition │ │ Google Vision  ││
│  └────────┬────────┘ └────────┬───────┘│
│           └──────────┬─────────┘        │
│                      ▼                  │
│         Unified Detection JSON          │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  STEP 2: Product Enrichment Layer       │
│  ┌──────────────┐ ┌──────────────────┐ │
│  │ Amazon API   │ │ Google Shopping  │ │
│  └──────┬───────┘ └────────┬─────────┘ │
│         └──────────┬────────┘           │
│                    ▼                    │
│         Enriched Product Data           │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  STEP 3: AI Synthesis Layer             │
│  ┌─────────────────────────────────┐   │
│  │  LLM (GPT-5 / Gemini)           │   │
│  │  - Generate title               │   │
│  │  - Generate description         │   │
│  │  - Generate SEO meta tags       │   │
│  └─────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Final Structured JSON Output           │
│  {                                      │
│    "title": "...",                      │
│    "description": "...",                │
│    "pricing": {...},                    │
│    "seo": {...},                        │
│    "metadata": {...}                    │
│  }                                      │
└─────────────────────────────────────────┘
```

## Step 1: Image Analysis Layer

### Purpose
Extract visual features, objects, text, and context from product images using dual vision APIs.

### APIs Used
1. **Amazon Rekognition**
   - Object detection
   - Label detection
   - Text detection (OCR)
   - Scene detection
   
2. **Google Cloud Vision**
   - Label detection
   - Object localization
   - Text detection (OCR)
   - Web entity detection
   - Product search

### Output Schema
```json
{
  "step1": {
    "timestamp": "ISO-8601",
    "duration_ms": 1234,
    "sources": {
      "rekognition": {
        "status": "success",
        "objects": [...],
        "labels": [...],
        "text": [...],
        "confidence": 0.95
      },
      "vision": {
        "status": "success",
        "labels": [...],
        "objects": [...],
        "text": [...],
        "web_entities": [...],
        "confidence": 0.92
      }
    },
    "unified": {
      "primary_object": "iPhone 15 Pro",
      "category": "Electronics > Mobile Phones",
      "detected_text": ["iPhone", "15 Pro", "256GB"],
      "visual_tags": ["smartphone", "apple", "blue titanium"],
      "confidence": 0.935
    }
  }
}
```

### Error Handling
- If one API fails, continue with the other
- Log failures but don't block pipeline
- Minimum: at least one API must succeed

## Step 2: Product Enrichment Layer

### Purpose
Find real-world pricing data, product identifiers, and marketplace information.

### APIs Used
1. **Amazon Product Advertising API**
   - Search by detected product name
   - Get retail price
   - Get product ASIN
   - Get product specifications
   
2. **Google Shopping API**
   - Search by product name
   - Get price range
   - Get merchant data
   - Get product availability

3. **Fallback Sources**
   - eBay Finding API (used prices)
   - Manual price estimation (if all fail)

### Output Schema
```json
{
  "step2": {
    "timestamp": "ISO-8601",
    "duration_ms": 2345,
    "sources": {
      "amazon": {
        "status": "success",
        "asin": "B0CHX3TZ7R",
        "title": "Apple iPhone 15 Pro (256 GB) - Blue Titanium",
        "retail_price": 999.00,
        "currency": "USD",
        "availability": "in_stock",
        "url": "https://..."
      },
      "google_shopping": {
        "status": "success",
        "price_range": {
          "min": 949.00,
          "max": 1099.00
        },
        "merchant_count": 15,
        "avg_price": 989.00
      },
      "ebay": {
        "status": "success",
        "used_price_range": {
          "min": 650.00,
          "max": 850.00
        },
        "avg_used_price": 750.00,
        "sold_count": 234
      }
    },
    "unified": {
      "retail_price": 999.00,
      "used_price_estimate": 750.00,
      "price_confidence": 0.88,
      "product_identifiers": {
        "asin": "B0CHX3TZ7R",
        "upc": "123456789012"
      }
    }
  }
}
```

### Error Handling
- Try APIs in sequence: Amazon → Google → eBay
- If all fail, use ML-based price estimation
- Log all failures with reasons
- Continue pipeline even if pricing unavailable

## Step 3: AI Synthesis Layer

### Purpose
Generate human-readable, SEO-optimized product metadata from combined data.

### LLM Used
- Primary: GPT-5 (OpenAI)
- Fallback: Gemini 2.0 Flash

### Input
All data from Step 1 and Step 2

### Output Schema
```json
{
  "step3": {
    "timestamp": "ISO-8601",
    "duration_ms": 3456,
    "llm": {
      "model": "gpt-5",
      "tokens_used": 1234,
      "status": "success"
    },
    "generated": {
      "title": "Apple iPhone 15 Pro 256GB - Blue Titanium (Unlocked)",
      "description": "Experience the power of the A17 Pro chip...",
      "short_description": "iPhone 15 Pro with 256GB storage...",
      "bullet_points": [
        "A17 Pro chip with 6-core GPU",
        "256GB storage capacity",
        "Blue Titanium finish",
        "Unlocked for all carriers"
      ],
      "seo": {
        "meta_title": "Apple iPhone 15 Pro 256GB Blue Titanium - Unlocked | Buy Now",
        "meta_description": "Shop the Apple iPhone 15 Pro with 256GB...",
        "keywords": ["iPhone 15 Pro", "Apple smartphone", "256GB phone"],
        "slug": "apple-iphone-15-pro-256gb-blue-titanium"
      },
      "category": "Electronics > Mobile Phones > Smartphones",
      "tags": ["Apple", "iPhone", "5G", "Titanium", "Pro"],
      "condition_assessment": "new",
      "confidence": 0.92
    }
  }
}
```

### Error Handling
- If GPT-5 fails, try Gemini
- If both fail, use template-based generation
- Log all failures
- Always return valid JSON structure

## Final Output Format

```json
{
  "pipeline_version": "1.0.0",
  "image_url": "https://...",
  "processed_at": "2025-11-05T10:30:00Z",
  "total_duration_ms": 7035,
  "status": "success",
  
  "step1": { ... },
  "step2": { ... },
  "step3": { ... },
  
  "final_product": {
    "title": "Apple iPhone 15 Pro 256GB - Blue Titanium (Unlocked)",
    "description": "Experience the power...",
    "short_description": "iPhone 15 Pro with 256GB...",
    "category": "Electronics > Mobile Phones > Smartphones",
    "tags": ["Apple", "iPhone", "5G"],
    "pricing": {
      "retail_price": 999.00,
      "used_price_estimate": 750.00,
      "currency": "USD"
    },
    "seo": {
      "meta_title": "...",
      "meta_description": "...",
      "keywords": [...],
      "slug": "..."
    },
    "identifiers": {
      "asin": "B0CHX3TZ7R",
      "upc": "123456789012"
    },
    "confidence": 0.92
  }
}
```

## Project Structure

```
server/
├── pipeline/
│   ├── index.ts              # Main pipeline orchestrator
│   ├── step1-image-analysis.ts
│   ├── step2-enrichment.ts
│   ├── step3-synthesis.ts
│   ├── types.ts              # TypeScript interfaces
│   └── utils/
│       ├── logger.ts
│       ├── error-handler.ts
│       └── api-clients/
│           ├── rekognition.ts
│           ├── vision.ts
│           ├── amazon-product.ts
│           ├── google-shopping.ts
│           └── ebay.ts
├── routes/
│   └── pipeline.ts           # API endpoint
└── tests/
    └── pipeline.test.ts
```

## API Endpoints

### POST /api/pipeline/analyze
Process a single image through the full pipeline.

**Request:**
```json
{
  "image_url": "https://...",
  "options": {
    "skip_pricing": false,
    "llm_model": "gpt-5"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": { ... final_product ... }
}
```

### POST /api/pipeline/analyze-batch
Process multiple images in parallel.

**Request:**
```json
{
  "image_urls": ["https://...", "https://..."],
  "options": { ... }
}
```

**Response:**
```json
{
  "status": "success",
  "results": [
    { "image_url": "...", "data": {...} },
    { "image_url": "...", "data": {...} }
  ]
}
```

## Environment Variables

```bash
# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Amazon Product API
AMAZON_ASSOCIATE_TAG=
AMAZON_ACCESS_KEY=
AMAZON_SECRET_KEY=

# Google Shopping API
GOOGLE_SHOPPING_API_KEY=

# eBay
EBAY_APP_ID=

# LLM
OPENAI_API_KEY=
GEMINI_API_KEY=
```

## Logging Strategy

Each step logs:
- Start time
- API calls made
- Response status
- Duration
- Errors (if any)
- Confidence scores

Example log:
```
[2025-11-05 10:30:00] [PIPELINE] Starting analysis for image: https://...
[2025-11-05 10:30:01] [STEP1] Calling AWS Rekognition...
[2025-11-05 10:30:02] [STEP1] Rekognition success (1234ms, confidence: 0.95)
[2025-11-05 10:30:02] [STEP1] Calling Google Vision...
[2025-11-05 10:30:03] [STEP1] Vision success (987ms, confidence: 0.92)
[2025-11-05 10:30:03] [STEP1] Complete (2221ms)
[2025-11-05 10:30:03] [STEP2] Calling Amazon Product API...
...
```

## Error Handling Strategy

1. **Graceful Degradation**: Each step can fail without blocking the pipeline
2. **Fallback Chain**: Primary API → Secondary API → Estimation
3. **Detailed Logging**: All errors logged with context
4. **Partial Success**: Return best available data even if some steps fail
5. **Retry Logic**: Transient failures retried with exponential backoff

## Performance Targets

- Step 1: < 3 seconds (parallel API calls)
- Step 2: < 5 seconds (sequential with caching)
- Step 3: < 5 seconds (LLM generation)
- **Total: < 15 seconds per image**

## Next Steps

1. Set up AWS and Google Cloud credentials
2. Implement Step 1 (Image Analysis Layer)
3. Implement Step 2 (Product Enrichment Layer)
4. Implement Step 3 (AI Synthesis Layer)
5. Test with 10 sample images
6. Integrate into SellFast.Now application
7. Deploy to production
