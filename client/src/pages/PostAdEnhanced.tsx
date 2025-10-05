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
  SkipForward
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertListingSchema } from "@shared/schema";
import { ProgressModal } from "@/components/ProgressModal";
import { BulkItemReview } from "@/components/BulkItemReview";

const formSchema = insertListingSchema.omit({ userId: true });

interface PhotoAnalysis {
  score: number;
  lighting: { score: number; feedback: string };
  focus: { score: number; feedback: string };
  framing: { score: number; feedback: string };
  background: { score: number; feedback: string };
  overallFeedback: string;
  improvements: string[];
  tip: string;
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

export default function PostAdEnhanced() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [mode, setMode] = useState<"coached" | "simple">("coached");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [photoAnalyses, setPhotoAnalyses] = useState<PhotoAnalysis[]>([]);
  const [analyzingPhotos, setAnalyzingPhotos] = useState<boolean[]>([]);
  const [descriptionAnalysis, setDescriptionAnalysis] = useState<DescriptionAnalysis | null>(null);
  const [pricingAnalysis, setPricingAnalysis] = useState<PricingAnalysis | null>(null);
  const [isAnalyzingDescription, setIsAnalyzingDescription] = useState(false);
  const [isAnalyzingPricing, setIsAnalyzingPricing] = useState(false);
  const [qualityScore, setQualityScore] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{[key: string]: boolean}>({});
  const [userEditedFields, setUserEditedFields] = useState<Set<string>>(new Set());
  const [multiImageAnalysis, setMultiImageAnalysis] = useState<MultiImageAnalysis | null>(null);
  const [showMultiProductModal, setShowMultiProductModal] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);
  
  // Bulk upload states
  const [showBulkReview, setShowBulkReview] = useState(false);
  const [bulkProducts, setBulkProducts] = useState<any[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [analyzedItems, setAnalyzedItems] = useState<any[]>([]);

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

  useEffect(() => {
    if (mode === "coached") {
      calculateQualityScore();
    }
  }, [watchedValues, photoAnalyses, descriptionAnalysis, pricingAnalysis, mode]);

  const calculateQualityScore = () => {
    let score = 0;
    let totalPossible = 100;

    if (uploadedImages.length > 0) {
      score += 15;
      if (uploadedImages.length >= 3) score += 10;
      if (photoAnalyses.length > 0) {
        const avgPhotoScore = photoAnalyses.reduce((sum, p) => sum + p.score, 0) / photoAnalyses.length;
        score += Math.round((avgPhotoScore / 100) * 20);
      }
    }

    if (watchedValues.title && watchedValues.title.length > 10) {
      score += 10;
      if (watchedValues.title.length > 30) score += 5;
    }

    if (descriptionAnalysis) {
      score += Math.round(descriptionAnalysis.score * 2);
    }

    if (watchedValues.price && parseFloat(watchedValues.price) > 0) {
      score += 10;
    }

    if (watchedValues.category) score += 5;
    if (watchedValues.condition) score += 5;
    if (watchedValues.location) score += 5;

    setQualityScore(Math.min(score, totalPossible));

    checkAchievements(score);
  };

  const checkAchievements = (score: number) => {
    const newAchievements: string[] = [];
    
    if (uploadedImages.length >= 5) newAchievements.push("Photographer Pro");
    if (photoAnalyses.some(p => p.score >= 90)) newAchievements.push("Perfect Shot");
    if (descriptionAnalysis && descriptionAnalysis.score >= 8) newAchievements.push("Master Wordsmith");
    if (score >= 90) newAchievements.push("Listing Legend");
    if (score === 100) newAchievements.push("Perfection Achieved!");
    
    if (JSON.stringify(newAchievements) !== JSON.stringify(achievements)) {
      setAchievements(newAchievements);
    }
  };

  const createListingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        body: JSON.stringify({ imageUrl }),
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

        if (mode === "coached") {
          analyzePhoto(file, uploadedImages.length + uploadedUrls.length);
        }
      }

      const allImages = [...uploadedImages, ...uploadedUrls];
      setUploadedImages(allImages);
      form.setValue('images', allImages);

      // Analyze ALL images to detect same product vs different products
      // Trigger on every upload to catch cases where user adds different products incrementally
      if (allImages.length > 0) {
        console.log(`🎯 Triggering multi-image AI analysis for ${allImages.length} total image(s)...`);
        analyzeMultipleImagesForAutopopulate(allImages);
      }
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
        body: JSON.stringify({ imageUrls }),
      });

      console.log('📥 Multi-image OpenAI API response status:', response.status);
      
      if (response.ok) {
        const analysis: MultiImageAnalysis = await response.json();
        console.log('✅ Multi-image OpenAI API response data:', analysis);
        
        setMultiImageAnalysis(analysis);
        setDetectionMessage(analysis.message || null);

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
          
          toast({
            title: "✓ Same Item Detected!",
            description: analysis.message || `Detected ${imageUrls.length} photos of the same item. Review and edit the suggested details.`,
          });
        } else {
          // Multiple different products detected - show modal
          console.log(`🔀 Multiple products detected (${analysis.products.length} items), showing modal...`);
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
        body: JSON.stringify({ imageUrls }),
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
    
    toast({
      title: "Feature Coming Soon",
      description: "Auto-creating multiple listings will be available soon. For now, please upload images for one product at a time.",
    });
    
    setShowMultiProductModal(false);
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
        const response = await fetch('/api/ai/analyze-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image: base64, photoNumber }),
          credentials: 'include',
        });

        if (response.ok) {
          const analysis = await response.json();
          setPhotoAnalyses(prev => {
            const newArr = [...prev];
            newArr[photoNumber - 1] = analysis;
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
    
    const newAnalyses = photoAnalyses.filter((_, i) => i !== index);
    setPhotoAnalyses(newAnalyses);
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
        />
      </>
    );
  }

  if (mode === "simple") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Post Your Ad</h2>
              <p className="text-sm text-muted-foreground mt-1">Simple mode - no coaching</p>
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
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. iPhone 13 Pro Max - 256GB"
                        data-testid="input-title"
                        {...field}
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
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your item in detail..."
                        className="min-h-32"
                        data-testid="input-description"
                        {...field}
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
                      <FormLabel>Price ($) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          data-testid="input-price"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
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
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="furniture">Furniture</SelectItem>
                          <SelectItem value="clothing">Clothing</SelectItem>
                          <SelectItem value="vehicles">Vehicles</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
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
                      <FormLabel>Condition *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  className="flex-1"
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
      </div>
    );
  }

  // COACHED MODE - Full AI experience
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header with Quality Score and Skip Button */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Smart Listing Coach
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered guidance to create the perfect listing
            </p>
          </div>
        </div>
        
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

      {/* Quality Score Card */}
      <Card className="mb-6 border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Listing Quality Score
              </CardTitle>
              <CardDescription>Real-time score as you build your listing</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{qualityScore}/100</div>
              <p className="text-xs text-muted-foreground">
                {qualityScore < 50 && "Getting started"}
                {qualityScore >= 50 && qualityScore < 75 && "Good progress"}
                {qualityScore >= 75 && qualityScore < 90 && "Almost there!"}
                {qualityScore >= 90 && "Excellent!"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={qualityScore} className="h-3 mb-3" />
          {achievements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {achievements.map((achievement, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  <Award className="h-3 w-3" />
                  {achievement}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Create Your Listing</CardTitle>
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
                          {isUploading ? "Uploading & Analyzing..." : "Upload Photos for AI Analysis"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Get instant feedback on lighting, focus, and composition
                        </p>
                      </label>
                    </div>

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
                                  Analyzing photo quality...
                                </div>
                              ) : photoAnalyses[index] ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-sm">Photo #{index + 1}</p>
                                    <Badge variant={photoAnalyses[index].score >= 75 ? "default" : "secondary"}>
                                      Score: {photoAnalyses[index].score}/100
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{photoAnalyses[index].overallFeedback}</p>
                                  {photoAnalyses[index].tip && (
                                    <div className="flex items-start gap-2 p-2 bg-primary/5 rounded text-xs">
                                      <Lightbulb className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                      <p><strong>Tip:</strong> {photoAnalyses[index].tip}</p>
                                    </div>
                                  )}
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
                              <SelectItem value="electronics">Electronics</SelectItem>
                              <SelectItem value="furniture">Furniture</SelectItem>
                              <SelectItem value="clothing">Clothing</SelectItem>
                              <SelectItem value="vehicles">Vehicles</SelectItem>
                              <SelectItem value="services">Services</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
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
                          Post Listing
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
              <div key={index} className="p-3 border rounded-lg">
                <p className="font-medium text-sm">Product {index + 1}: {product.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Images: {product.imageIndices.map(i => `#${i + 1}`).join(', ')}
                </p>
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

      {/* Progress Modal for Bulk Analysis */}
      <ProgressModal
        open={showProgressModal}
        currentIndex={bulkProgress.current}
        totalImages={bulkProgress.total}
        analyzedItems={analyzedItems}
      />
    </div>
  );
}
