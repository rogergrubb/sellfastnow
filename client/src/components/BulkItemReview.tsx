import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Sparkles, Loader2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface DetectedProduct {
  title: string;
  description: string;
  category: string;
  retailPrice?: number;
  usedPrice?: number;
  condition: string;
  imageUrls: string[];
  imageIndices: number[];
}

interface BulkItemReviewProps {
  products: DetectedProduct[];
  onCancel: () => void;
}

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports & Outdoors",
  "Books & Media",
  "Toys & Games",
  "Vehicles",
  "Other"
];

const CONDITIONS = [
  "new",
  "like-new",
  "good",
  "fair",
  "poor"
];

export function BulkItemReview({ products: initialProducts, onCancel }: BulkItemReviewProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const updateProduct = (index: number, field: string, value: string | number) => {
    setProducts(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const deleteProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Item Removed",
      description: "Item deleted from the list.",
    });
  };

  const handlePublishAll = async () => {
    if (products.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to publish.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      console.log('📤 Publishing', products.length, 'items...');
      
      const listings = products.map(product => ({
        title: product.title,
        description: product.description,
        price: String(product.usedPrice || product.retailPrice || 0),
        category: product.category,
        condition: product.condition,
        location: "Local Area",
        images: product.imageUrls,
      }));

      const result = await apiRequest('/api/listings/batch', {
        method: 'POST',
        body: JSON.stringify({ listings }),
      });

      console.log('✅ Batch publish successful:', result);
      
      await queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
      
      toast({
        title: "Success!",
        description: `Successfully published ${products.length} item${products.length > 1 ? 's' : ''}!`,
      });
      
      setLocation('/');
    } catch (error) {
      console.error('❌ Batch publish error:', error);
      toast({
        title: "Error",
        description: "Failed to publish items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Review Your {products.length} Item{products.length > 1 ? 's' : ''}
            </span>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Edit details below, then publish all at once
          </p>
        </CardHeader>
      </Card>

      <div className="space-y-4 mb-6">
        {products.map((product, index) => (
          <Card key={index} data-testid={`item-card-${index}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Item {index + 1} of {products.length}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteProduct(index)}
                  data-testid={`button-delete-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-[200px,1fr] gap-4">
                <div className="space-y-2">
                  {product.imageUrls.map((url, imgIndex) => (
                    <div key={imgIndex} className="relative aspect-square rounded overflow-hidden border">
                      <img 
                        src={url} 
                        alt={`Item ${index + 1} - Image ${imgIndex + 1}`}
                        className="w-full h-full object-cover"
                        data-testid={`image-${index}-${imgIndex}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`title-${index}`}>
                      Title
                      <Badge variant="secondary" className="ml-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    </Label>
                    <Input
                      id={`title-${index}`}
                      value={product.title}
                      onChange={(e) => updateProduct(index, 'title', e.target.value)}
                      data-testid={`input-title-${index}`}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`description-${index}`}>
                      Description
                      <Badge variant="secondary" className="ml-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    </Label>
                    <Textarea
                      id={`description-${index}`}
                      value={product.description}
                      onChange={(e) => updateProduct(index, 'description', e.target.value)}
                      rows={3}
                      data-testid={`input-description-${index}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`category-${index}`}>Category</Label>
                      <Select 
                        value={product.category} 
                        onValueChange={(value) => updateProduct(index, 'category', value)}
                      >
                        <SelectTrigger id={`category-${index}`} data-testid={`select-category-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`condition-${index}`}>Condition</Label>
                      <Select 
                        value={product.condition} 
                        onValueChange={(value) => updateProduct(index, 'condition', value)}
                      >
                        <SelectTrigger id={`condition-${index}`} data-testid={`select-condition-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITIONS.map(cond => (
                            <SelectItem key={cond} value={cond}>
                              {cond.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`retail-${index}`}>Retail Price ($)</Label>
                      <Input
                        id={`retail-${index}`}
                        type="number"
                        value={product.retailPrice || ''}
                        onChange={(e) => updateProduct(index, 'retailPrice', parseFloat(e.target.value) || 0)}
                        data-testid={`input-retail-${index}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`used-${index}`}>Your Price ($)</Label>
                      <Input
                        id={`used-${index}`}
                        type="number"
                        value={product.usedPrice || ''}
                        onChange={(e) => updateProduct(index, 'usedPrice', parseFloat(e.target.value) || 0)}
                        data-testid={`input-price-${index}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex justify-between items-center gap-4 p-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPublishing}
            data-testid="button-cancel-all"
          >
            Cancel All
          </Button>
          <Button
            onClick={handlePublishAll}
            disabled={isPublishing || products.length === 0}
            data-testid="button-publish-all"
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing {products.length} items...
              </>
            ) : (
              <>Publish All {products.length} Item{products.length > 1 ? 's' : ''} →</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
