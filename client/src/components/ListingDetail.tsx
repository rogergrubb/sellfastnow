import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { MapPin, Clock, Heart, Share2, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ListingDetailProps {
  id: string;
  images: string[];
  title: string;
  price: number;
  description: string;
  condition: string;
  category: string;
  location: string;
  timePosted: string;
  sellerName: string;
  sellerAvatar?: string;
}

export default function ListingDetail({
  id,
  images,
  title,
  price,
  description,
  condition,
  category,
  location,
  timePosted,
  sellerName,
  sellerAvatar,
}: ListingDetailProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="aspect-[16/10] rounded-lg overflow-hidden bg-muted">
              <img
                src={images[currentImage]}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                      currentImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                    data-testid={`button-thumbnail-${index}`}
                  >
                    <img src={img} alt={`${title} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">{category}</Badge>
                  <Badge variant="outline">{condition}</Badge>
                </div>
                <h1 className="text-3xl font-bold mb-2">{title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{timePosted}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setIsFavorite(!isFavorite);
                    console.log("Favorite toggled");
                  }}
                  data-testid="button-favorite-detail"
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => console.log("Share clicked")}
                  data-testid="button-share"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => console.log("Report clicked")}
                  data-testid="button-report"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-4xl font-bold text-primary mb-6">
              ${price.toLocaleString()}
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-muted-foreground whitespace-pre-line">{description}</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Seller Information</h3>
            <div className="flex items-center gap-3 mb-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={sellerAvatar} />
                <AvatarFallback>{sellerName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{sellerName}</div>
                <div className="text-sm text-muted-foreground">Member since 2024</div>
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                className="w-full bg-secondary hover:bg-secondary"
                data-testid="button-contact-seller"
                onClick={() => console.log("Contact seller clicked")}
              >
                Contact Seller
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                data-testid="button-make-offer"
                onClick={() => console.log("Make offer clicked")}
              >
                Make an Offer
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-3">Safety Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Meet in a public place</li>
              <li>• Inspect item before paying</li>
              <li>• Never send money in advance</li>
              <li>• Trust your instincts</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
