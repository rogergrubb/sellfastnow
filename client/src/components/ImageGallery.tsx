import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <Card className="aspect-[4/3] flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">No images available</p>
      </Card>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleZoom = () => {
    window.open(images[currentIndex], '_blank');
  };

  return (
    <div className="space-y-4" data-testid="image-gallery">
      <Card className="relative overflow-hidden bg-muted">
        <div className="aspect-[4/3] flex items-center justify-center">
          <img
            src={images[currentIndex]}
            alt={`${title} - Image ${currentIndex + 1}`}
            className="w-full h-full object-contain"
            data-testid={`image-main-${currentIndex}`}
          />
        </div>

        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
              onClick={handlePrevious}
              data-testid="button-image-prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
              onClick={handleNext}
              data-testid="button-image-next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        <div className="absolute top-2 right-2 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-background/80 backdrop-blur-sm"
            onClick={handleZoom}
            data-testid="button-image-zoom"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-md text-sm font-medium" data-testid="text-image-counter">
          {currentIndex + 1} / {images.length}
        </div>
      </Card>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                index === currentIndex
                  ? 'border-primary'
                  : 'border-transparent hover:border-muted-foreground'
              }`}
              data-testid={`button-thumbnail-${index}`}
            >
              <img
                src={image}
                alt={`${title} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
