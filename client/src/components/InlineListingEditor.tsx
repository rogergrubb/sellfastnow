import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { RotateCw, Save, X, MapPin } from "lucide-react";
import type { Listing } from "@shared/schema";
import { LocationSelectionModal } from "@/components/LocationSelectionModal";
import type { LocationData } from "@/components/LocationSelectionModal";

interface InlineListingEditorProps {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export default function InlineListingEditor({
  listing,
  open,
  onOpenChange,
  onSave,
}: InlineListingEditorProps) {
  const [formData, setFormData] = useState({
    title: listing.title,
    description: listing.description || "",
    price: listing.price,
    category: listing.category,
    condition: listing.condition,
  });
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const [saving, setSaving] = useState(false);
  const [rotating, setRotating] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth();

  // Reset form data when listing changes
  useEffect(() => {
    setFormData({
      title: listing.title,
      description: listing.description || "",
      price: listing.price,
      category: listing.category,
      condition: listing.condition,
    });
    setImageRotation(0);
    
    // Initialize location data if available
    if (listing.locationLatitude && listing.locationLongitude) {
      setLocationData({
        latitude: listing.locationLatitude,
        longitude: listing.locationLongitude,
        address: listing.locationAddress || '',
        city: listing.locationCity || '',
        state: listing.locationState || '',
        postalCode: listing.locationPostalCode || '',
        country: listing.locationCountry || '',
        precisionLevel: listing.locationPrecisionLevel || 'exact',
        displayAddress: listing.locationDisplayAddress || '',
        neighborhood: listing.locationNeighborhood || '',
        county: listing.locationCounty || '',
        displayRadiusKm: listing.locationDisplayRadiusKm || 0,
      });
    } else {
      setLocationData(null);
    }
  }, [listing.id]);

  const handleRotateImage = async () => {
    if (!listing.images || listing.images.length === 0) {
      toast({
        title: "No image",
        description: "This listing has no images to rotate",
        variant: "destructive",
      });
      return;
    }

    setRotating(true);
    try {
      // Get auth token
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Calculate new rotation
      const currentRotation = listing.imageRotations?.[0] || 0;
      const newRotation = (currentRotation + 90) % 360;
      const newRotations = [newRotation, ...(listing.imageRotations?.slice(1) || [])];

      // Update listing with new rotation
      const response = await fetch(`/api/bulk-edit/listings/${listing.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageRotations: newRotations,
        }),
      });

      if (!response.ok) throw new Error("Failed to rotate image");

      const data = await response.json();
      
      // Update local rotation for preview
      setImageRotation((prev) => (prev + 90) % 360);

      toast({
        title: "Success",
        description: "Image rotated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rotate image",
        variant: "destructive",
      });
    } finally {
      setRotating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get auth token
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Prepare update data with location if available
      const updateData: any = { ...formData };
      
      if (locationData) {
        updateData.locationLatitude = locationData.latitude;
        updateData.locationLongitude = locationData.longitude;
        updateData.locationAddress = locationData.address;
        updateData.locationCity = locationData.city;
        updateData.locationState = locationData.state;
        updateData.locationPostalCode = locationData.postalCode;
        updateData.locationCountry = locationData.country;
        updateData.locationPrecisionLevel = locationData.precisionLevel;
        updateData.locationDisplayAddress = locationData.displayAddress;
        updateData.locationNeighborhood = locationData.neighborhood;
        updateData.locationCounty = locationData.county;
        updateData.locationDisplayRadiusKm = locationData.displayRadiusKm;
      }

      const response = await fetch(`/api/bulk-edit/listings/${listing.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Failed to save listing");

      toast({
        title: "Success",
        description: "Listing updated successfully",
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save listing",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Listing</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-contain"
                  style={{ transform: `rotate(${imageRotation}deg)` }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
            <Button
              onClick={handleRotateImage}
              disabled={rotating || !listing.images || listing.images.length === 0}
              className="w-full"
              variant="outline"
            >
              <RotateCw className={`h-4 w-4 mr-2 ${rotating ? "animate-spin" : ""}`} />
              Rotate 90°
            </Button>
          </div>

          {/* Form Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Listing title"
              />
            </div>

            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="toys">Toys</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="tools">Tools</SelectItem>
                  <SelectItem value="home">Home & Garden</SelectItem>
                  <SelectItem value="collectibles">Collectibles</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({ ...formData, condition: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like_new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your item..."
                rows={6}
              />
            </div>

            <div>
              <Label>Location</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowLocationModal(true)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {locationData ? (
                  <span className="truncate">
                    {locationData.displayAddress || locationData.city || 'Location set'}
                  </span>
                ) : (
                  'Set location'
                )}
              </Button>
              {locationData && (
                <p className="text-xs text-muted-foreground mt-1">
                  {locationData.city}, {locationData.state} {locationData.postalCode}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>

      {/* Location Selection Modal */}
      <LocationSelectionModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
        onSave={(data) => {
          setLocationData(data);
          setShowLocationModal(false);
        }}
        initialData={locationData || undefined}
      />
    </Dialog>
  );
}

