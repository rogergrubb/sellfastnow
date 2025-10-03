import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Upload, X } from "lucide-react";

export default function PostAdForm() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
    location: "",
  });
  const [images, setImages] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Ad posted:", formData, images);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls = files.map(file => URL.createObjectURL(file));
    setImages([...images, ...urls]);
    console.log("Images uploaded:", files.length);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Post Your Ad</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="images" className="mb-3 block">Photos</Label>
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate cursor-pointer">
            <input
              type="file"
              id="images"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              data-testid="input-images"
            />
            <label htmlFor="images" className="cursor-pointer">
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload images or drag and drop
              </p>
            </label>
          </div>
          
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                    data-testid={`button-remove-image-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="What are you selling?"
            className="mt-2"
            data-testid="input-title"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your item..."
            className="mt-2 min-h-32"
            data-testid="input-description"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              className="mt-2"
              data-testid="input-price"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id="category" className="mt-2" data-testid="select-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="furniture">Furniture</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="vehicles">Vehicles</SelectItem>
                <SelectItem value="services">Services</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="condition">Condition</Label>
            <Select 
              value={formData.condition} 
              onValueChange={(value) => setFormData({ ...formData, condition: value })}
            >
              <SelectTrigger id="condition" className="mt-2" data-testid="select-condition-post">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="like-new">Like New</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, State"
              className="mt-2"
              data-testid="input-location-post"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1"
            data-testid="button-cancel"
            onClick={() => console.log("Cancel clicked")}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1 bg-secondary hover:bg-secondary"
            data-testid="button-submit-ad"
          >
            Post Ad
          </Button>
        </div>
      </form>
    </Card>
  );
}
