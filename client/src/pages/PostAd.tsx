import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/AuthContext";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ListingFeeModal } from "@/components/ListingFeeModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertListingSchema } from "@shared/schema";

const formSchema = insertListingSchema.omit({ userId: true });

export default function PostAd() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isSignedIn, isLoaded } = useAuth();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{[key: string]: boolean}>({});
  const [userEditedFields, setUserEditedFields] = useState<Set<string>>(new Set());
  const [showListingFeeModal, setShowListingFeeModal] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [pendingListingData, setPendingListingData] = useState<z.infer<typeof formSchema> | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "0",
      category: "",
      condition: "new",
      location: "",
      images: [],
      tags: [],
    },
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema> & { paymentIntentId?: string }) => {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create listing');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
      toast({
        title: "Success!",
        description: "Your listing has been posted successfully.",
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  const analyzeImage = async (imageUrl: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
        credentials: 'include',
      });

      if (response.ok) {
        const analysis = await response.json();
        
        // Auto-populate form fields with AI suggestions (only if user hasn't edited them)
        const currentTitle = form.getValues('title');
        if (analysis.title && !currentTitle && !userEditedFields.has('title')) {
          form.setValue('title', analysis.title);
          setAiSuggestions(prev => ({ ...prev, title: true }));
        }
        
        const currentDescription = form.getValues('description');
        if (analysis.description && !currentDescription && !userEditedFields.has('description')) {
          form.setValue('description', analysis.description);
          setAiSuggestions(prev => ({ ...prev, description: true }));
        }
        
        const currentCategory = form.getValues('category');
        if (analysis.category && !currentCategory && !userEditedFields.has('category')) {
          form.setValue('category', analysis.category);
          setAiSuggestions(prev => ({ ...prev, category: true }));
        }
        
        const currentPrice = form.getValues('price');
        if (analysis.usedPrice && (!currentPrice || currentPrice === '0') && !userEditedFields.has('price')) {
          // Explicitly coerce to string to ensure type consistency
          form.setValue('price', String(analysis.usedPrice));
          setAiSuggestions(prev => ({ ...prev, price: true }));
        }
        
        const currentCondition = form.getValues('condition');
        if (analysis.condition && !userEditedFields.has('condition')) {
          form.setValue('condition', analysis.condition);
          setAiSuggestions(prev => ({ ...prev, condition: true }));
        }
        
        // Auto-populate tags if provided by AI
        if (analysis.tags && analysis.tags.length > 0 && !userEditedFields.has('tags')) {
          form.setValue('tags', analysis.tags);
          setAiSuggestions(prev => ({ ...prev, tags: true }));
        }

        // Show toast only if we got useful analysis data
        if (analysis.title) {
          toast({
            title: "AI Analysis Complete!",
            description: `Detected: ${analysis.title}. Review and edit the suggested details.`,
          });
        } else {
          toast({
            title: "AI Analysis Complete!",
            description: "Review and edit the suggested details.",
          });
        }
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      // Fail gracefully - don't show error to user
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);

        const uploadResponse = await fetch('/api/images/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const { imageUrl } = await uploadResponse.json();
        uploadedUrls.push(imageUrl);
      }

      const allImages = [...uploadedImages, ...uploadedUrls];
      setUploadedImages(allImages);
      form.setValue('images', allImages);

      // Analyze the first uploaded image to auto-populate listing details
      if (uploadedUrls.length > 0 && uploadedImages.length === 0) {
        analyzeImage(uploadedUrls[0]);
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    form.setValue('images', newImages);
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const listingPrice = parseFloat(data.price);
    
    // Check if listing fee is required (items >= $50)
    if (listingPrice >= 50) {
      // Show payment modal
      setPendingListingData(data);
      setShowListingFeeModal(true);
    } else {
      // No fee required, create listing directly
      createListingMutation.mutate(data);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    if (pendingListingData) {
      // Create listing with payment intent ID
      createListingMutation.mutate({
        ...pendingListingData,
        paymentIntentId,
      });
      setPendingListingData(null);
      setPaymentIntentId(null);
    }
  };

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation('/sign-in');
    }
  }, [isLoaded, isSignedIn, setLocation]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Post Your Ad</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  disabled={isUploading}
                />
                <label htmlFor="images" className="cursor-pointer">
                  {isUploading || isAnalyzing ? (
                    <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {isUploading ? "Uploading..." : isAnalyzing ? "AI is analyzing your item..." : "Click to upload images or drag and drop"}
                  </p>
                </label>
              </div>
              
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => removeImage(index)}
                        data-testid={`button-remove-image-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Title *
                    {aiSuggestions.title && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Suggestion
                      </Badge>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. iPhone 13 Pro Max - 256GB"
                      data-testid="input-title"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setUserEditedFields(prev => new Set(prev).add('title'));
                        if (aiSuggestions.title) {
                          setAiSuggestions(prev => ({ ...prev, title: false }));
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Description *
                    {aiSuggestions.description && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Suggestion
                      </Badge>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your item in detail..."
                      className="min-h-32"
                      data-testid="input-description"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setUserEditedFields(prev => new Set(prev).add('description'));
                        if (aiSuggestions.description) {
                          setAiSuggestions(prev => ({ ...prev, description: false }));
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Price ($) *
                      {aiSuggestions.price && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Suggestion
                        </Badge>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        data-testid="input-price"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setUserEditedFields(prev => new Set(prev).add('price'));
                          if (aiSuggestions.price) {
                            setAiSuggestions(prev => ({ ...prev, price: false }));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Category *
                      {aiSuggestions.category && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Suggestion
                        </Badge>
                      )}
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setUserEditedFields(prev => new Set(prev).add('category'));
                        if (aiSuggestions.category) {
                          setAiSuggestions(prev => ({ ...prev, category: false }));
                        }
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Clothing">Clothing</SelectItem>
                        <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                        <SelectItem value="Sports & Outdoors">Sports & Outdoors</SelectItem>
                        <SelectItem value="Books & Media">Books & Media</SelectItem>
                        <SelectItem value="Toys & Games">Toys & Games</SelectItem>
                        <SelectItem value="Automotive">Automotive</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Condition *
                      {aiSuggestions.condition && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Suggestion
                        </Badge>
                      )}
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setUserEditedFields(prev => new Set(prev).add('condition'));
                        if (aiSuggestions.condition) {
                          setAiSuggestions(prev => ({ ...prev, condition: false }));
                        }
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-condition">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="like-new">Like New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. San Francisco, CA"
                        data-testid="input-location"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags Field */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Tags
                    {aiSuggestions.tags && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Suggested
                      </Badge>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. book, mystery, cozy, fiction (comma-separated)"
                      data-testid="input-tags"
                      value={field.value?.join(', ') || ''}
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                        field.onChange(tags);
                        setUserEditedFields(prev => new Set(prev).add('tags'));
                      }}
                      onFocus={() => setUserEditedFields(prev => new Set(prev).add('tags'))}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Add keywords to help buyers find your item
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setLocation('/')}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-secondary hover:bg-secondary"
                data-testid="button-submit-ad"
                disabled={createListingMutation.isPending}
              >
                {createListingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Ad'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>

      {/* Listing Fee Payment Modal */}
      <ListingFeeModal
        open={showListingFeeModal}
        onClose={() => {
          setShowListingFeeModal(false);
          setPendingListingData(null);
        }}
        onPaymentSuccess={handlePaymentSuccess}
        listingPrice={pendingListingData ? parseFloat(pendingListingData.price) : 0}
        listingTitle={pendingListingData?.title || ""}
      />
    </div>
  );
}
