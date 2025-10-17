import ListingDetail from '../ListingDetail'

export default function ListingDetailExample() {
  return (
    <div className="min-h-screen bg-background">
      <ListingDetail
        id="1"
        images={[
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=600&fit=crop"
        ]}
        title="Premium Wireless Bluetooth Headphones"
        price={149}
        description="High-quality wireless headphones with active noise cancellation. Perfect condition, barely used. Includes original packaging, charging cable, and carrying case.

Features:
- 30-hour battery life
- Active noise cancellation
- Premium sound quality
- Comfortable over-ear design
- Bluetooth 5.0"
        condition="Like New"
        category="Electronics"
        location="San Francisco, CA"
        timePosted="2 hours ago"
        sellerName="John Smith"
      />
    </div>
  )
}
