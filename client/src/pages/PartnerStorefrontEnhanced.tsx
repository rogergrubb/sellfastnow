import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Search, Filter, Grid3x3, List, Mail, Phone, MapPin, 
  Globe, Facebook, Twitter, Instagram, Linkedin,
  Star, TrendingUp, Award, Clock, Shield, Truck,
  CheckCircle, Calendar, Users, Building2, ExternalLink
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
  // Enhanced fields
  phone?: string;
  email?: string;
  address?: string;
  businessHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  aboutUs?: string;
  missionStatement?: string;
  tagline?: string;
  yearsInBusiness?: number;
  foundedYear?: number;
  specializations?: string[];
  licenseNumber?: string;
  certifications?: Array<{
    name: string;
    issuer: string;
    year?: number;
  }>;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
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

interface Review {
  id: string;
  customerName: string;
  customerLocation: string;
  rating: number;
  reviewText: string;
  responseText?: string;
  createdAt: string;
}

export default function PartnerStorefrontEnhanced() {
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

  // Fetch reviews
  const { data: reviews } = useQuery<Review[]>({
    queryKey: [`/api/partners/storefront/${domain}/reviews`],
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

  const avgRating = reviews?.length 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const brandStyles = {
    '--brand-primary': partner.primaryColor || '#2563eb',
    '--brand-secondary': partner.secondaryColor || '#7c3aed',
  } as React.CSSProperties;

  const currentYear = new Date().getFullYear();
  const yearsInBusiness = partner.foundedYear 
    ? currentYear - partner.foundedYear 
    : partner.yearsInBusiness || 0;

  return (
    <div className="min-h-screen bg-gray-50" style={brandStyles}>
      {/* Enhanced Hero Section with Banner */}
      <div 
        className="relative h-96 bg-gradient-to-r from-blue-600 to-indigo-700"
        style={{
          backgroundImage: partner.bannerUrl ? `url(${partner.bannerUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40"></div>
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 w-full">
            {/* Logo */}
            {partner.logoUrl && (
              <div className="flex-shrink-0">
                <img 
                  src={partner.logoUrl} 
                  alt={partner.businessName}
                  className="w-40 h-40 rounded-2xl bg-white p-6 shadow-2xl object-contain"
                />
              </div>
            )}
            
            {/* Business Info */}
            <div className="text-white flex-1">
              <h1 className="text-5xl md:text-6xl font-bold mb-3">{partner.businessName}</h1>
              {partner.tagline && (
                <p className="text-2xl text-gray-200 mb-4 font-light">{partner.tagline}</p>
              )}
              <p className="text-xl text-gray-300 mb-6 max-w-3xl">{partner.businessDescription}</p>
              
              {/* Key Stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                {partner.city && partner.state && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <MapPin className="w-4 h-4" />
                    <span>{partner.city}, {partner.state}</span>
                  </div>
                )}
                {yearsInBusiness > 0 && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Calendar className="w-4 h-4" />
                    <span>{yearsInBusiness} Years in Business</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <TrendingUp className="w-4 h-4" />
                  <span>{partner.totalSales.toLocaleString()} Sales</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Award className="w-4 h-4" />
                  <span>{partner.totalListings} Active Listings</span>
                </div>
                {reviews && reviews.length > 0 && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{avgRating} ({reviews.length} reviews)</span>
                  </div>
                )}
              </div>

              {/* Primary CTAs */}
              <div className="flex flex-wrap gap-4 mt-8">
                <a 
                  href="#contact" 
                  className="px-8 py-4 rounded-lg font-semibold text-white transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  style={{ backgroundColor: partner.primaryColor }}
                >
                  Contact Us
                </a>
                <a 
                  href="#inventory" 
                  className="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  View Inventory
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${partner.primaryColor}15` }}>
                <Shield className="w-8 h-8" style={{ color: partner.primaryColor }} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Verified Business</div>
                <div className="text-sm text-gray-600">Licensed & Insured</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-yellow-50">
                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Top Rated</div>
                <div className="text-sm text-gray-600">{avgRating} Star Rating</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${partner.secondaryColor}15` }}>
                <Truck className="w-8 h-8" style={{ color: partner.secondaryColor }} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Professional Service</div>
                <div className="text-sm text-gray-600">Reliable & Fast</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-50">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Quick Response</div>
                <div className="text-sm text-gray-600">Same-Day Replies</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Us Section */}
      {(partner.aboutUs || partner.missionStatement || partner.specializations) && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6" style={{ color: partner.primaryColor }}>
                  About {partner.businessName}
                </h2>
                {partner.aboutUs && (
                  <div className="text-gray-700 text-lg leading-relaxed mb-6">
                    {partner.aboutUs}
                  </div>
                )}
                {partner.missionStatement && (
                  <div className="border-l-4 pl-6 py-4 mb-6" style={{ borderColor: partner.primaryColor }}>
                    <div className="text-sm font-semibold text-gray-500 uppercase mb-2">Our Mission</div>
                    <div className="text-gray-800 text-lg italic">{partner.missionStatement}</div>
                  </div>
                )}
                {partner.specializations && partner.specializations.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-gray-500 uppercase mb-3">Specializations</div>
                    <div className="flex flex-wrap gap-2">
                      {partner.specializations.map((spec, idx) => (
                        <span 
                          key={idx}
                          className="px-4 py-2 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: partner.primaryColor }}
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl text-center">
                  <div className="text-4xl font-bold mb-2" style={{ color: partner.primaryColor }}>
                    {yearsInBusiness}+
                  </div>
                  <div className="text-gray-600">Years Experience</div>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl text-center">
                  <div className="text-4xl font-bold mb-2" style={{ color: partner.primaryColor }}>
                    {partner.totalSales.toLocaleString()}
                  </div>
                  <div className="text-gray-600">Happy Customers</div>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl text-center">
                  <div className="text-4xl font-bold mb-2" style={{ color: partner.primaryColor }}>
                    {avgRating}
                  </div>
                  <div className="text-gray-600">Average Rating</div>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl text-center">
                  <div className="text-4xl font-bold mb-2" style={{ color: partner.primaryColor }}>
                    {partner.totalListings}
                  </div>
                  <div className="text-gray-600">Active Listings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credentials & Certifications */}
      {(partner.licenseNumber || (partner.certifications && partner.certifications.length > 0)) && (
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12" style={{ color: partner.primaryColor }}>
              Credentials & Certifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partner.licenseNumber && (
                <div className="bg-white p-6 rounded-xl shadow-sm border-2" style={{ borderColor: `${partner.primaryColor}30` }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${partner.primaryColor}15` }}>
                      <CheckCircle className="w-6 h-6" style={{ color: partner.primaryColor }} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Business License</div>
                      <div className="text-sm text-gray-600">License #{partner.licenseNumber}</div>
                      <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Verified
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {partner.certifications?.map((cert, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border-2" style={{ borderColor: `${partner.primaryColor}30` }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${partner.secondaryColor}15` }}>
                      <Award className="w-6 h-6" style={{ color: partner.secondaryColor }} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">{cert.name}</div>
                      <div className="text-sm text-gray-600">{cert.issuer}</div>
                      {cert.year && (
                        <div className="text-xs text-gray-500 mt-1">Issued {cert.year}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customer Reviews */}
      {reviews && reviews.length > 0 && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" style={{ color: partner.primaryColor }}>
                Customer Reviews
              </h2>
              <div className="flex items-center justify-center gap-2 text-2xl">
                <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{avgRating}</span>
                <span className="text-gray-600">({reviews.length} reviews)</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.slice(0, 6).map((review) => (
                <div key={review.id} className="bg-gray-50 p-6 rounded-xl">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed">{review.reviewText}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-semibold text-gray-900">{review.customerName}</div>
                      <div className="text-gray-500">{review.customerLocation}</div>
                    </div>
                    <div className="text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {review.responseText && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 mb-2">Response from {partner.businessName}</div>
                      <p className="text-sm text-gray-600">{review.responseText}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Section */}
      <div id="inventory" className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold mb-8" style={{ color: partner.primaryColor }}>
          Our Inventory
        </h2>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': partner.primaryColor } as React.CSSProperties}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-lg transition ${
                  viewMode === 'grid' 
                    ? 'text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                style={viewMode === 'grid' ? { backgroundColor: partner.primaryColor } : {}}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-lg transition ${
                  viewMode === 'list' 
                    ? 'text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                style={viewMode === 'list' ? { backgroundColor: partner.primaryColor } : {}}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2"
                  style={{ '--tw-ring-color': partner.primaryColor } as React.CSSProperties}
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

        <div className="mb-4">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filteredListings.length}</span> of{' '}
            <span className="font-semibold">{listings?.length || 0}</span> items
          </p>
        </div>

        {/* Listings */}
        {listingsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: partner.primaryColor }}></div>
            <p className="text-gray-600">Loading items...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">No items found matching your criteria.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <a 
                key={listing.id} 
                href={`/listings/${listing.id}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-all transform hover:-translate-y-1 overflow-hidden group"
              >
                <div className="relative">
                  <img
                    src={listing.images[0] || '/placeholder.png'}
                    alt={listing.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-opacity-80" style={{ color: partner.primaryColor }}>
                    {listing.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold" style={{ color: partner.primaryColor }}>
                      ${listing.price}
                    </span>
                    <span className="text-sm text-white px-4 py-2 rounded-lg transition group-hover:shadow-md" style={{ backgroundColor: partner.primaryColor }}>
                      View Details
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map((listing) => (
              <a 
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-all p-6 flex gap-6 group"
              >
                <img
                  src={listing.images[0] || '/placeholder.png'}
                  alt={listing.title}
                  className="w-48 h-48 object-cover rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-2xl mb-2 group-hover:text-opacity-80" style={{ color: partner.primaryColor }}>
                    {listing.title}
                  </h3>
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
                    <span className="text-3xl font-bold" style={{ color: partner.primaryColor }}>
                      ${listing.price}
                    </span>
                    <span className="px-6 py-3 text-white rounded-lg transition group-hover:shadow-md" style={{ backgroundColor: partner.primaryColor }}>
                      View Details
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div id="contact" className="bg-white border-t py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12" style={{ color: partner.primaryColor }}>
            Get In Touch
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
              <div className="space-y-6">
                {partner.phone && (
                  <a href={`tel:${partner.phone}`} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition group">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition" style={{ backgroundColor: `${partner.primaryColor}15` }}>
                      <Phone className="w-6 h-6" style={{ color: partner.primaryColor }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-500 uppercase mb-1">Phone</div>
                      <div className="text-lg font-medium text-gray-900">{partner.phone}</div>
                      <div className="text-sm text-gray-600">Click to call</div>
                    </div>
                  </a>
                )}
                {partner.email && (
                  <a href={`mailto:${partner.email}`} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition group">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition" style={{ backgroundColor: `${partner.primaryColor}15` }}>
                      <Mail className="w-6 h-6" style={{ color: partner.primaryColor }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-500 uppercase mb-1">Email</div>
                      <div className="text-lg font-medium text-gray-900">{partner.email}</div>
                      <div className="text-sm text-gray-600">Click to email</div>
                    </div>
                  </a>
                )}
                {partner.address && (
                  <div className="flex items-start gap-4 p-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${partner.primaryColor}15` }}>
                      <MapPin className="w-6 h-6" style={{ color: partner.primaryColor }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-500 uppercase mb-1">Address</div>
                      <div className="text-lg font-medium text-gray-900">{partner.address}</div>
                      {partner.city && partner.state && (
                        <div className="text-gray-600">{partner.city}, {partner.state}</div>
                      )}
                    </div>
                  </div>
                )}
                {partner.businessHours && (
                  <div className="flex items-start gap-4 p-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${partner.primaryColor}15` }}>
                      <Clock className="w-6 h-6" style={{ color: partner.primaryColor }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-500 uppercase mb-3">Business Hours</div>
                      <div className="space-y-2 text-sm">
                        {Object.entries(partner.businessHours).map(([day, hours]) => (
                          <div key={day} className="flex justify-between">
                            <span className="font-medium capitalize text-gray-700">{day}</span>
                            <span className="text-gray-600">{hours || 'Closed'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Media */}
              {partner.socialMedia && (
                <div className="mt-8">
                  <div className="text-sm font-semibold text-gray-500 uppercase mb-4">Follow Us</div>
                  <div className="flex gap-3">
                    {partner.socialMedia.facebook && (
                      <a 
                        href={partner.socialMedia.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 hover:bg-blue-600 hover:text-white transition"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                    {partner.socialMedia.twitter && (
                      <a 
                        href={partner.socialMedia.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 hover:bg-sky-500 hover:text-white transition"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {partner.socialMedia.instagram && (
                      <a 
                        href={partner.socialMedia.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 hover:bg-pink-600 hover:text-white transition"
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {partner.socialMedia.linkedin && (
                      <a 
                        href={partner.socialMedia.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 hover:bg-blue-700 hover:text-white transition"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {partner.socialMedia.website && (
                      <a 
                        href={partner.socialMedia.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 hover:text-white transition"
                        style={{ backgroundColor: `${partner.primaryColor}15` }}
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Form */}
            <div>
              <h3 className="text-2xl font-semibold mb-6">Send Us a Message</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': partner.primaryColor } as React.CSSProperties}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': partner.primaryColor } as React.CSSProperties}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': partner.primaryColor } as React.CSSProperties}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': partner.primaryColor } as React.CSSProperties}
                    placeholder="Tell us about your needs..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              {partner.logoUrl && (
                <img 
                  src={partner.logoUrl} 
                  alt={partner.businessName}
                  className="h-16 mb-4 object-contain bg-white p-2 rounded"
                />
              )}
              <p className="text-gray-400">{partner.businessDescription}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-gray-400">
                <a href="#inventory" className="block hover:text-white transition">Inventory</a>
                <a href="#contact" className="block hover:text-white transition">Contact</a>
                <a href="/" className="block hover:text-white transition">SellFast.Now Marketplace</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400 text-sm">
                {partner.phone && <div>{partner.phone}</div>}
                {partner.email && <div>{partner.email}</div>}
                {partner.city && partner.state && <div>{partner.city}, {partner.state}</div>}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>© {currentYear} {partner.businessName}. All rights reserved. Powered by SellFast.Now</p>
          </div>
        </div>
      </div>
    </div>
  );
}
