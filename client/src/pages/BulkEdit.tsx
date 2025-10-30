import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Save,
  ArrowLeft,
} from "lucide-react";
import { useLocation } from "wouter";
import type { Listing } from "@shared/schema";

export default function BulkEdit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageRotations, setImageRotations] = useState<Record<number, number>>({});
  const [editedListing, setEditedListing] = useState<Partial<Listing> | null>(null);

  // Fetch user's listings
  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/bulk-edit/listings"],
    enabled: !!user,
  });

  const currentListing = listings[currentIndex];

  // Initialize edited listing when current listing changes
  useEffect(() => {
    if (currentListing) {
      setEditedListing({
        title: currentListing.title,
        description: currentListing.description,
        price: currentListing.price,
        category: currentListing.category,
        condition: currentListing.condition,
      });

      // Load saved rotations from metadata
      const metadata = currentListing.metadata as any;
      if (metadata?.imageRotations) {
        setImageRotations(metadata.imageRotations);
      } else {
        setImageRotations({});
      }
    }
  }, [currentListing]);

  // Update listing mutation
  const updateListingMutation = useMutation({
    mutationFn: async () => {
      if (!currentListing || !editedListing) return;

      const response = await fetch(`/api/bulk-edit/listings/${currentListing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...editedListing,
          imageRotations,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update listing");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-edit/listings"] });
      toast({
        title: "Success",
        description: "Listing updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update listing",
        variant: "destructive",
      });
    },
  });

  // Rotate image
  const rotateImage = (imageIndex: number) => {
    setImageRotations((prev) => ({
      ...prev,
      [imageIndex]: ((prev[imageIndex] || 0) + 90) % 360,
    }));
  };

  // Navigate to previous listing
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Navigate to next listing
  const goToNext = () => {
    if (currentIndex < listings.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Save and go to next
  const saveAndNext = async () => {
    await updateListingMutation.mutateAsync();
    if (currentIndex < listings.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        updateListingMutation.mutate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, listings.length]);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <p>Please sign in to bulk edit listings.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading listings...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              No listings found. Create some listings first!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentListing || !editedListing) {
    return null;
  }

  const images = currentListing.images || [];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/my-listings")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Bulk Edit Listings</h1>
            <p className="text-muted-foreground">
              Listing {currentIndex + 1} of {listings.length}
            </p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            {currentIndex + 1} / {listings.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            disabled={currentIndex === listings.length - 1}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Section */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {images.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No images uploaded
              </p>
            ) : (
              images.map((imageUrl, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Image {index + 1}</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rotateImage(index)}
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      Rotate 90°
                    </Button>
                  </div>
                  <div className="relative bg-muted rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt={`Image ${index + 1}`}
                      className="max-w-full max-h-full object-contain"
                      style={{
                        transform: `rotate(${imageRotations[index] || 0}deg)`,
                        transition: "transform 0.3s ease",
                      }}
                    />
                  </div>
                  {imageRotations[index] > 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Rotated {imageRotations[index]}°
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Edit Section */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedListing.title || ""}
                onChange={(e) =>
                  setEditedListing({ ...editedListing, title: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedListing.description || ""}
                onChange={(e) =>
                  setEditedListing({
                    ...editedListing,
                    description: e.target.value,
                  })
                }
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={editedListing.price || ""}
                onChange={(e) =>
                  setEditedListing({
                    ...editedListing,
                    price: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={editedListing.category || ""}
                onChange={(e) =>
                  setEditedListing({
                    ...editedListing,
                    category: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="condition">Condition</Label>
              <Input
                id="condition"
                value={editedListing.condition || ""}
                onChange={(e) =>
                  setEditedListing({
                    ...editedListing,
                    condition: e.target.value,
                  })
                }
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => updateListingMutation.mutate()}
                disabled={updateListingMutation.isPending}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                onClick={saveAndNext}
                disabled={
                  updateListingMutation.isPending ||
                  currentIndex === listings.length - 1
                }
                variant="default"
                className="flex-1"
              >
                Save & Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Use ← → arrow keys to navigate, Ctrl+S to save
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

