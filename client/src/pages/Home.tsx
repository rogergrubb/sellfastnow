import { useState } from "react";
import Hero from "@/components/Hero";
import CategoryFilters from "@/components/CategoryFilters";
import FilterSidebar from "@/components/FilterSidebar";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

//todo: remove mock functionality
const mockListings = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
    title: "Premium Wireless Headphones",
    price: 149,
    location: "San Francisco, CA",
    timePosted: "2h ago",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    title: "Modern Sofa - Excellent Condition",
    price: 450,
    location: "Oakland, CA",
    timePosted: "5h ago",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
    title: "Nike Running Shoes - Size 10",
    price: 85,
    location: "San Jose, CA",
    timePosted: "1d ago",
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=300&fit=crop",
    title: "MacBook Pro 2021 - M1 Chip",
    price: 1299,
    location: "Berkeley, CA",
    timePosted: "3h ago",
  },
  {
    id: "5",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
    title: "Vintage Watch Collection",
    price: 350,
    location: "Palo Alto, CA",
    timePosted: "6h ago",
  },
  {
    id: "6",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
    title: "Desk Chair - Ergonomic Design",
    price: 220,
    location: "Mountain View, CA",
    timePosted: "8h ago",
  },
  {
    id: "7",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop",
    title: "Designer Sunglasses",
    price: 120,
    location: "Santa Clara, CA",
    timePosted: "4h ago",
  },
  {
    id: "8",
    image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=300&fit=crop",
    title: "Gaming Console Bundle",
    price: 380,
    location: "San Mateo, CA",
    timePosted: "12h ago",
  },
];

export default function Home() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div>
      <Hero />
      <CategoryFilters />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-32">
              <FilterSidebar />
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">All Listings</h2>
              
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden" data-testid="button-mobile-filters">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockListings.map((listing) => (
                <ListingCard key={listing.id} {...listing} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
