import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { Sparkles } from "lucide-react";


// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

interface FeaturedListing {
  id: string;
  title: string;
  price: string;
  primaryImage: string | null;
  location: string;
  featuredUntil: string;
}

export function FeaturedCarousel() {
  const [listings, setListings] = useState<FeaturedListing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeaturedListings = async () => {
    try {
      const res = await fetch("/api/featured-listings");
      if (!res.ok) throw new Error("Failed to fetch featured listings");
      const response = await res.json() as FeaturedListing[];
      setListings(response);
    } catch (error) {
      console.error("Error fetching featured listings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedListings();

    // Auto-refresh every 60 seconds to get new featured items
    const interval = setInterval(fetchFeaturedListings, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (listings.length === 0) {
    return null; // Don't show carousel if no featured listings
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Featured Listings
        </h2>
      </div>

      {/* Carousel */}
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={16}
        slidesPerView={1}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        navigation={true}
        loop={listings.length > 4}
        breakpoints={{
          640: {
            slidesPerView: 2,
          },
          768: {
            slidesPerView: 3,
          },
          1024: {
            slidesPerView: 4,
          },
        }}
        className="featured-carousel"
      >
        {listings.map((listing) => (
          <SwiperSlide key={listing.id}>
            <Link href={`/listings/${listing.id}`}>
              <div className="group relative cursor-pointer">
                {/* Featured Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white shadow-lg">
                    <Sparkles className="h-3 w-3" />
                    FEATURED
                  </span>
                </div>

                {/* Image Container */}
                <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  {listing.primaryImage ? (
                    <img
                      src={listing.primaryImage}
                      alt={listing.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                        {listing.title}
                      </h3>
                      <p className="text-lg font-bold">
                        ${parseFloat(listing.price).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        {listing.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

      <style>{`
        .featured-carousel .swiper-button-next,
        .featured-carousel .swiper-button-prev {
          color: #3b82f6;
          background: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .featured-carousel .swiper-button-next:after,
        .featured-carousel .swiper-button-prev:after {
          font-size: 18px;
          font-weight: bold;
        }

        .featured-carousel .swiper-pagination-bullet {
          background: #3b82f6;
        }

        .featured-carousel .swiper-pagination-bullet-active {
          background: #2563eb;
        }

        @media (max-width: 640px) {
          .featured-carousel .swiper-button-next,
          .featured-carousel .swiper-button-prev {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
