import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { Sparkles } from "lucide-react";

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
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const scrollPositionRef = useRef(0);
  const lastTimestampRef = useRef<number>();
  const inactivityTimeoutRef = useRef<NodeJS.Timeout>();

  const SCROLL_SPEED = 40; // pixels per second
  const INACTIVITY_DELAY = 4000; // 4 seconds

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

  // Infinite auto-scroll animation
  useEffect(() => {
    if (loading || listings.length === 0 || isPaused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    const animate = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastTimestampRef.current) / 1000; // Convert to seconds
      lastTimestampRef.current = timestamp;

      // Calculate scroll distance based on speed and time
      scrollPositionRef.current += SCROLL_SPEED * deltaTime;

      // Get the width of a single set of items (not including duplicates)
      const firstChild = container.firstElementChild as HTMLElement;
      if (firstChild) {
        const itemWidth = firstChild.offsetWidth;
        const totalItems = listings.length;
        const totalWidth = itemWidth * totalItems;

        // Reset position when we've scrolled past one full set
        if (scrollPositionRef.current >= totalWidth) {
          scrollPositionRef.current = scrollPositionRef.current % totalWidth;
        }

        // Apply transform
        container.style.transform = `translateX(-${scrollPositionRef.current}px)`;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [loading, listings, isPaused]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    lastTimestampRef.current = undefined; // Reset timestamp to avoid jump
  };

  const handleScroll = () => {
    // Pause auto-scroll when user manually scrolls
    setIsPaused(true);
    
    // Clear existing timeout
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Resume auto-scroll after inactivity
    inactivityTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      lastTimestampRef.current = undefined; // Reset timestamp
    }, INACTIVITY_DELAY);
  };

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

  // Duplicate listings array multiple times for seamless infinite scroll
  const duplicatedListings = [...listings, ...listings, ...listings];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Featured Listings
        </h2>
      </div>

      {/* Carousel Container */}
      <div 
        className="carousel-wrapper overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onScroll={handleScroll}
      >
        <div 
          ref={scrollContainerRef}
          className="carousel-track flex gap-4"
          style={{
            willChange: 'transform',
          }}
        >
          {duplicatedListings.map((listing, index) => (
            <div 
              key={`${listing.id}-${index}`}
              className="carousel-item flex-shrink-0"
              style={{
                width: 'calc((100% - 3rem) / 4)', // 4 items visible on desktop
              }}
            >
              <Link href={`/listings/${listing.id}`}>
                <div className="group relative cursor-pointer h-full">
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
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .carousel-wrapper {
          position: relative;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        .carousel-track {
          transition: none; /* Disable transition, use transform for smooth animation */
        }

        /* Responsive item widths */
        @media (max-width: 640px) {
          .carousel-item {
            width: calc((100% - 1rem) / 2) !important; /* 2 items on mobile */
          }
        }

        @media (min-width: 641px) and (max-width: 768px) {
          .carousel-item {
            width: calc((100% - 2rem) / 3) !important; /* 3 items on tablet */
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .carousel-item {
            width: calc((100% - 2rem) / 3) !important; /* 3 items on small desktop */
          }
        }
      `}</style>
    </div>
  );
}
