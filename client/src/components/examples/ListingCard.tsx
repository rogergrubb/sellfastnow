import ListingCard from '../ListingCard'

export default function ListingCardExample() {
  return (
    <div className="p-4 max-w-sm">
      <ListingCard
        id="1"
        image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"
        title="Wireless Bluetooth Headphones - Premium Sound Quality"
        price={149}
        location="San Francisco, CA"
        timePosted="2h ago"
        isFavorite={false}
      />
    </div>
  )
}
