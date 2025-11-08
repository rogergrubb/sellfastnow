import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Trash2, 
  Sparkles, 
  Loader2, 
  Package, 
  Check, 
  PartyPopper, 
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Save,
  ZoomIn,
  X,
  Plus,
  AlertCircle,
  RotateCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ListingSuccessModal } from "@/components/ListingSuccessModal";
import { FolderSelectionModal } from "@/components/FolderSelectionModal";
import { SimpleLocationModal, type LocationData } from "@/components/SimpleLocationModal";

interface DetectedProduct {
  title: string;
  description: string;
  category: string;
  retailPrice?: number;
  usedPrice?: number;
  condition: string;
  imageUrls: string[];
  imageIndices: number[];
  isAIGenerated?: boolean;
}

interface ProductWithState extends DetectedProduct {
  isReviewed: boolean;
  tags: string[];
  errors: {
    title?: string;
    description?: string;
    category?: string;
    condition?: string;
    usedPrice?: string;
  };
}

interface BulkItemReviewProps {
  products: DetectedProduct[];
  onCancel: () => void;
  onUpgradeRemaining?: () => void;
  userCredits?: { creditsRemaining: number };
}

const CATEGORIES = [
  "Electronics",
  "Furniture",
  "Clothing",
  "Home & Garden",
  "Sports & Outdoors",
  "Books & Media",
  "Toys & Games",
  "Automotive",
  "Other"
];

const CONDITIONS = [
  "new",
  "like-new",
  "good",
  "fair",
  "poor"
];

