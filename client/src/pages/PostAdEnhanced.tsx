import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@clerk/clerk-react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  X, 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  Award,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Star,
  Zap,
  Target,
  Trophy,
  Brain,
  DollarSign,
  Eye,
  Camera,
  FileText,
  SkipForward,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertListingSchema } from "@shared/schema";
import { ProgressModal } from "@/components/ProgressModal";
import { BulkItemReview } from "@/components/BulkItemReview";
import { QRUploadWidget } from "@/components/QRUploadWidget";

const formSchema = insertListingSchema.omit({ userId: true });

interface ProductIdentification {
  title: string;
  description: string;
  category: string;
  retailPrice: number;
  usedPrice: number;
  condition: string;
  confidence: number;
}

interface DescriptionAnalysis {
  score: number;
  strengths: string[];
  missingInfo: string[];
  wordCount: number;
  suggestions: string[];
  aiGeneratedDescription?: string;
}

interface PricingAnalysis {
  recommendedPrice: number;
  reasoning: string;
  marketData: {
    averagePrice: number;
    lowestPrice: number;
    highestPrice: number;
  };
  strategy: {
    sellFast: { price: number; reasoning: string };
    maximizeValue: { price: number; reasoning: string };
  };
  pricingTip: string;
}

interface DetectedProduct {
  imageIndices: number[];
  title: string;
  description: string;
  category: string;
  retailPrice: number;
  usedPrice: number;
  condition: string;
  confidence: number;
}

interface MultiImageAnalysis {
  scenario: "same_product" | "multiple_products";
  products: DetectedProduct[];
  message?: string;
}

interface AIUsageInfo {
  usesThisMonth: number;
  resetDate: Date;
  creditsPurchased: number;
  subscriptionTier: string;
  remainingFree: number;
}

