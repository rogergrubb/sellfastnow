import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RotateCw, Save, X } from "lucide-react";
import type { Listing } from "@shared/schema";

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
  const [imageRotation, setImageRotation] = useState(0);
  const [saving, setSaving] = useState(false);
  const [rotating, setRotating] = useState(false);
  const { toast } = useToast();

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
      const response = await fetch(`/api/bulk-edit/${listing.id}/rotate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: listing.images[0],
          degrees: 90,
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
      const response = await fetch(`/api/bulk-edit/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
    </Dialog>
  );
}

