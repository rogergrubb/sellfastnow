import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Share2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export default function Collection() {
  const { batchId } = useParams();

  const { data: listings, isLoading, error } = useQuery<Listing[]>({
    queryKey: [`/api/collections/${batchId}`],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading collection...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listings || listings.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Collection Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This collection doesn't exist or has been removed.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const firstListing = listings[0];
  const collectionImage = firstListing.images[0] || "";
  const collectionTitle = `${listings.length} Items Collection`;
  const collectionDescription = listings
    .slice(0, 3)
    .map((l) => l.title)
    .join(", ") + (listings.length > 3 ? ` and ${listings.length - 3} more` : "");

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: collectionTitle,
          text: collectionDescription,
          url: url,
        });
      } catch (err) {
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <>
      <Helmet>
        <title>{collectionTitle} | SellFast.Now</title>
        <meta name="description" content={collectionDescription} />
        
        {/* Open Graph tags for Facebook, LinkedIn */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={collectionTitle} />
        <meta property="og:description" content={collectionDescription} />
        <meta property="og:image" content={collectionImage} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:site_name" content="SellFast.Now" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={collectionTitle} />
        <meta name="twitter:description" content={collectionDescription} />
        <meta name="twitter:image" content={collectionImage} />
        
        {/* WhatsApp specific */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {collectionTitle}
              </h1>
              <p className="text-muted-foreground">
                Posted {new Date(firstListing.createdAt).toLocaleDateString()}
              </p>
            </div>

            <Button onClick={handleShare} variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share Collection
            </Button>
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/listings/${listing.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    {listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No image</span>
                      </div>
                    )}
                    
                    {/* Condition Badge */}
                    <Badge className="absolute top-2 right-2">
                      {listing.condition}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {listing.title}
                    </h3>
                    
                    <p className="text-2xl font-bold text-primary mb-2">
                      ${listing.price}
                    </p>

                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {listing.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{listing.category}</span>
                      <span>{listing.location}</span>
                    </div>

                    <Button variant="ghost" size="sm" className="w-full mt-3">
                      View Details
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

