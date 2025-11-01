import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Search, Filter, Grid3x3, List, Mail, Phone, MapPin, 
  Globe, Facebook, Twitter, Instagram, Linkedin,
  Star, TrendingUp, Award, Clock, Shield, Truck
} from "lucide-react";

interface PartnerData {
  id: string;
  businessName: string;
  businessType: string;
  businessDescription: string;
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain: string;
  city?: string;
  state?: string;
  totalListings: number;
  totalSales: number;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: string;
  images: string[];
  category: string;
  condition: string;
  location: string;
  createdAt: string;
}

export default function PartnerStorefront() {
  const params = useParams();
  const domain = params.domain;
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch partner data
  const { data: partner, isLoading: partnerLoading } = useQuery<PartnerData>({
    queryKey: [`/api/partners/storefront/${domain}`],
  });

  // Fetch partner listings
  const { data: listings, isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: [`/api/partners/storefront/${domain}/listings`],
    enabled: !!partner,
  });

  if (partnerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Storefront Not Found</h1>
          <p className="text-gray-600">This business partner page does not exist.</p>
        </div>
      </div>
    );
  }

  const filteredListings = listings?.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || listing.category === selectedCategory;
    const price = parseFloat(listing.price);
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesPrice;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Banner */}
      <div 
        className="relative h-80 bg-gradient-to-r from-blue-600 to-indigo-700"
        style={{
          backgroundImage: partner.bannerUrl ? `url(${partner.bannerUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="flex items-center gap-6">
            {partner.logoUrl && (
              <img 
                src={partner.logoUrl} 
                alt={partner.businessName}
                className="w-32 h-32 rounded-lg bg-white p-4 shadow-xl"
              />
            )}
            <div className="text-white">
              <h1 className="text-5xl font-bold mb-2">{partner.businessName}</h1>
              <p className="text-xl text-gray-200 mb-4">{partner.businessDescription}</p>
              <div className="flex items-center gap-4 text-sm">
                {partner.city && partner.state && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{partner.city}, {partner.state}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{partner.totalSales} Sales</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  <span>{partner.totalListings} Active Listings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-8 h-8 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Verified Business</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Star className="w-8 h-8 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Top Rated Seller</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Truck className="w-8 h-8 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Fast Shipping</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Clock className="w-8 h-8 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Quick Response</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>

            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-lg transition ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-lg transition ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="furniture">Furniture</option>
                  <option value="electronics">Electronics</option>
                  <option value="appliances">Appliances</option>
                  <option value="tools">Tools</option>
                  <option value="vehicles">Vehicles</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Price: ${priceRange[0]}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price: ${priceRange[1]}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filteredListings.length}</span> of{' '}
            <span className="font-semibold">{listings?.length || 0}</span> items
          </p>
        </div>

        {/* Listings Grid/List */}
        {listingsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading items...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">No items found matching your criteria.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition overflow-hidden">
                <img
                  src={listing.images[0] || '/placeholder.png'}
                  alt={listing.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{listing.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">${listing.price}</span>
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      style={{ backgroundColor: partner.primaryColor }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition p-6 flex gap-6">
                <img
                  src={listing.images[0] || '/placeholder.png'}
                  alt={listing.title}
                  className="w-48 h-48 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-2xl mb-2">{listing.title}</h3>
                  <p className="text-gray-600 mb-4">{listing.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="px-3 py-1 bg-gray-100 rounded-full">{listing.category}</span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full">{listing.condition}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {listing.location}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-blue-600">${listing.price}</span>
                    <button 
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      style={{ backgroundColor: partner.primaryColor }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
              <p className="text-gray-600 mb-6">
                Interested in bulk purchases or have questions? Get in touch with our team.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">contact@example.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">(555) 123-4567</span>
                </div>
                {partner.city && partner.state && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">{partner.city}, {partner.state}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                  <Facebook className="w-5 h-5 text-gray-700" />
                </a>
                <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                  <Twitter className="w-5 h-5 text-gray-700" />
                </a>
                <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                  <Instagram className="w-5 h-5 text-gray-700" />
                </a>
                <a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                  <Linkedin className="w-5 h-5 text-gray-700" />
                </a>
              </div>
            </div>

            <div>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about your needs..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  style={{ backgroundColor: partner.primaryColor }}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-400">
            © 2025 {partner.businessName}. Powered by SellFast.Now
          </p>
        </div>
      </div>
    </div>
  );
}