// Generate AI-suggested tags from title and category
function generateSuggestedTags(title: string, category: string): string[] {
  const tags: string[] = [];
  const words = title.toLowerCase().split(/\s+/);
  
  // Add category-based tag
  if (category) {
    tags.push(category.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-'));
  }
  
  // Add meaningful words from title (excluding common words)
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
  words.forEach(word => {
    if (word.length > 3 && !commonWords.includes(word) && tags.length < 5) {
      tags.push(word);
    }
  });
  
  return tags.slice(0, 5);
}

export function BulkItemReview({ products: initialProducts, onCancel, onUpgradeRemaining, userCredits }: BulkItemReviewProps) {
  const { getToken } = useAuth();
  const [products, setProducts] = useState<ProductWithState[]>(
    initialProducts.map(p => ({
      ...p,
      isReviewed: false,
      tags: generateSuggestedTags(p.title, p.category),
      errors: {}
    }))
  );
  
  // Sync internal state when initialProducts prop changes (e.g., after AI generation)
  useEffect(() => {
    console.log('🔄 BulkItemReview: initialProducts changed, updating internal state');
    console.log('New products:', initialProducts.map(p => ({ title: p.title, isAI: p.isAIGenerated })));
    
    setProducts(prevProducts => {
      // Merge new data with existing state (preserve isReviewed, tags, errors)
      return initialProducts.map((newProduct, index) => {
        const existingProduct = prevProducts[index];
        
        // If product exists and has the same imageUrl, merge states
        if (existingProduct && existingProduct.imageUrls[0] === newProduct.imageUrls[0]) {
          return {
            ...newProduct,
            isReviewed: existingProduct.isReviewed,
            tags: newProduct.isAIGenerated && newProduct.title 
              ? generateSuggestedTags(newProduct.title, newProduct.category) 
              : existingProduct.tags,
            errors: existingProduct.errors
          };
        }
        
        // New product, initialize fresh
        return {
          ...newProduct,
          isReviewed: false,
          tags: generateSuggestedTags(newProduct.title, newProduct.category),
          errors: {}
        };
      });
    });
  }, [initialProducts]);
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingProgress, setPublishingProgress] = useState<{
    current: number;
    total: number;
    status: Array<{ title: string; status: 'completed' | 'publishing' | 'waiting' }>;
  } | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number>(0);
  const [enlargedProductIndex, setEnlargedProductIndex] = useState<number>(0);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
  const [newTag, setNewTag] = useState<{ [key: number]: string }>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successListingIds, setSuccessListingIds] = useState<string[]>([]);
  const [successListingTitles, setSuccessListingTitles] = useState<string[]>([]);
  const [successBatchId, setSuccessBatchId] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const reviewedCount = products.filter(p => p.isReviewed).length;
  const totalCount = products.length;
  const allReviewed = reviewedCount === totalCount;

  const updateProduct = (index: number, field: keyof ProductWithState, value: any) => {
    setProducts(prev => prev.map((p, i) => {
      if (i === index) {
        const updated = { ...p, [field]: value };
        // Clear error for this field when user edits it
        if (p.errors[field as keyof typeof p.errors]) {
          updated.errors = { ...updated.errors, [field]: undefined };
        }
        return updated;
      }
      return p;
    }));
  };

  const toggleReview = (index: number) => {
    const newValue = !products[index].isReviewed;
    updateProduct(index, 'isReviewed', newValue);
    
    // Auto-scroll to next unreviewed item
    if (newValue && index < products.length - 1) {
      setTimeout(() => {
        cardRefs.current[index + 1]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    }
  };

  const deleteProduct = (index: number) => {
    if (products.length === 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one item to publish.",
        variant: "destructive",
      });
      return;
    }

    setProducts(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Item Removed",
      description: "Item deleted from the list.",
    });
  };

  const addTag = (index: number) => {
    const tag = newTag[index]?.trim();
    if (!tag) return;

    const currentTags = products[index].tags;
    if (currentTags.includes(tag.toLowerCase())) {
      toast({
        title: "Tag Already Exists",
        description: "This tag is already added.",
        variant: "destructive",
      });
      return;
    }

    updateProduct(index, 'tags', [...currentTags, tag.toLowerCase()]);
    setNewTag(prev => ({ ...prev, [index]: '' }));
  };

  const removeTag = (index: number, tagToRemove: string) => {
    updateProduct(index, 'tags', products[index].tags.filter(t => t !== tagToRemove));
  };

  const validateProducts = (): boolean => {
    let hasErrors = false;
    const updatedProducts = products.map(product => {
      const errors: ProductWithState['errors'] = {};
      
      if (!product.title.trim()) {
        errors.title = "Title is required";
        hasErrors = true;
      }
      if (!product.description.trim()) {
        errors.description = "Description is required";
        hasErrors = true;
      }
      if (!product.category) {
        errors.category = "Category is required";
        hasErrors = true;
      }
      if (!product.condition) {
        errors.condition = "Condition is required";
        hasErrors = true;
      }
      if (!product.usedPrice || product.usedPrice <= 0) {
        errors.usedPrice = "Price is required";
        hasErrors = true;
      }

      return { ...product, errors };
    });

    setProducts(updatedProducts);

    if (hasErrors) {
      // Find first error and scroll to it
      const firstErrorIndex = updatedProducts.findIndex(p => Object.keys(p.errors).length > 0);
      if (firstErrorIndex !== -1) {
        cardRefs.current[firstErrorIndex]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      
      toast({
        title: "Validation Error",
        description: "Please complete all required fields marked with *",
        variant: "destructive",
      });
    }

    return !hasErrors;
  };

  const handlePublishAll = async () => {
    if (!validateProducts()) {
      return;
    }

    // Show location modal first if no location selected
    if (!selectedLocation) {
      setShowLocationModal(true);
      return;
    }

    setIsPublishing(true);
    setPublishingProgress({
      current: 0,
      total: products.length,
      status: products.map(p => ({ title: p.title, status: 'waiting' as const }))
    });

    try {
      const listings = products.map(product => ({
        title: product.title,
        description: product.description,
        price: String(product.usedPrice || 0),
        category: product.category,
        condition: product.condition,
        location: selectedLocation?.location || "Local Area",
        images: product.imageUrls,
        // Include all location data
        ...selectedLocation,
      }));

      console.log('📋 Prepared listings for batch publish:', {
        count: listings.length,
        sample: listings[0],
        allListings: listings
      });

      // Simulate publishing progress for visual feedback
      for (let i = 0; i < products.length; i++) {
        setPublishingProgress(prev => prev ? {
          ...prev,
          current: i + 1,
          status: prev.status.map((s, idx) => ({
            ...s,
            status: idx < i ? 'completed' : idx === i ? 'publishing' : 'waiting'
          }))
        } : null);
        
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Generate a unique batch ID for this publish session
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const batchTitle = `Batch Upload - ${new Date().toLocaleDateString()}`;
      
      console.log('🏷️ Generated batch ID:', batchId);
      console.log('🚀 Calling batch API with listings:', listings);
      
      // Get fresh auth token for batch publish
      const token = await getToken();
      console.log('🔑 Auth token obtained for batch publish:', token ? 'Token present' : 'No token');
      
      const response = await fetch('/api/listings/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          listings,
          batchId,
          batchTitle 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Batch publish failed:', response.status, errorText);
        throw new Error(`Failed to publish listings: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      console.log('✅ Batch publish successful:', {
        created: result.created,
        listings: result.listings?.map((l: any) => ({ id: l.id, title: l.title })),
        errors: result.errors
      });
      
      // Determine actual count of created listings with fallback (use ?? to respect 0)
      const actualCreatedCount = result.created ?? result.listings?.length ?? products.length;
      
      await queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/listings/mine'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/listings/draft-folders'] });
      
      // Update all to completed
      setPublishingProgress(prev => prev ? {
        ...prev,
        current: products.length,
        status: prev.status.map(s => ({ ...s, status: 'completed' as const }))
      } : null);

      // Show success modal or error toast
      setTimeout(() => {
        setIsPublishing(false);
        setPublishingProgress(null);
        
        if (actualCreatedCount > 0) {
          const hasErrors = result.errors && result.errors.length > 0;
          const partialSuccess = hasErrors && actualCreatedCount < products.length;
          
          // Extract listing IDs, titles, and batchId from the response
          const listingIds = result.listings?.map((l: any) => String(l.id)) || [];
          const listingTitles = result.listings?.map((l: any) => l.title) || [];
          const responseBatchId = result.batchId || null;
          
          console.log('📋 Extracted listing data for modal:', { listingIds, listingTitles, batchId: responseBatchId });
          
          // Show partial success toast if some failed
          if (partialSuccess) {
            toast({
              title: "Partial Success",
              description: `Created ${actualCreatedCount} of ${products.length} listings. Some items failed to publish.`,
            });
          }
          
          // Clear localStorage backup after successful publish
          console.log('🧺 Clearing bulkProducts backup after successful publish');
          localStorage.removeItem('bulkProducts_backup');
          localStorage.removeItem('bulkProducts_timestamp');
          
          // Show success modal with shareable links
          setSuccessListingIds(listingIds);
          setSuccessListingTitles(listingTitles);
          setSuccessBatchId(responseBatchId);
          setShowSuccessModal(true);
        } else {
          // All creates failed
          toast({
            title: "Error",
            description: "Failed to create any listings. Please try again.",
            variant: "destructive",
          });
        }
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Batch publish error:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        cause: error?.cause
      });
      
      toast({
        title: "Error",
        description: error?.message || "Failed to publish items. Please try again.",
        variant: "destructive",
      });
      setIsPublishing(false);
      setPublishingProgress(null);
    }
  };

  const handleSaveDrafts = () => {
    // Open the Folder Selection Modal
    setShowFolderModal(true);
  };

  const handleSaveDraftsToFolder = async (folderId: string, folderName: string) => {
    // No validation needed for drafts - save as-is
    setIsPublishing(true);
    setPublishingProgress({
      current: 0,
      total: products.length,
      status: products.map(p => ({ title: p.title || 'Untitled', status: 'waiting' as const }))
    });

    try {
      const listings = products.map(product => ({
        title: product.title,
        description: product.description,
        price: String(product.usedPrice || 0),
        category: product.category,
        condition: product.condition,
        location: selectedLocation?.location || "Local Area",
        images: product.imageUrls,
        // Include all location data
        ...selectedLocation,
      }));

      console.log('📋 Prepared listings for batch draft save:', {
        count: listings.length,
        sample: listings[0],
      });

      // Simulate saving progress for visual feedback
      for (let i = 0; i < products.length; i++) {
        setPublishingProgress(prev => prev ? {
          ...prev,
          current: i + 1,
          status: prev.status.map((s, idx) => ({
            ...s,
            status: idx < i ? 'completed' : idx === i ? 'publishing' : 'waiting'
          }))
        } : null);
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log('🚀 Calling batch API with status: draft');
      
      const token = await getToken();
      
      const response = await fetch('/api/listings/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          listings,
          status: 'draft', // Save as drafts
          folderId, // Link to folder
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Batch draft save failed:', response.status, errorText);
        throw new Error(`Failed to save drafts: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      console.log('✅ Batch draft save successful:', {
        created: result.created,
        listings: result.listings?.map((l: any) => ({ id: l.id, title: l.title })),
        errors: result.errors
      });
      
      const actualCreatedCount = result.created ?? result.listings?.length ?? products.length;
      
      console.log(`✅ Saved ${actualCreatedCount} drafts to folder "${folderName}" (${folderId})`);
      
      await queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/listings/mine'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/listings/draft-folders'] });
      
      // Update all to completed
      setPublishingProgress(prev => prev ? {
        ...prev,
        current: products.length,
        status: prev.status.map(s => ({ ...s, status: 'completed' as const }))
      } : null);

      setTimeout(() => {
        setIsPublishing(false);
        setPublishingProgress(null);
        
        if (actualCreatedCount > 0) {
          // Clear localStorage backup after successful save
          console.log('🧺 Clearing bulkProducts backup after successful draft save');
          localStorage.removeItem('bulkProducts_backup');
          localStorage.removeItem('bulkProducts_timestamp');
          
          toast({
            title: "Drafts Saved!",
            description: `Successfully saved ${actualCreatedCount} item${actualCreatedCount > 1 ? 's' : ''} to "${folderName}" folder.`,
          });
          
          // Redirect to Dashboard with drafts filter
          setLocation('/dashboard?filter=draft');
        } else {
          toast({
            title: "Error",
            description: "Failed to save any drafts. Please try again.",
            variant: "destructive",
          });
        }
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Batch draft save error:', error);
      
      toast({
        title: "Error",
        description: error?.message || "Failed to save drafts. Please try again.",
        variant: "destructive",
      });
      setIsPublishing(false);
      setPublishingProgress(null);
    }
  };

  // Publishing Progress Modal
  if (publishingProgress) {
    const progress = publishingProgress.total > 0 
      ? (publishingProgress.current / publishingProgress.total) * 100 
      : 0;

    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Publishing Your Items...
            </DialogTitle>
            <DialogDescription>
              Creating your listings, please wait...
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {publishingProgress.status.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-2 text-sm"
                >
                  {item.status === 'completed' && (
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                  {item.status === 'publishing' && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                  )}
                  {item.status === 'waiting' && (
                    <div className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-muted" />
                  )}
                  <span className={cn(
                    item.status === 'completed' && "text-green-600",
                    item.status === 'publishing' && "font-medium",
                    item.status === 'waiting' && "text-muted-foreground"
                  )}>
                    Item {idx + 1}: {item.status === 'completed' ? 'Published' : item.status === 'publishing' ? 'Publishing...' : 'Waiting...'}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header Section */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          {/* Prominent CTA for generating remaining items */}
          {products.some(p => !p.isAIGenerated) && onUpgradeRemaining && (
            <Card className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 border-blue-400 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2 text-white">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Sparkles className="h-6 w-6 animate-pulse" />
                      You Have Credits! Generate Remaining Items?
                    </h2>
                    <p className="text-blue-50 text-sm">
                      {products.filter(p => !p.isAIGenerated).length} item{products.filter(p => !p.isAIGenerated).length > 1 ? 's' : ''} waiting for AI-powered descriptions
                    </p>
                  </div>
                  <Button
                    onClick={onUpgradeRemaining}
                    size="lg"
                    variant="secondary"
                    className="flex-shrink-0 bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-lg"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <PartyPopper className="h-6 w-6 text-primary" />
                    Great! We found {totalCount} item{totalCount > 1 ? 's' : ''} in your photos
                  </h1>
                  <p className="text-muted-foreground">
                    Review each item below and publish when ready
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-sm font-medium">
                      Progress: {reviewedCount}/{totalCount} items reviewed
                    </span>
                    <Progress 
                      value={(reviewedCount / totalCount) * 100} 
                      className="w-32 h-2"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSaveDrafts}
                    disabled={isPublishing || products.length === 0}
                    size="lg"
                    className="flex-shrink-0"
                    data-testid="button-save-drafts-header"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Drafts
                  </Button>
                  <Button
                    onClick={handlePublishAll}
                    disabled={isPublishing}
                    size="lg"
                    className="flex-shrink-0"
                    data-testid="button-publish-all-header"
                  >
                    Publish All {totalCount} Item{totalCount > 1 ? 's' : ''}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scrollable Item Cards */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {products.map((product, index) => (
          <Card 
            key={index}
            ref={el => cardRefs.current[index] = el}
            data-testid={`item-card-${index}`}
            className={cn(
              "transition-all duration-300 hover:shadow-lg",
              product.isReviewed && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
              Object.keys(product.errors).length > 0 && "border-red-500/50"
            )}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">
                    Item {index + 1} of {totalCount}
                  </span>
                  {product.isAIGenerated ? (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700" data-testid={`badge-ai-${index}`}>
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200" data-testid={`badge-manual-${index}`}>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Manual Entry
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`review-${index}`}
                      checked={product.isReviewed}
                      onCheckedChange={() => toggleReview(index)}
                      data-testid={`checkbox-review-${index}`}
                    />
                    <Label 
                      htmlFor={`review-${index}`} 
                      className="text-sm font-medium cursor-pointer"
                    >
                      {product.isReviewed ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          Reviewed
                        </span>
                      ) : (
                        "Mark as reviewed"
                      )}
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteProduct(index)}
                    data-testid={`button-delete-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid lg:grid-cols-[200px,1fr] gap-6">
                {/* Image Preview with Navigation */}
                <div className="space-y-2">
                  <div 
                    className="relative aspect-square rounded-lg overflow-hidden border-2 hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => {
                      const imgIdx = currentImageIndex[index] || 0;
                      setEnlargedImage(product.imageUrls[imgIdx]);
                      setEnlargedImageIndex(imgIdx);
                      setEnlargedProductIndex(index);
                    }}
                  >
                    <img 
                      src={product.imageUrls[currentImageIndex[index] || 0]} 
                      alt={`Item ${index + 1}`}
                      className="w-full h-full object-cover"
                      data-testid={`image-${index}`}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="h-8 w-8 text-white" />
                    </div>
                    
                    {/* Navigation Arrows */}
                    {product.imageUrls.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentIdx = currentImageIndex[index] || 0;
                            const newIdx = currentIdx > 0 ? currentIdx - 1 : product.imageUrls.length - 1;
                            setCurrentImageIndex(prev => ({ ...prev, [index]: newIdx }));
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentIdx = currentImageIndex[index] || 0;
                            const newIdx = currentIdx < product.imageUrls.length - 1 ? currentIdx + 1 : 0;
                            setCurrentImageIndex(prev => ({ ...prev, [index]: newIdx }));
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                  {product.imageUrls.length > 1 && (
                    <p className="text-xs text-muted-foreground text-center">
                      {(currentImageIndex[index] || 0) + 1} / {product.imageUrls.length} images
                    </p>
                  )}
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>AI-Generated Details</span>
                    </div>
                    {!product.isAIGenerated && onUpgradeRemaining && (
                      <Button
                        onClick={onUpgradeRemaining}
                        size="sm"
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Buy Credits
                      </Button>
                    )}
                  </div>
                  
                  {/* Inline Credit Purchase Prompt for Manual Entry Items */}
                  {!product.isAIGenerated && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            {userCredits && userCredits.creditsRemaining > 0 
                              ? `You have ${userCredits.creditsRemaining} AI credits remaining`
                              : 'Your first 5 free AI generations have been used (0 remaining)'}
                          </p>
                          <p className="text-xs text-blue-800 dark:text-blue-200 font-semibold">
                            Why use AI descriptions?
                          </p>
                          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 ml-4">
                            <li>• Save hours of writing time - generate in seconds</li>
                            <li>• Boost search visibility with SEO-optimized keywords and meta-tags</li>
                            <li>• Get discovered on Google and other search engines</li>
                            <li>• Professional descriptions that sell faster</li>
                            <li>• Only $0.10 per item - cheaper than your time!</li>
                          </ul>
                          <div className="flex gap-2 pt-2">
                            {onUpgradeRemaining && (
                              <Button
                                onClick={onUpgradeRemaining}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Buy 50 Credits - $4.99
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {}}
                            >
                              Enter Details Manually
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`title-${index}`} className="flex items-center gap-1">
                      Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`title-${index}`}
                      value={product.title}
                      onChange={(e) => updateProduct(index, 'title', e.target.value)}
                      className={cn(product.errors.title && "border-red-500")}
                      data-testid={`input-title-${index}`}
                    />
                    {product.errors.title && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {product.errors.title}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`description-${index}`} className="flex items-center gap-1">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id={`description-${index}`}
                      value={product.description}
                      onChange={(e) => updateProduct(index, 'description', e.target.value)}
                      rows={3}
                      className={cn(product.errors.description && "border-red-500")}
                      data-testid={`input-description-${index}`}
                    />
                    {product.errors.description && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {product.errors.description}
                      </p>
                    )}
                  </div>

                  {/* Category & Condition */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor={`category-${index}`} className="flex items-center gap-1">
                        Category <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={product.category} 
                        onValueChange={(value) => updateProduct(index, 'category', value)}
                      >
                        <SelectTrigger 
                          id={`category-${index}`} 
                          data-testid={`select-category-${index}`}
                          className={cn(product.errors.category && "border-red-500")}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {product.errors.category && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {product.errors.category}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`condition-${index}`} className="flex items-center gap-1">
                        Condition <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={product.condition} 
                        onValueChange={(value) => updateProduct(index, 'condition', value)}
                      >
                        <SelectTrigger 
                          id={`condition-${index}`} 
                          data-testid={`select-condition-${index}`}
                          className={cn(product.errors.condition && "border-red-500")}
                        >
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
                      {product.errors.condition && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {product.errors.condition}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor={`retail-${index}`}>Retail Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id={`retail-${index}`}
                          type="number"
                          value={product.retailPrice || ''}
                          onChange={(e) => updateProduct(index, 'retailPrice', parseFloat(e.target.value) || 0)}
                          className="pl-7"
                          data-testid={`input-retail-${index}`}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`used-${index}`} className="flex items-center gap-1">
                        Your Price <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id={`used-${index}`}
                          type="number"
                          value={product.usedPrice || ''}
                          onChange={(e) => updateProduct(index, 'usedPrice', parseFloat(e.target.value) || 0)}
                          className={cn("pl-7", product.errors.usedPrice && "border-red-500")}
                          data-testid={`input-price-${index}`}
                        />
                      </div>
                      {product.errors.usedPrice && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {product.errors.usedPrice}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags (optional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, tagIdx) => (
                        <Badge 
                          key={tagIdx} 
                          variant="secondary"
                          className="gap-1"
                          data-testid={`tag-${index}-${tagIdx}`}
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(index, tag)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <div className="flex gap-1">
                        <Input
                          value={newTag[index] || ''}
                          onChange={(e) => setNewTag(prev => ({ ...prev, [index]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag(index);
                            }
                          }}
                          placeholder="Add tag..."
                          className="h-7 w-24 text-xs"
                          data-testid={`input-tag-${index}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addTag(index)}
                          className="h-7 px-2"
                          data-testid={`button-add-tag-${index}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Upgrade Section - Shows if there are items without AI */}
      {(() => {
        const itemsWithAI = products.filter(p => p.isAIGenerated);
        const itemsWithoutAI = products.filter(p => !p.isAIGenerated);
        const PRICE_PER_ITEM = 0.20;
        const totalCost = (itemsWithoutAI.length * PRICE_PER_ITEM).toFixed(2);
        
        if (itemsWithoutAI.length === 0) return null;
        
        return (
          <div className="max-w-5xl mx-auto px-4 py-8">
            <Card className="bg-gradient-to-br from-blue-50 via-blue-100/50 to-indigo-50 dark:from-blue-950/30 dark:via-blue-900/20 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800">
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground" data-testid="text-upgrade-title">
                      AI Description Upgrade
                    </h2>
                    <p className="text-lg text-green-600 dark:text-green-400 font-semibold">
                      ✓ Your First {itemsWithAI.length} Items Were Free!
                    </p>
                  </div>

                  {/* Remaining Items Count */}
                  <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-center text-lg">
                      You have <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">{itemsWithoutAI.length}</span> items remaining without AI-generated descriptions.
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="bg-white/80 dark:bg-gray-900/60 rounded-lg p-6 border-2 border-blue-300 dark:border-blue-700">
                    <h3 className="font-semibold text-xl mb-3 text-center">Complete Pricing:</h3>
                    <p className="text-center text-lg mb-4">
                      {itemsWithoutAI.length} remaining items × ${PRICE_PER_ITEM.toFixed(2)} = <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">${totalCost}</span>
                    </p>
                    
                    {/* Benefits List */}
                    <div className="mt-6 space-y-3">
                      <h4 className="font-semibold text-lg text-center mb-4">What You Get:</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {[
                          'Professional product titles',
                          'Detailed descriptions (2-3 sentences)',
                          'Accurate category assignment',
                          'Smart price suggestions (retail & used)',
                          'Condition assessment',
                          'SEO-optimized keywords & tags',
                          'Save 30+ minutes of manual work',
                          'Higher quality listings = more sales'
                        ].map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                      onClick={onUpgradeRemaining}
                      size="lg"
                      className="w-full mt-6 h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      data-testid="button-upgrade-all"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Complete All {itemsWithoutAI.length} Items with AI - ${totalCost}
                    </Button>
                  </div>

                  {/* Manual Option */}
                  <p className="text-center text-sm text-muted-foreground">
                    Or continue filling manually (free)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-20">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isPublishing}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Photos
            </Button>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDrafts}
                disabled={isPublishing || products.length === 0}
                data-testid="button-save-drafts"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Drafts
              </Button>
              <Button
                onClick={handlePublishAll}
                disabled={isPublishing || products.length === 0}
                size="lg"
                data-testid="button-publish-all"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish All {totalCount} Item{totalCount > 1 ? 's' : ''}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Enlargement Dialog */}
      <Dialog open={enlargedImage !== null} onOpenChange={() => setEnlargedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>
              {products[enlargedProductIndex]?.imageUrls.length > 1 && (
                <span>
                  Image {enlargedImageIndex + 1} of {products[enlargedProductIndex]?.imageUrls.length}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {enlargedImage && (
            <div className="relative w-full max-h-[70vh] group">
              <img 
                src={enlargedImage} 
                alt="Enlarged preview" 
                className="w-full h-full object-contain"
                style={{
                  transform: `rotate(${(products[enlargedProductIndex]?.imageRotations?.[enlargedImageIndex] || 0)}deg)`
                }}
              />
              
              {/* Navigation Arrows for Fullscreen */}
              {products[enlargedProductIndex]?.imageUrls.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      const product = products[enlargedProductIndex];
                      const newIdx = enlargedImageIndex > 0 
                        ? enlargedImageIndex - 1 
                        : product.imageUrls.length - 1;
                      setEnlargedImageIndex(newIdx);
                      setEnlargedImage(product.imageUrls[newIdx]);
                      setCurrentImageIndex(prev => ({ ...prev, [enlargedProductIndex]: newIdx }));
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-3 transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => {
                      const product = products[enlargedProductIndex];
                      const newIdx = enlargedImageIndex < product.imageUrls.length - 1 
                        ? enlargedImageIndex + 1 
                        : 0;
                      setEnlargedImageIndex(newIdx);
                      setEnlargedImage(product.imageUrls[newIdx]);
                      setCurrentImageIndex(prev => ({ ...prev, [enlargedProductIndex]: newIdx }));
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-3 transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          )}  
          <DialogFooter className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => {
                const product = products[enlargedProductIndex];
                const currentRotations = product.imageRotations || [];
                const currentRotation = currentRotations[enlargedImageIndex] || 0;
                const newRotation = (currentRotation + 90) % 360;
                const newRotations = [...currentRotations];
                newRotations[enlargedImageIndex] = newRotation;
                
                // Update the product's rotation data
                const updatedProducts = [...products];
                updatedProducts[enlargedProductIndex] = {
                  ...product,
                  imageRotations: newRotations,
                };
                setProducts(updatedProducts);
              }}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Rotate 90°
            </Button>
            <Button onClick={() => setEnlargedImage(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal with Social Sharing */}
      <ListingSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setLocation('/dashboard');
        }}
        listingIds={successListingIds}
        listingTitles={successListingTitles}
        batchId={successBatchId || undefined}
      />

      {/* Folder Selection Modal */}
      <FolderSelectionModal
        open={showFolderModal}
        onOpenChange={setShowFolderModal}
        onSave={handleSaveDraftsToFolder}
      />

      <SimpleLocationModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
        onSave={(locationData) => {
          setSelectedLocation(locationData);
          setShowLocationModal(false);
          // Trigger publish after location is set
          setTimeout(() => {
            handlePublishAll();
          }, 100);
        }}
      />
    </div>
  );
}
