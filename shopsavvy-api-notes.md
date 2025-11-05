# ShopSavvy API Integration Notes

**Source**: https://shopsavvy.com/data/documentation

## API Overview

**Base URL**: `https://api.shopsavvy.com/v1`

**Authentication**: Bearer token in Authorization header
```
Authorization: Bearer ss_live_abc123...
```

## Product Lookup Methods

ShopSavvy supports multiple ways to look up products:

1. **UPC** (Universal Product Code)
2. **EAN** (European Article Number)
3. **ISBN** (International Standard Book Number)
4. **GTIN** (Global Trade Item Number)
5. **Amazon ASIN**
6. **Model Number**
7. **Product Name** (full-text search)
8. **URL** (from any retailer)
9. **ShopSavvy Product ID**

## API Endpoints

### Get Product Details
```bash
GET /v1/products?ids=611247373864,611247369449
```

### Search by Product Name
```bash
GET /v1/products?ids=iPhone%2015%20Pro
```

**Note**: When using product name, API uses full-text search to find best matching product based on relevance and availability.

## Response Format

JSON object with:
- `success` status
- `data` array
- `metadata` (including credits used)

### Product Fields

Each product includes:
- `title`: Product name
- `description`: Product description
- `brand`: Brand name
- `category`: Product category
- `upc`, `ean`, `asin`: Product identifiers
- `image_url`: Product image
- `pricing`: Current pricing from multiple retailers
- `price_history`: Historical pricing data
- `availability`: Stock status
- `specifications`: Technical specs

## Pricing API

### Get All Retailers
```bash
GET /v1/pricing?product_id=123
```

### Get Single Retailer
```bash
GET /v1/pricing?product_id=123&retailer=amazon
```

### Price History
```bash
GET /v1/pricing/history?product_id=123
```

## Key Features

1. **Multi-identifier support**: Can search by barcode, ASIN, model number, or name
2. **Retail pricing**: Real-time prices from multiple retailers
3. **Price history**: Historical pricing data for trend analysis
4. **Product details**: Comprehensive product information including descriptions
5. **Availability tracking**: Stock status across retailers

## Integration Strategy

For our pipeline:
1. Use product name from vision analysis to search ShopSavvy
2. Get retail pricing, description, and specifications
3. Use as primary pricing source (more reliable than estimation)
4. Cache results by product identifiers (UPC, ASIN) to reduce API calls
5. Fall back to other pricing APIs if ShopSavvy doesn't have the product

## Pricing & Credits

- Requires paid subscription
- Uses credit-based system
- Need to monitor usage to stay within limits
- Set up alerts when approaching limits