export default function PostAdEnhanced() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  
  // Check if we're in edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const editListingId = urlParams.get('edit');
  const isEditMode = !!editListingId;
  
  const [mode, setMode] = useState<"coached" | "simple">("coached");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [productIdentifications, setProductIdentifications] = useState<ProductIdentification[]>([]);
  const [analyzingPhotos, setAnalyzingPhotos] = useState<boolean[]>([]);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [editedDetails, setEditedDetails] = useState<{title: string; description: string; usedPrice: string; retailPrice: string}>({
    title: "", description: "", usedPrice: "", retailPrice: ""
  });
  const [descriptionAnalysis, setDescriptionAnalysis] = useState<DescriptionAnalysis | null>(null);
  const [pricingAnalysis, setPricingAnalysis] = useState<PricingAnalysis | null>(null);
  const [isAnalyzingDescription, setIsAnalyzingDescription] = useState(false);
  const [isAnalyzingPricing, setIsAnalyzingPricing] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{[key: string]: boolean}>({});
  const [userEditedFields, setUserEditedFields] = useState<Set<string>>(new Set());
  const [multiImageAnalysis, setMultiImageAnalysis] = useState<MultiImageAnalysis | null>(null);
  const [showMultiProductModal, setShowMultiProductModal] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);
  const [isGeneratingBundle, setIsGeneratingBundle] = useState(false);
  
  // Bulk upload states
  const [showBulkReview, setShowBulkReview] = useState(false);
  const [bulkProducts, setBulkProducts] = useState<{
    title: string;
    description: string;
    category: string;
    retailPrice?: number;
    usedPrice?: number;
    condition: string;
    imageUrls: string[];
    imageIndices: number[];
  }[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [analyzedItems, setAnalyzedItems] = useState<{
    index: number;
    title: string;
    status: 'completed' | 'analyzing' | 'waiting';
  }[]>([]);
  
  // Opt-in AI analysis states
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Fetch AI usage info
  const { data: aiUsage } = useQuery<AIUsageInfo>({
    queryKey: ['/api/ai/usage'],
    enabled: isSignedIn && isLoaded,
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [aiAnalysisStartTime, setAiAnalysisStartTime] = useState<number | null>(null);
  
  // Per-photo form data for simple mode
  const [perPhotoData, setPerPhotoData] = useState<Array<{
    title: string;
    description: string;
    category: string;
    condition: string;
    price: string;
  }>>([]);
  
  // Category-first upload flow states
  const [uploadStep, setUploadStep] = useState<"category-selection" | "upload-ready">("upload-ready");
  const [manualCategory, setManualCategory] = useState<string>("");
  const [uploadType, setUploadType] = useState<"different-items" | "one-item" | "lot-collection" | "">(""); 

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
    },
  });

  const watchedValues = form.watch();

  // Fetch existing listing if in edit mode
  const { data: existingListing, isLoading: isLoadingListing } = useQuery({
    queryKey: ['/api/listings', editListingId],
    queryFn: async () => {
      if (!editListingId) return null;
      console.log('🔍 FETCHING LISTING ID:', editListingId);
      const token = await getToken();
      const response = await fetch(`/api/listings/${editListingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        console.error('❌ FETCH FAILED:', response.status, response.statusText);
        throw new Error('Failed to fetch listing');
      }
      const data = await response.json();
      console.log('✅ RAW API RESPONSE:', data);
      // API returns {listing: {...}, seller: {...}} so extract just the listing
      return data.listing || data;
    },
    enabled: isEditMode && !!editListingId,
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (existingListing && isEditMode) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔄 PRE-POPULATING FORM - EDIT MODE');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📦 Existing Listing Data:', existingListing);
      console.log('  ├─ Title:', existingListing.title);
      console.log('  ├─ Description:', existingListing.description?.substring(0, 50) + '...');
      console.log('  ├─ Price:', existingListing.price);
      console.log('  ├─ Category:', existingListing.category);
      console.log('  ├─ Condition:', existingListing.condition);
      console.log('  ├─ Location:', existingListing.location);
      console.log('  └─ Images:', existingListing.images?.length || 0, 'photos');
      
      const formData = {
        title: existingListing.title || "",
        description: existingListing.description || "",
        price: String(existingListing.price || "0"),
        category: existingListing.category || "",
        condition: existingListing.condition || "new",
        location: existingListing.location || "",
        images: existingListing.images || [],
      };
      
      console.log('📝 Form Data Being Applied:', formData);
      form.reset(formData);
      setUploadedImages(existingListing.images || []);
      
      console.log('✅ Form.reset() called successfully');
      console.log('✅ Images state updated');
      console.log('═══════════════════════════════════════════════════════');
    }
  }, [existingListing, isEditMode]);

  // Countdown timer effect
  useEffect(() => {
    if (showProgressModal && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showProgressModal, countdown]);

  // Calculate estimated time based on number of photos
  const calculateEstimatedTime = (photoCount: number): number => {
    if (photoCount === 1) return 22;
    if (photoCount === 2) return 30;
    if (photoCount === 3) return 35;
    if (photoCount <= 9) return 22 + (photoCount * 4);
    return 22 + (photoCount * 6); // 10+ photos
  };

  // Format countdown display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `0:${secs.toString().padStart(2, '0')}`;
  };

  const createListingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const token = await getToken();
      const url = isEditMode ? `/api/listings/${editListingId}` : '/api/listings';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} listing`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/listings'] });
      toast({
        title: "Success!",
        description: isEditMode ? "Your listing has been updated successfully." : "Your listing has been posted successfully.",
      });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditMode ? 'update' : 'post'} listing. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const analyzeImageForAutopopulate = async (imageUrl: string) => {
    console.log('🔍 analyzeImageForAutopopulate() called with imageUrl:', imageUrl);
    setIsAnalyzingImage(true);
    try {
      const token = await getToken();
      console.log('🔑 Auth token obtained:', token ? 'Token present' : 'No token');
      
      console.log('📤 Calling /api/ai/analyze-image endpoint...');
      const response = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          imageUrl,
          manualCategory: manualCategory || undefined
        }),
      });

      console.log('📥 OpenAI API response status:', response.status);
      
      if (response.ok) {
        const analysis = await response.json();
        console.log('✅ OpenAI API response data:', analysis);
        
        // Auto-populate form fields with AI suggestions (only if user hasn't edited them)
        const currentTitle = form.getValues('title');
        if (analysis.title && !currentTitle && !userEditedFields.has('title')) {
          console.log('📝 Updating form field: title =', analysis.title);
          form.setValue('title', analysis.title);
          setAiSuggestions(prev => ({ ...prev, title: true }));
        }
        
        const currentDescription = form.getValues('description');
        if (analysis.description && !currentDescription && !userEditedFields.has('description')) {
          console.log('📝 Updating form field: description =', analysis.description.substring(0, 50) + '...');
          form.setValue('description', analysis.description);
          setAiSuggestions(prev => ({ ...prev, description: true }));
        }
        
        const currentCategory = form.getValues('category');
        if (analysis.category && !currentCategory && !userEditedFields.has('category')) {
          console.log('📝 Updating form field: category =', analysis.category);
          form.setValue('category', analysis.category);
          setAiSuggestions(prev => ({ ...prev, category: true }));
        }
        
        const currentPrice = form.getValues('price');
        if (analysis.usedPrice && (!currentPrice || currentPrice === '0') && !userEditedFields.has('price')) {
          console.log('📝 Updating form field: price =', analysis.usedPrice);
          // Explicitly coerce to string to ensure type consistency
          form.setValue('price', String(analysis.usedPrice));
          setAiSuggestions(prev => ({ ...prev, price: true }));
        }
        
        const currentCondition = form.getValues('condition');
        if (analysis.condition && !userEditedFields.has('condition')) {
          console.log('📝 Updating form field: condition =', analysis.condition);
          form.setValue('condition', analysis.condition);
          setAiSuggestions(prev => ({ ...prev, condition: true }));
        }

        console.log('✨ Form fields updated successfully');
        
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
      } else {
        const errorData = await response.text();
        console.error('❌ OpenAI API error:', response.status, errorData);
      }
    } catch (error) {
      console.error("❌ Error analyzing image:", error);
      // Fail gracefully - don't show error to user
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    console.log('📤 Starting image upload for', files.length, 'files');
    setIsUploading(true);
    try {
      const token = await getToken();
      console.log('🔑 Auth token obtained for upload:', token ? 'Token present' : 'No token');
      
      const uploadedUrls: string[] = [];

      for (const file of files) {
        console.log('📁 Uploading file:', file.name, 'Size:', file.size, 'bytes');
        const formData = new FormData();
        formData.append('image', file);

        const uploadResponse = await fetch('/api/images/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        console.log('📥 Upload response status:', uploadResponse.status);
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('❌ Upload failed:', uploadResponse.status, errorText);
          throw new Error('Failed to upload image');
        }

        const { imageUrl } = await uploadResponse.json();
        console.log('✅ Image uploaded successfully:', imageUrl);
        uploadedUrls.push(imageUrl);

        // OPT-IN: Remove automatic photo analysis even in coached mode
      }

      const allImages = [...uploadedImages, ...uploadedUrls];
      setUploadedImages(allImages);
      form.setValue('images', allImages);
      
      // Initialize per-photo form data for simple mode
      if (mode === "simple") {
        const newPerPhotoData = allImages.map((_, index) => {
          // Preserve existing data if available, otherwise create new entry
          return perPhotoData[index] || {
            title: "",
            description: "",
            category: "",
            condition: "new",
            price: "0"
          };
        });
        setPerPhotoData(newPerPhotoData);
      }

      // OPT-IN: Don't automatically analyze images anymore
      // User must click "Auto-Generate Descriptions" button to start AI analysis
      console.log(`📤 Uploaded ${allImages.length} image(s). Waiting for user to opt-in to AI analysis.`);
    } catch (error) {
      console.error('❌ Image upload error:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeMultipleImagesForAutopopulate = async (imageUrls: string[]) => {
    console.log(`🔍 analyzeMultipleImagesForAutopopulate() called with ${imageUrls.length} image(s)`);
    
    // Use bulk processing for 4+ images
    if (imageUrls.length >= 4) {
      console.log('📦 Triggering bulk processing mode for', imageUrls.length, 'images');
      await analyzeBulkImages(imageUrls);
      return;
    }
    
    // Show progress modal with countdown for 1-3 images
    setShowProgressModal(true);
    setBulkProgress({ current: 0, total: imageUrls.length });
    setAnalyzedItems(imageUrls.map((_, i) => ({
      index: i + 1,
      title: '',
      status: 'waiting' as const
    })));
    
    // Use standard multi-image analysis for 1-3 images
    setIsAnalyzingImage(true);
    try {
      const token = await getToken();
      console.log('🔑 Auth token obtained:', token ? 'Token present' : 'No token');
      
      console.log('📤 Calling /api/ai/analyze-multiple-images endpoint...');
      const response = await fetch('/api/ai/analyze-multiple-images', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          imageUrls,
          manualCategory: manualCategory || undefined
        }),
      });

      console.log('📥 Multi-image OpenAI API response status:', response.status);
      
      if (response.ok) {
        const analysis: MultiImageAnalysis = await response.json();
        console.log('✅ Multi-image OpenAI API response data:', analysis);
        
        setMultiImageAnalysis(analysis);
        setDetectionMessage(analysis.message || null);

        // Update analyzed items to show completion
        setAnalyzedItems(imageUrls.map((_, i) => ({
          index: i + 1,
          title: i < analysis.products.length ? analysis.products[i].title : 'Unknown',
          status: 'completed' as const
        })));
        setBulkProgress({ current: imageUrls.length, total: imageUrls.length });

        // Wait a moment to show 100% completion
        await new Promise(resolve => setTimeout(resolve, 500));

        if (analysis.scenario === "same_product") {
          // Same product detected - auto-populate form with the product data
          const product = analysis.products[0];
          console.log('📦 Same product detected, auto-populating form fields...');
          
          const currentTitle = form.getValues('title');
          if (product.title && !currentTitle && !userEditedFields.has('title')) {
            console.log('📝 Updating form field: title =', product.title);
            form.setValue('title', product.title);
            setAiSuggestions(prev => ({ ...prev, title: true }));
          }
          
          const currentDescription = form.getValues('description');
          if (product.description && !currentDescription && !userEditedFields.has('description')) {
            console.log('📝 Updating form field: description =', product.description.substring(0, 50) + '...');
            form.setValue('description', product.description);
            setAiSuggestions(prev => ({ ...prev, description: true }));
          }
          
          const currentCategory = form.getValues('category');
          if (product.category && !currentCategory && !userEditedFields.has('category')) {
            console.log('📝 Updating form field: category =', product.category);
            form.setValue('category', product.category);
            setAiSuggestions(prev => ({ ...prev, category: true }));
          }
          
          const currentPrice = form.getValues('price');
          if (product.usedPrice && (!currentPrice || currentPrice === '0') && !userEditedFields.has('price')) {
            console.log('📝 Updating form field: price =', product.usedPrice);
            form.setValue('price', String(product.usedPrice));
            setAiSuggestions(prev => ({ ...prev, price: true }));
          }
          
          const currentCondition = form.getValues('condition');
          if (product.condition && !userEditedFields.has('condition')) {
            console.log('📝 Updating form field: condition =', product.condition);
            form.setValue('condition', product.condition);
            setAiSuggestions(prev => ({ ...prev, condition: true }));
          }

          console.log('✨ Form fields updated successfully for same product');
          
          // Hide progress modal and show success modal
          setShowProgressModal(false);
          setShowSuccessModal(true);
        } else {
          // Multiple different products detected - hide progress and show multi-product modal
          console.log(`🔀 Multiple products detected (${analysis.products.length} items), showing modal...`);
          setShowProgressModal(false);
          setShowMultiProductModal(true);
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Multi-image OpenAI API error:', response.status, errorData);
      }
    } catch (error) {
      console.error("❌ Error analyzing multiple images:", error);
      // Fail gracefully - don't show error to user
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Handler for "Auto-Generate Descriptions" button click
  const handleAutoGenerateClick = () => {
    if (uploadedImages.length === 0) {
      toast({
        title: "No Images",
        description: "Please upload at least one image before using AI analysis.",
        variant: "destructive",
      });
      return;
    }

    const estimated = calculateEstimatedTime(uploadedImages.length);
    setEstimatedTime(estimated);
    setShowWarningModal(true);
  };

  // Handler for when user confirms they want to use AI
  const handleConfirmAIAnalysis = () => {
    setShowWarningModal(false);
    setCountdown(estimatedTime);
    setAiAnalysisStartTime(Date.now());
    
    // Start the AI analysis
    analyzeMultipleImagesForAutopopulate(uploadedImages);
  };

  const analyzeBulkImages = async (imageUrls: string[]) => {
    console.log('📦 Starting bulk analysis for', imageUrls.length, 'images');
    
    // Initialize progress state
    setBulkProgress({ current: 0, total: imageUrls.length });
    setAnalyzedItems(imageUrls.map((_, i) => ({
      index: i + 1,
      title: '',
      status: 'waiting' as const
    })));
    setShowProgressModal(true);

    try {
      const token = await getToken();
      console.log('🔑 Auth token obtained for bulk analysis');
      
      // Simulate progressive updates (since we can't get real-time progress from the backend)
      // In a real implementation, you'd use WebSockets or polling
      const updateInterval = setInterval(() => {
        setBulkProgress(prev => {
          if (prev.current < prev.total) {
            const newCurrent = Math.min(prev.current + 1, prev.total);
            setAnalyzedItems(items => items.map((item, i) => {
              if (i < newCurrent - 1) return { ...item, status: 'completed' as const };
              if (i === newCurrent - 1) return { ...item, status: 'analyzing' as const };
              return item;
            }));
            return { ...prev, current: newCurrent };
          }
          return prev;
        });
      }, 2000); // Update every 2 seconds as simulation

      console.log('📤 Calling /api/ai/analyze-bulk-images endpoint...');
      const response = await fetch('/api/ai/analyze-bulk-images', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          imageUrls,
          manualCategory: manualCategory || undefined
        }),
      });

      clearInterval(updateInterval);

      if (response.ok) {
        const { products } = await response.json();
        console.log('✅ Bulk analysis complete:', products.length, 'products detected');
        
        // Update analyzed items with actual titles
        setAnalyzedItems(products.map((p: any, i: number) => ({
          index: i + 1,
          title: p.title,
          status: 'completed' as const
        })));
        setBulkProgress({ current: products.length, total: products.length });
        
        // Wait a moment to show completion, then hide modal and show bulk review
        setTimeout(() => {
          setShowProgressModal(false);
          setBulkProducts(products);
          setShowBulkReview(true);
        }, 1000);
      } else if (response.status === 403) {
        // Free tier limit reached
        const errorData = await response.json();
        setShowProgressModal(false);
        toast({
          title: "Free Tier Limit Reached",
          description: (
            <div className="space-y-2">
              <p>{errorData.message || "You've used all 5 free AI descriptions this month."}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLocation('/purchase-ai-credits')}
                className="mt-2"
                data-testid="button-purchase-credits"
              >
                Purchase More Credits - $2.99 for 25
              </Button>
            </div>
          ) as any,
          variant: "destructive",
        });
        console.log('❌ Free tier limit reached:', errorData);
      } else {
        clearInterval(updateInterval);
        const errorData = await response.text();
        console.error('❌ Bulk analysis error:', response.status, errorData);
        setShowProgressModal(false);
        toast({
          title: "Analysis Error",
          description: "Failed to analyze all images. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Error in bulk analysis:", error);
      setShowProgressModal(false);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze images. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOverrideAsSameProduct = () => {
    console.log('👤 User overriding AI detection - treating all images as same product');
    if (multiImageAnalysis && multiImageAnalysis.products.length > 0) {
      // Use the first detected product's data
      const product = multiImageAnalysis.products[0];
      
      const currentTitle = form.getValues('title');
      if (product.title && !currentTitle) {
        form.setValue('title', product.title);
        setAiSuggestions(prev => ({ ...prev, title: true }));
      }
      
      const currentDescription = form.getValues('description');
      if (product.description && !currentDescription) {
        form.setValue('description', product.description);
        setAiSuggestions(prev => ({ ...prev, description: true }));
      }
      
      const currentCategory = form.getValues('category');
      if (product.category && !currentCategory) {
        form.setValue('category', product.category);
        setAiSuggestions(prev => ({ ...prev, category: true }));
      }
      
      const currentPrice = form.getValues('price');
      if (product.usedPrice && (!currentPrice || currentPrice === '0')) {
        form.setValue('price', String(product.usedPrice));
        setAiSuggestions(prev => ({ ...prev, price: true }));
      }
      
      const currentCondition = form.getValues('condition');
      if (product.condition) {
        form.setValue('condition', product.condition);
        setAiSuggestions(prev => ({ ...prev, condition: true }));
      }

      setDetectionMessage(`All ${uploadedImages.length} photos treated as the same item (overridden)`);
      toast({
        title: "Understood!",
        description: "All photos will be used for this single listing.",
      });
    }
    setShowMultiProductModal(false);
  };

  const handleCreateSeparateListings = () => {
    console.log('🔀 User chose to create separate listings for each product');
    
    if (!multiImageAnalysis || multiImageAnalysis.products.length === 0) {
      toast({
        title: "Error",
        description: "No products detected to create separate listings.",
        variant: "destructive",
      });
      return;
    }

    // Convert multiImageAnalysis products to bulk products format
    const bulkProductsData = multiImageAnalysis.products.map(product => ({
      title: product.title,
      description: product.description,
      category: product.category,
      retailPrice: product.retailPrice,
      usedPrice: product.usedPrice,
      condition: product.condition,
      imageUrls: product.imageIndices.map(idx => uploadedImages[idx]),
      imageIndices: product.imageIndices
    }));

    console.log('📦 Prepared bulk products for separate listings:', bulkProductsData);

    // Show bulk review interface
    setBulkProducts(bulkProductsData);
    setShowBulkReview(true);
    setShowMultiProductModal(false);
  };

  const handleCreateBundleListing = async () => {
    console.log('🎁 User chose to create a bundle listing for all products');
    
    if (!multiImageAnalysis || multiImageAnalysis.products.length === 0) {
      toast({
        title: "Error",
        description: "No products detected to create a bundle.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingBundle(true);
      setShowMultiProductModal(false);
      
      // Show loading state
      toast({
        title: "Generating Bundle...",
        description: "AI is creating a multi-item listing summary...",
      });

      const token = await getToken();
      const response = await fetch('/api/ai/generate-bundle-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ products: multiImageAnalysis.products }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate bundle summary');
      }

      const bundleSummary = await response.json();
      console.log('✅ Bundle summary received:', bundleSummary);

      // Auto-fill the form with bundle data
      const currentTitle = form.getValues('title');
      if (!currentTitle) {
        form.setValue('title', bundleSummary.title);
        setAiSuggestions(prev => ({ ...prev, title: true }));
      }

      const currentDescription = form.getValues('description');
      if (!currentDescription) {
        form.setValue('description', bundleSummary.description);
        setAiSuggestions(prev => ({ ...prev, description: true }));
      }

      const currentCategory = form.getValues('category');
      if (bundleSummary.category && !currentCategory) {
        form.setValue('category', bundleSummary.category);
        setAiSuggestions(prev => ({ ...prev, category: true }));
      }

      const currentPrice = form.getValues('price');
      if (bundleSummary.suggestedBundlePrice && (!currentPrice || currentPrice === '0')) {
        form.setValue('price', String(bundleSummary.suggestedBundlePrice));
        setAiSuggestions(prev => ({ ...prev, price: true }));
      }

      setDetectionMessage(`Bundle listing created: ${multiImageAnalysis.products.length} items combined (Total value: $${bundleSummary.totalRetailValue})`);
      
      toast({
        title: "Bundle Created!",
        description: `AI generated a listing for ${multiImageAnalysis.products.length} items. Review and adjust as needed.`,
      });
    } catch (error) {
      console.error('❌ Error generating bundle:', error);
      toast({
        title: "Error",
        description: "Failed to generate bundle listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBundle(false);
    }
  };

  const handleSaveEditedDetails = () => {
    if (editingPhotoIndex !== null) {
      const originalProduct = productIdentifications[editingPhotoIndex];
      
      // Validate and parse prices with fallback to original values
      const usedPrice = editedDetails.usedPrice.trim() 
        ? parseFloat(editedDetails.usedPrice) 
        : originalProduct.usedPrice;
      const retailPrice = editedDetails.retailPrice.trim() 
        ? parseFloat(editedDetails.retailPrice) 
        : originalProduct.retailPrice;
      
      // Check for invalid numbers
      if (isNaN(usedPrice) || isNaN(retailPrice)) {
        toast({
          title: "Invalid Price",
          description: "Please enter valid numbers for prices.",
          variant: "destructive",
        });
        return;
      }
      
      const updated = [...productIdentifications];
      updated[editingPhotoIndex] = {
        ...updated[editingPhotoIndex],
        title: editedDetails.title.trim() || originalProduct.title,
        description: editedDetails.description.trim() || originalProduct.description,
        usedPrice,
        retailPrice,
      };
      setProductIdentifications(updated);
      setEditingPhotoIndex(null);
      toast({
        title: "Details Updated",
        description: "Product details have been saved successfully.",
      });
    }
  };

  const handleOpenEditDialog = (index: number) => {
    const product = productIdentifications[index];
    if (product) {
      setEditedDetails({
        title: product.title,
        description: product.description,
        usedPrice: product.usedPrice.toString(),
        retailPrice: product.retailPrice.toString(),
      });
      setEditingPhotoIndex(index);
    }
  };

  const analyzePhoto = async (file: File, photoNumber: number) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      
      setAnalyzingPhotos(prev => {
        const newArr = [...prev];
        newArr[photoNumber - 1] = true;
        return newArr;
      });

      try {
        const token = await getToken();
        const response = await fetch('/api/ai/analyze-photo', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ base64Image: base64, photoNumber }),
          credentials: 'include',
        });

        if (response.ok) {
          const productDetails = await response.json();
          setProductIdentifications(prev => {
            const newArr = [...prev];
            newArr[photoNumber - 1] = productDetails;
            return newArr;
          });
        }
      } catch (error) {
        console.error("Error analyzing photo:", error);
      } finally {
        setAnalyzingPhotos(prev => {
          const newArr = [...prev];
          newArr[photoNumber - 1] = false;
          return newArr;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const analyzeDescription = async () => {
    const { description, title, category } = watchedValues;
    if (!description || description.length < 10) return;

    setIsAnalyzingDescription(true);
    try {
      const response = await fetch('/api/ai/analyze-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, title, category }),
        credentials: 'include',
      });

      if (response.ok) {
        const analysis = await response.json();
        setDescriptionAnalysis(analysis);
      }
    } catch (error) {
      console.error("Error analyzing description:", error);
    } finally {
      setIsAnalyzingDescription(false);
    }
  };

  const analyzePricing = async () => {
    const { title, description, category, condition, price } = watchedValues;
    
    setIsAnalyzingPricing(true);
    try {
      const response = await fetch('/api/ai/analyze-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category, condition, userPrice: price }),
        credentials: 'include',
      });

      if (response.ok) {
        const analysis = await response.json();
        setPricingAnalysis(analysis);
      }
    } catch (error) {
      console.error("Error analyzing pricing:", error);
    } finally {
      setIsAnalyzingPricing(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    form.setValue('images', newImages);
    
    const newIdentifications = productIdentifications.filter((_, i) => i !== index);
    setProductIdentifications(newIdentifications);
  };

  const useAIDescription = () => {
    if (descriptionAnalysis?.aiGeneratedDescription) {
      form.setValue('description', descriptionAnalysis.aiGeneratedDescription);
      toast({
        title: "AI Description Applied",
        description: "Feel free to edit and personalize it!",
      });
    }
  };

  const applyPricingStrategy = (strategy: 'sellFast' | 'maximizeValue') => {
    if (pricingAnalysis) {
      const price = pricingAnalysis.strategy[strategy].price;
      form.setValue('price', price.toString());
      toast({
        title: "Price Updated",
        description: `Set to $${price} - ${pricingAnalysis.strategy[strategy].reasoning}`,
      });
    }
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createListingMutation.mutate(data);
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

  // Show loading state while fetching listing in edit mode
  if (isEditMode && isLoadingListing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading listing details...</p>
      </div>
    );
  }

  // Show bulk review UI if bulk processing completed
  if (showBulkReview && bulkProducts.length > 0) {
    return (
      <>
        <BulkItemReview 
          products={bulkProducts}
          onCancel={() => {
            setShowBulkReview(false);
            setBulkProducts([]);
            setUploadedImages([]);
          }}
        />
        <ProgressModal
          open={showProgressModal}
          currentIndex={bulkProgress.current}
          totalImages={bulkProgress.total}
          analyzedItems={analyzedItems}
          countdown={countdown}
          formatTime={formatTime}
          onClose={() => {
            setShowProgressModal(false);
            if (bulkProducts.length > 0) {
              setShowBulkReview(true);
            }
          }}
        />
      </>
    );
  }

  // Per-photo form submit handler for simple mode
  const handlePerPhotoSubmit = async (photoIndex: number) => {
    const data = perPhotoData[photoIndex];
    const location = form.getValues('location') || '';
    
    if (!data.title || !data.description || !data.category || !data.price || !location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          price: data.price,
          category: data.category,
          condition: data.condition,
          location: location,
          images: [uploadedImages[photoIndex]],
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create listing');
      }

      toast({
        title: "Success!",
        description: `Listing created for photo #${photoIndex + 1}`,
      });
      
      // Remove this photo and its data
      const newImages = uploadedImages.filter((_, i) => i !== photoIndex);
      const newPerPhotoData = perPhotoData.filter((_, i) => i !== photoIndex);
      setUploadedImages(newImages);
      setPerPhotoData(newPerPhotoData);
      
      // If no more photos, redirect to home
      if (newImages.length === 0) {
        setLocation('/');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (mode === "simple") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Your Listing' : 'Post Your Ad'}</h2>
              <p className="text-sm text-muted-foreground mt-1">{isEditMode ? 'Update listing details' : 'Manual entry - enter details for each photo'}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setMode("coached")}
              data-testid="button-switch-coached"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Enable AI Coaching
            </Button>
          </div>
          
          {/* Upload Section */}
            <div className="mb-6">
              <Label htmlFor="images" className="mb-3 block">Upload Photos</Label>
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
                  {isUploading ? (
                    <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {isUploading ? "Uploading..." : "Click to upload images or drag and drop"}
                  </p>
                </label>
              </div>
            </div>

            {/* Global Location Field */}
            {uploadedImages.length > 0 && (
              <div className="mb-6">
                <Label htmlFor="location">Location (for all listings) *</Label>
                <Input
                  id="location"
                  placeholder="e.g. San Francisco, CA"
                  value={form.watch('location')}
                  onChange={(e) => form.setValue('location', e.target.value)}
                  data-testid="input-location-global"
                />
              </div>
            )}

            {/* Per-Photo Forms */}
            {uploadedImages.map((imageUrl, photoIndex) => (
              <Card key={photoIndex} className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Photo #{photoIndex + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-6">
                    <div className="w-32 h-32 flex-shrink-0">
                      <img 
                        src={imageUrl} 
                        alt={`Photo ${photoIndex + 1}`} 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      {/* Title */}
                      <div>
                        <Label>Title *</Label>
                        <Input
                          placeholder="e.g. iPhone 13 Pro Max - 256GB"
                          value={perPhotoData[photoIndex]?.title || ''}
                          onChange={(e) => {
                            const newData = [...perPhotoData];
                            newData[photoIndex] = { 
                              ...(newData[photoIndex] || { category: '', condition: 'new', price: '0', title: '', description: '' }), 
                              title: e.target.value 
                            };
                            setPerPhotoData(newData);
                          }}
                          data-testid={`input-title-${photoIndex}`}
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <Label>Description *</Label>
                        <Textarea
                          placeholder="Describe your item in detail..."
                          className="min-h-24"
                          value={perPhotoData[photoIndex]?.description || ''}
                          onChange={(e) => {
                            const newData = [...perPhotoData];
                            newData[photoIndex] = { 
                              ...(newData[photoIndex] || { category: '', condition: 'new', price: '0', title: '', description: '' }), 
                              description: e.target.value 
                            };
                            setPerPhotoData(newData);
                          }}
                          data-testid={`input-description-${photoIndex}`}
                        />
                      </div>

                      {/* Category and Condition */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Category *</Label>
                          <Select 
                            value={perPhotoData[photoIndex]?.category || ''}
                            onValueChange={(value) => {
                              const newData = [...perPhotoData];
                              newData[photoIndex] = { 
                                ...(newData[photoIndex] || { category: '', condition: 'new', price: '0', title: '', description: '' }), 
                                category: value 
                              };
                              setPerPhotoData(newData);
                            }}
                          >
                            <SelectTrigger data-testid={`select-category-${photoIndex}`}>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Electronics">Electronics</SelectItem>
                              <SelectItem value="Furniture">Furniture</SelectItem>
                              <SelectItem value="Clothing">Clothing</SelectItem>
                              <SelectItem value="Automotive">Automotive</SelectItem>
                              <SelectItem value="Books & Media">Books & Media</SelectItem>
                              <SelectItem value="Sports">Sports</SelectItem>
                              <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                              <SelectItem value="Toys">Toys</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Condition *</Label>
                          <Select 
                            value={perPhotoData[photoIndex]?.condition || 'new'}
                            onValueChange={(value) => {
                              const newData = [...perPhotoData];
                              newData[photoIndex] = { 
                                ...(newData[photoIndex] || { category: '', condition: 'new', price: '0', title: '', description: '' }), 
                                condition: value 
                              };
                              setPerPhotoData(newData);
                            }}
                          >
                            <SelectTrigger data-testid={`select-condition-${photoIndex}`}>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="like-new">Like New</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="fair">Fair</SelectItem>
                              <SelectItem value="poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Price */}
                      <div>
                        <Label>Your Price ($) *</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={perPhotoData[photoIndex]?.price || ''}
                          onChange={(e) => {
                            const newData = [...perPhotoData];
                            newData[photoIndex] = { 
                              ...(newData[photoIndex] || { category: '', condition: 'new', price: '0', title: '', description: '' }), 
                              price: e.target.value 
                            };
                            setPerPhotoData(newData);
                          }}
                          data-testid={`input-price-${photoIndex}`}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handlePerPhotoSubmit(photoIndex)}
                          className="flex-1"
                          data-testid={`button-post-${photoIndex}`}
                        >
                          Post Listing #{photoIndex + 1}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeImage(photoIndex)}
                          data-testid={`button-remove-${photoIndex}`}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {uploadedImages.length === 0 && (
              <p className="text-center text-muted-foreground mt-8">
                Upload photos to start creating listings
              </p>
            )}
        </Card>
      </div>
    );
  }

  // COACHED MODE - Show category selection first, then upload UI
  if (mode === "coached" && uploadStep === "category-selection") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-primary" />
                {isEditMode ? 'Edit Your Listing' : 'What Are You Selling?'}
              </h1>
              <p className="text-muted-foreground mt-2">
                First, let's understand what you're uploading to provide the best experience
              </p>
            </div>

            {/* Step 1: Upload Type Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Step 1: What type of listing are you creating?</Label>
              <div className="grid gap-3">
                <Card 
                  className={`p-4 cursor-pointer hover-elevate ${uploadType === "different-items" ? "border-primary border-2" : ""}`}
                  onClick={() => setUploadType("different-items")}
                  data-testid="option-different-items"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${uploadType === "different-items" ? "border-primary" : "border-muted-foreground"}`}>
                      {uploadType === "different-items" && <div className="h-3 w-3 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Multiple photos of different items</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create separate listings for each item (e.g., selling 50 different car parts)
                      </p>
                    </div>
                  </div>
                </Card>

                <Card 
                  className={`p-4 cursor-pointer hover-elevate ${uploadType === "one-item" ? "border-primary border-2" : ""}`}
                  onClick={() => setUploadType("one-item")}
                  data-testid="option-one-item"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${uploadType === "one-item" ? "border-primary" : "border-muted-foreground"}`}>
                      {uploadType === "one-item" && <div className="h-3 w-3 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Multiple photos of ONE item</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Different angles of the same product (e.g., front, back, and side views)
                      </p>
                    </div>
                  </div>
                </Card>

                <Card 
                  className={`p-4 cursor-pointer hover-elevate ${uploadType === "lot-collection" ? "border-primary border-2" : ""}`}
                  onClick={() => setUploadType("lot-collection")}
                  data-testid="option-lot-collection"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${uploadType === "lot-collection" ? "border-primary" : "border-muted-foreground"}`}>
                      {uploadType === "lot-collection" && <div className="h-3 w-3 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">A collection/lot to sell together</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        One listing with all photos (e.g., a bundle of tools or a set of dishes)
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Step 2: Category Selection - Always show for all upload types */}
            {uploadType && (
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Step 2: Select category {uploadType === "different-items" ? "(required)" : "(optional)"}</Label>
                <p className="text-sm text-muted-foreground">
                  {uploadType === "different-items" 
                    ? "All uploaded items will be assigned to this category. You can adjust individual items later."
                    : "Manually select a category, or let AI auto-detect it from your photos."}
                </p>
                <Select value={manualCategory} onValueChange={setManualCategory}>
                  <SelectTrigger className="w-full" data-testid="select-manual-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="clothing">Clothing & Accessories</SelectItem>
                    <SelectItem value="automotive">Automotive (Cars, Parts, Tools)</SelectItem>
                    <SelectItem value="books">Books & Media</SelectItem>
                    <SelectItem value="sports">Sports & Outdoors</SelectItem>
                    <SelectItem value="home">Home & Garden</SelectItem>
                    <SelectItem value="toys">Toys & Games</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setLocation('/')}
                data-testid="button-cancel-category"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={!uploadType || (uploadType === "different-items" && !manualCategory)}
                onClick={() => {
                  if (uploadType === "different-items" && !manualCategory) {
                    toast({
                      title: "Category Required",
                      description: "Please select a category for your items.",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (!uploadType) {
                    toast({
                      title: "Selection Required",
                      description: "Please select the type of listing you're creating.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setUploadStep("upload-ready");
                }}
                data-testid="button-continue-to-upload"
              >
                Continue to Upload Photos →
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // COACHED MODE - Full AI experience (after category selection)
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header with Skip Button and Back to Category Selection */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              {isEditMode ? 'Edit Your Listing' : 'Smart Listing Coach'}
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered guidance to create the perfect listing
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setMode("simple")}
            data-testid="button-skip-coaching"
            className="gap-2"
          >
            <SkipForward className="h-4 w-4" />
            Skip to Simple Form
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{isEditMode ? 'Update Your Listing' : 'Create Your Listing'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* PHASE 1: Smart Photo Upload */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="h-5 w-5 text-primary" />
                      <Label className="text-lg font-semibold">Photos</Label>
                      {uploadedImages.length > 0 && (
                        <Badge variant="secondary">{uploadedImages.length} uploaded</Badge>
                      )}
                    </div>
                    
                    {/* Upload Options Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Traditional Upload */}
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover-elevate cursor-pointer">
                        <input
                          type="file"
                          id="coached-images"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          data-testid="input-images-coached"
                          disabled={isUploading}
                        />
                        <label htmlFor="coached-images" className="cursor-pointer">
                          {isUploading ? (
                            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                          ) : (
                            <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          )}
                          <p className="text-sm font-medium">
                            {isUploading ? "Uploading & Analyzing..." : "Upload Photos from Computer"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Click to browse or drag and drop images
                          </p>
                        </label>
                      </div>

                      {/* QR Code Upload */}
                      <QRUploadWidget
                        onImagesReceived={(imageUrls) => {
                          console.log('📲 Received images from QR upload:', imageUrls);
                          const allImages = [...uploadedImages, ...imageUrls];
                          setUploadedImages(allImages);
                          form.setValue('images', allImages);
                        }}
                      />
                    </div>

                    {/* Auto-Generate Descriptions Button */}
                    {uploadedImages.length > 0 && !isAnalyzingImage && (
                      <div className="mt-4 space-y-3">
                        {/* AI Usage Counter */}
                        {aiUsage && (
                          <Alert className={aiUsage.remainingFree === 0 ? "border-destructive/50 bg-destructive/5" : "border-primary/20"}>
                            <Sparkles className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              <div className="flex items-center justify-between">
                                <span>
                                  <strong>AI Descriptions:</strong> {aiUsage.usesThisMonth} of 5 used this month
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  Resets: {new Date(aiUsage.resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              {aiUsage.remainingFree > 0 && (
                                <div className="mt-1">
                                  <span className="text-primary font-medium">{aiUsage.remainingFree} free credits remaining</span>
                                </div>
                              )}
                              {aiUsage.remainingFree === 0 && (
                                <div className="mt-3 flex items-center gap-2">
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => setLocation('/purchase-ai-credits')}
                                    data-testid="button-upgrade-credits"
                                  >
                                    <Sparkles className="mr-2 h-3 w-3" />
                                    Purchase 25 AI Credits - $2.99
                                  </Button>
                                  <span className="text-xs text-muted-foreground">Credits never expire</span>
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Educational Info Box */}
                        <Alert className="border-primary/20 bg-primary/5">
                          <Sparkles className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            💡 Pro Tip: Using AI to generate descriptions creates higher quality product listings which lead to more successful sales. 
                            {uploadedImages.length >= 10 && " While it takes 1-2 minutes for 10 items, the improved descriptions are worth the wait!"}
                          </AlertDescription>
                        </Alert>

                        {/* Prominent CTA Button */}
                        <div className="border-2 border-primary/30 rounded-lg p-4 bg-gradient-to-br from-primary/5 to-primary/10">
                          <div className="text-center space-y-3">
                            <p className="font-medium">Photos uploaded ({uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''})</p>
                            <Button
                              type="button"
                              size="lg"
                              onClick={handleAutoGenerateClick}
                              className="w-full gap-2"
                              data-testid="button-auto-generate"
                              disabled={aiUsage && aiUsage.remainingFree === 0}
                            >
                              <Brain className="h-5 w-5" />
                              Auto-Generate Descriptions with AI
                            </Button>
                            <p className="text-sm text-muted-foreground">
                              Or enter details manually below ↓
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {uploadedImages.length > 0 && (
                      <div className="space-y-3 mt-4">
                        {uploadedImages.map((img, index) => (
                          <div key={index} className="flex gap-3 p-3 border rounded-lg">
                            <div className="relative w-24 h-24 rounded overflow-hidden flex-shrink-0">
                              <img src={img} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={() => removeImage(index)}
                                data-testid={`button-remove-image-${index}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {analyzingPhotos[index] ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  🔍 Searching for item and generating an automated description
                                </div>
                              ) : productIdentifications[index] ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="font-semibold text-sm">Photo #{index + 1}</p>
                                  </div>
                                  <p className="font-bold text-base">{productIdentifications[index].title}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{productIdentifications[index].description}</p>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="font-semibold text-primary">
                                      ${productIdentifications[index].usedPrice}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      (Retail: ${productIdentifications[index].retailPrice})
                                    </span>
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleOpenEditDialog(index)}
                                      data-testid={`button-edit-details-${index}`}
                                    >
                                      Edit Details
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">Photo #{index + 1}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Detection Message */}
                    {detectionMessage && (
                      <Alert className="mt-4" data-testid="alert-detection-message">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{detectionMessage}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Basic Fields */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. iPhone 13 Pro Max - 256GB, Like New"
                            data-testid="input-title-coached"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* PHASE 2: Description Coaching */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <Label className="text-lg font-semibold">Description *</Label>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={analyzeDescription}
                        disabled={isAnalyzingDescription || !watchedValues.description || watchedValues.description.length < 10}
                        data-testid="button-analyze-description"
                      >
                        {isAnalyzingDescription ? (
                          <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Analyzing...</>
                        ) : (
                          <><Brain className="h-3 w-3 mr-2" /> Analyze</>
                        )}
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your item in detail. Include size, color, condition, features, and why you're selling..."
                              className="min-h-32"
                              data-testid="input-description-coached"
                              {...field}
                            />
                          </FormControl>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                            <span>{watchedValues.description?.length || 0} characters</span>
                            <span>Optimal: 150-250 words</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {descriptionAnalysis && (
                      <Card className="border-primary/20">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">Strength Score</p>
                            <Badge variant={descriptionAnalysis.score >= 7 ? "default" : "secondary"}>
                              {descriptionAnalysis.score}/10
                            </Badge>
                          </div>

                          {descriptionAnalysis.missingInfo.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Consider adding:
                              </p>
                              <ul className="text-xs space-y-1">
                                {descriptionAnalysis.missingInfo.map((item, i) => (
                                  <li key={i} className="flex items-center gap-1">
                                    <span className="text-muted-foreground">•</span> {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {descriptionAnalysis.aiGeneratedDescription && (
                            <div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={useAIDescription}
                                data-testid="button-use-ai-description"
                              >
                                <Sparkles className="h-3 w-3 mr-2" />
                                Use AI-Enhanced Description
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Category and Condition */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Electronics">Electronics</SelectItem>
                              <SelectItem value="Furniture">Furniture</SelectItem>
                              <SelectItem value="Clothing">Clothing</SelectItem>
                              <SelectItem value="Automotive">Automotive</SelectItem>
                              <SelectItem value="Books & Media">Books & Media</SelectItem>
                              <SelectItem value="Sports">Sports</SelectItem>
                              <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                              <SelectItem value="Toys">Toys</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
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
                  </div>

                  {/* PHASE 3: Pricing Intelligence */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <Label className="text-lg font-semibold">Price ($) *</Label>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={analyzePricing}
                        disabled={isAnalyzingPricing || !watchedValues.title}
                        data-testid="button-analyze-pricing"
                      >
                        {isAnalyzingPricing ? (
                          <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Analyzing...</>
                        ) : (
                          <><TrendingUp className="h-3 w-3 mr-2" /> Get Price Suggestion</>
                        )}
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              data-testid="input-price-coached"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {pricingAnalysis && (
                      <Card className="border-primary/20">
                        <CardContent className="pt-4 space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-1">Recommended: ${pricingAnalysis.recommendedPrice}</p>
                            <p className="text-xs text-muted-foreground">{pricingAnalysis.reasoning}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => applyPricingStrategy('sellFast')}
                              className="text-xs"
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Sell Fast: ${pricingAnalysis.strategy.sellFast.price}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => applyPricingStrategy('maximizeValue')}
                              className="text-xs"
                            >
                              <Target className="h-3 w-3 mr-1" />
                              Max Value: ${pricingAnalysis.strategy.maximizeValue.price}
                            </Button>
                          </div>

                          {pricingAnalysis.pricingTip && (
                            <div className="flex items-start gap-2 p-2 bg-primary/5 rounded text-xs">
                              <Lightbulb className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                              <p>{pricingAnalysis.pricingTip}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Location */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. San Francisco, CA"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setLocation('/')}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={createListingMutation.isPending}
                      data-testid="button-submit-coached"
                    >
                      {createListingMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {isEditMode ? 'Update Listing' : 'Post Listing'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* PHASE 5: Seller Academy Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-primary/5 rounded-lg space-y-2">
                <p className="font-medium text-sm flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Photo Essentials
                </p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Use natural light near a window</li>
                  <li>• Clean, simple background</li>
                  <li>• Multiple angles (front, back, sides)</li>
                  <li>• Close-ups of details</li>
                  <li>• Include size reference</li>
                </ul>
              </div>

              <div className="p-3 bg-primary/5 rounded-lg space-y-2">
                <p className="font-medium text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description Must-Haves
                </p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Exact measurements/size</li>
                  <li>• Color and material</li>
                  <li>• Condition details</li>
                  <li>• Purchase date</li>
                  <li>• Reason for selling</li>
                </ul>
              </div>

              <div className="p-3 bg-primary/5 rounded-lg space-y-2">
                <p className="font-medium text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing Psychology
                </p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• $99 feels cheaper than $100</li>
                  <li>• Leave room for negotiation</li>
                  <li>• Research similar sold items</li>
                  <li>• Consider condition honestly</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Success Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Listings with 5+ photos</span>
                <span className="font-semibold">+67% views</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Detailed descriptions</span>
                <span className="font-semibold">+45% sales</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Competitive pricing</span>
                <span className="font-semibold">3x faster sale</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Multi-Product Detection Modal */}
      <Dialog open={showMultiProductModal} onOpenChange={setShowMultiProductModal}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-multi-product">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Multiple Items Detected
            </DialogTitle>
            <DialogDescription>
              {multiImageAnalysis?.message || 'We detected multiple different items in your photos.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Our AI detected {multiImageAnalysis?.products.length || 0} different product{(multiImageAnalysis?.products.length || 0) > 1 ? 's' : ''} in your uploaded images. How would you like to proceed?
            </p>
            
            {multiImageAnalysis?.products.map((product, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <p className="font-medium text-sm">Product {index + 1}: {product.title}</p>
                <p className="text-xs text-muted-foreground">
                  Images: {product.imageIndices.map(i => `#${i + 1}`).join(', ')} 
                  ({product.imageIndices.length} {product.imageIndices.length > 1 ? 'angles of same item' : 'photo'})
                </p>
                
                {/* Show thumbnails for this product */}
                <div className="flex gap-2 flex-wrap">
                  {product.imageIndices.map((imgIdx, thumbIdx) => (
                    <div key={thumbIdx} className="w-16 h-16 rounded border overflow-hidden">
                      <img 
                        src={uploadedImages[imgIdx]} 
                        alt={`${product.title} - Image ${imgIdx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button 
              variant="default" 
              onClick={handleCreateSeparateListings}
              className="w-full"
              data-testid="button-create-separate"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Create {multiImageAnalysis?.products.length || 0} Separate Listings
            </Button>
            <Button 
              variant="default" 
              onClick={handleCreateBundleListing}
              disabled={isGeneratingBundle}
              className="w-full"
              data-testid="button-create-bundle"
            >
              {isGeneratingBundle ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Create Bundle Listing
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleOverrideAsSameProduct}
              className="w-full"
              data-testid="button-override-same"
            >
              These Are All the Same Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Details Dialog */}
      <Dialog open={editingPhotoIndex !== null} onOpenChange={(open) => !open && setEditingPhotoIndex(null)}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-edit-product">
          <DialogHeader>
            <DialogTitle>Edit Product Details</DialogTitle>
            <DialogDescription>
              Update the AI-detected product information for Photo #{(editingPhotoIndex || 0) + 1}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editedDetails.title}
                onChange={(e) => setEditedDetails({...editedDetails, title: e.target.value})}
                placeholder="Product title"
                data-testid="input-edit-title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editedDetails.description}
                onChange={(e) => setEditedDetails({...editedDetails, description: e.target.value})}
                placeholder="Product description"
                rows={4}
                data-testid="input-edit-description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-used-price">Used Price ($)</Label>
                <Input
                  id="edit-used-price"
                  type="number"
                  value={editedDetails.usedPrice}
                  onChange={(e) => setEditedDetails({...editedDetails, usedPrice: e.target.value})}
                  placeholder="0.00"
                  step="0.01"
                  data-testid="input-edit-used-price"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-retail-price">Retail Price ($)</Label>
                <Input
                  id="edit-retail-price"
                  type="number"
                  value={editedDetails.retailPrice}
                  onChange={(e) => setEditedDetails({...editedDetails, retailPrice: e.target.value})}
                  placeholder="0.00"
                  step="0.01"
                  data-testid="input-edit-retail-price"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingPhotoIndex(null)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEditedDetails}
              data-testid="button-save-edit"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Modal for Bulk Analysis */}
      <ProgressModal
        open={showProgressModal}
        currentIndex={bulkProgress.current}
        totalImages={bulkProgress.total}
        analyzedItems={analyzedItems}
        countdown={countdown}
        formatTime={formatTime}
        onClose={() => {
          setShowProgressModal(false);
          if (bulkProducts.length > 0) {
            setShowBulkReview(true);
          }
        }}
      />
      
      {/* Warning Modal - Before AI starts */}
      <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-warning-ai">
          <DialogHeader>
            <DialogTitle>Use AI to Generate Descriptions?</DialogTitle>
            <DialogDescription>
              This will take approximately {estimatedTime} seconds for your {uploadedImages.length} photo{uploadedImages.length > 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Creates higher quality descriptions</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Leads to more successful sales</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Automatically fills title, description, category, and pricing</span>
            </div>
            <div className="text-sm text-muted-foreground mt-4 pt-4 border-t">
              You can always edit the AI-generated content after.
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowWarningModal(false)}
              data-testid="button-cancel-ai"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAIAnalysis}
              data-testid="button-confirm-ai"
            >
              Generate Descriptions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal - After AI completes */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-success-ai">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Descriptions Generated Successfully!
            </DialogTitle>
            <DialogDescription>
              Review and edit the AI-generated content below, then publish when ready.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button 
              onClick={() => setShowSuccessModal(false)}
              data-testid="button-success-ok"
              className="w-full"
            >
              OK, Let me Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
