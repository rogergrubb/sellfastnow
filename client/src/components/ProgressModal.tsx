import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Clock, Loader2, ImageIcon, Upload, Brain, FileEdit } from "lucide-react";

interface AnalyzedItem {
  index: number;
  title: string;
  status: 'completed' | 'analyzing' | 'waiting' | 'failed';
  imageUrl?: string;
}

export type ProcessingPhase = 'upload' | 'ai' | 'description' | 'complete';

interface ProgressModalProps {
  open: boolean;
  currentIndex: number;
  totalImages: number;
  analyzedItems: AnalyzedItem[];
  onClose?: () => void;
  countdown?: number;
  formatTime?: (seconds: number) => string;
  phase?: ProcessingPhase;
  phaseMessage?: string;
}

// Educational tips about AI, SEO, pricing, and selling
const PROCESSING_TIPS = [
  {
    icon: "🎯",
    title: "Smart Pricing Psychology",
    description: "Pricing at $99 instead of $100 can increase click-through rates by 20%. Round numbers suggest firm pricing, while precise amounts ($47) feel more negotiable and research-backed."
  },
  {
    icon: "🔍",
    title: "SEO-Optimized Keywords",
    description: "AI-generated descriptions include keywords buyers actually search for, making your items 3x more likely to appear in search results. More visibility = faster sales."
  },
  {
    icon: "📝",
    title: "Detailed Descriptions Sell Faster",
    description: "Listings with detailed descriptions sell 40% faster than vague ones. AI captures specific details like materials, dimensions, and condition that buyers want to know."
  },
  {
    icon: "🏷️",
    title: "Meta Tags Drive Discovery",
    description: "Proper meta tags help search engines categorize your items correctly. AI analyzes your product and assigns the most relevant tags automatically for maximum exposure."
  },
  {
    icon: "💡",
    title: "Professional Titles Matter",
    description: "Items with clear, descriptive titles get 60% more views. AI creates titles that include brand, condition, size, and key features - exactly what buyers search for."
  },
  {
    icon: "📊",
    title: "Accurate Categories = More Buyers",
    description: "Placing items in the right category increases visibility by 50%. AI analyzes your product and selects the most accurate category automatically."
  },
  {
    icon: "⚡",
    title: "Save 30+ Minutes Per Listing",
    description: "Writing quality descriptions manually takes time. AI generates professional product descriptions in seconds, letting you list items 10x faster."
  },
  {
    icon: "✨",
    title: "Higher Quality = More Sales",
    description: "Professional-looking listings build buyer trust. AI-generated content is consistent, detailed, and error-free - making your items look premium."
  },
  {
    icon: "🎨",
    title: "Condition Assessment Accuracy",
    description: "AI analyzes visible wear and tear to suggest accurate condition ratings (New, Like New, Good, Fair). Honest condition descriptions reduce returns and disputes."
  },
  {
    icon: "💰",
    title: "Smart Price Suggestions",
    description: "AI compares similar items to suggest both retail and used pricing. Price competitively from the start to sell faster and maximize your profit."
  },
  {
    icon: "⏱️",
    title: "Why Description Generation Takes Longer",
    description: "Creating detailed descriptions, meta tags, and SEO keywords requires more AI processing than basic image analysis. This extra time ensures your listings are professional, searchable, and optimized for sales."
  }
];

export function ProgressModal({ 
  open, 
  currentIndex, 
  totalImages, 
  analyzedItems, 
  onClose, 
  countdown = 0,
  formatTime,
  phase = 'upload',
  phaseMessage
}: ProgressModalProps) {
  const progress = totalImages > 0 ? (currentIndex / totalImages) * 100 : 0;
  const isComplete = progress === 100 && analyzedItems.every(item => item.status === 'completed');
  
  // Phase-specific configuration
  const phaseConfig = {
    upload: {
      title: "📤 Uploading Your Photos",
      icon: Upload,
      description: "Preparing images for AI analysis",
      color: "from-green-500 to-green-600"
    },
    ai: {
      title: "🔍 AI Analyzing Your Items",
      icon: Brain,
      description: "Detecting products and features",
      color: "from-blue-500 to-blue-600"
    },
    description: {
      title: "✍️ Generating Descriptions & Meta Tags",
      icon: FileEdit,
      description: "Creating detailed content for each item",
      color: "from-purple-500 to-purple-600"
    },
    complete: {
      title: "✅ Processing Complete",
      icon: CheckCircle2,
      description: "All items ready for review",
      color: "from-emerald-500 to-emerald-600"
    }
  };
  
  const currentPhaseConfig = phaseConfig[phase];

  // Educational tip rotation
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('opacity-100');

  // Reset tip when modal opens or phase changes
  useEffect(() => {
    if (open) {
      setCurrentTipIndex(0);
      setFadeClass('opacity-100');
    }
  }, [open, phase]);

  // Rotate tips every 6 seconds with fade animation
  useEffect(() => {
    if (!open || isComplete) return;
    
    const tipRotation = setInterval(() => {
      // Fade out
      setFadeClass('opacity-0');
      
      // Wait for fade out, then change tip and fade in
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % PROCESSING_TIPS.length);
        setFadeClass('opacity-100');
      }, 300);
      
    }, 6000); // 6 seconds per tip

    return () => clearInterval(tipRotation);
  }, [open, isComplete]);

  const currentTip = PROCESSING_TIPS[currentTipIndex];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-lg" 
        data-testid="dialog-progress"
        onInteractOutside={(e) => !isComplete && e.preventDefault()}
        onEscapeKeyDown={(e) => !isComplete && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">
            {currentPhaseConfig.title}
          </DialogTitle>
          <DialogDescription>
            {phaseMessage || `Processing ${currentIndex} of ${totalImages} items`}
          </DialogDescription>
        </DialogHeader>
        
        {/* 3-Phase Indicator */}
        <div className="flex items-center justify-center gap-1 py-2">
          {/* Phase 1: Upload */}
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-full text-xs transition-all ${
            phase === 'upload' 
              ? 'bg-primary text-primary-foreground' 
              : phase === 'ai' || phase === 'description' || phase === 'complete'
              ? 'bg-muted text-muted-foreground' 
              : 'bg-muted/50 text-muted-foreground/50'
          }`}>
            <Upload className="h-3 w-3" />
            <span className="hidden sm:inline">1. Upload</span>
            <span className="sm:hidden">1</span>
            {(phase === 'ai' || phase === 'description' || phase === 'complete') && (
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            )}
          </div>
          
          <div className="h-px w-4 bg-border" />
          
          {/* Phase 2: AI Analysis */}
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-full text-xs transition-all ${
            phase === 'ai' 
              ? 'bg-primary text-primary-foreground' 
              : phase === 'description' || phase === 'complete'
              ? 'bg-muted text-muted-foreground'
              : 'bg-muted/50 text-muted-foreground/50'
          }`}>
            <Brain className="h-3 w-3" />
            <span className="hidden sm:inline">2. Analysis</span>
            <span className="sm:hidden">2</span>
            {(phase === 'description' || phase === 'complete') && (
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            )}
          </div>
          
          <div className="h-px w-4 bg-border" />
          
          {/* Phase 3: Description Generation */}
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-full text-xs transition-all ${
            phase === 'description' 
              ? 'bg-primary text-primary-foreground' 
              : phase === 'complete'
              ? 'bg-muted text-muted-foreground'
              : 'bg-muted/50 text-muted-foreground/50'
          }`}>
            <FileEdit className="h-3 w-3" />
            <span className="hidden sm:inline">3. Descriptions</span>
            <span className="sm:hidden">3</span>
            {phase === 'complete' && (
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            )}
          </div>
        </div>
        
        <div className="space-y-6 py-4">
          {/* Sequential Linear Progress Bar */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {phase === 'upload' && `Uploading photo ${currentIndex} of ${totalImages}`}
                {phase === 'ai' && `Analyzing item ${currentIndex} of ${totalImages}`}
                {phase === 'description' && `Generating content for item ${currentIndex} of ${totalImages}`}
                {phase === 'complete' && `All ${totalImages} items complete`}
              </p>
            </div>
            
            {/* Linear Progress Bar with Percentage Inside */}
            <div className="relative w-full h-8 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ease-out flex items-center justify-center text-sm font-bold text-white bg-gradient-to-r ${currentPhaseConfig.color}`}
                style={{ width: `${Math.max(progress, 8)}%` }}
                data-testid="progress-bar"
              >
                <span className="relative z-10">{Math.round(progress)}%</span>
              </div>
            </div>
            
            <p className="text-center text-sm text-muted-foreground">
              {currentIndex} of {totalImages} {
                phase === 'upload' ? 'photos uploaded' 
                : phase === 'ai' ? 'items analyzed'
                : phase === 'description' ? 'descriptions generated'
                : 'items complete'
              }
            </p>
            
            {/* Phase 3 Explanation */}
            {phase === 'description' && (
              <div className="mt-4 p-3 bg-purple-500/10 border-l-4 border-purple-500 rounded text-sm">
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-purple-600 dark:text-purple-400">Most detailed phase:</strong> AI is writing professional titles, detailed descriptions, selecting categories, analyzing condition, suggesting prices, and creating SEO-optimized meta tags.
                </p>
              </div>
            )}
          </div>

          {/* Item Status List with Thumbnails */}
          <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3 bg-muted/30">
            {analyzedItems.map((item) => (
              <div 
                key={item.index} 
                className={`flex items-center gap-3 p-2 rounded-md transition-all ${
                  item.status === 'analyzing' ? 'bg-primary/10 animate-pulse' : ''
                }`}
                data-testid={`item-status-${item.index}`}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={`Item ${item.index}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>
                
                {/* Status Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.status === 'completed' && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{item.title}</span>
                      </>
                    )}
                    {item.status === 'analyzing' && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {phase === 'upload' ? 'Uploading...' 
                            : phase === 'ai' ? 'Analyzing...'
                            : phase === 'description' ? 'Generating...'
                            : 'Processing...'}
                        </span>
                      </>
                    )}
                    {item.status === 'waiting' && (
                      <>
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Waiting...</span>
                      </>
                    )}
                    {item.status === 'failed' && (
                      <>
                        <span className="text-sm text-destructive">Failed</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Item {item.index}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Educational Tips with Auto-Rotation */}
          <div 
            className={`p-6 bg-gradient-to-br from-primary/90 to-primary rounded-xl text-primary-foreground transition-opacity duration-300 ${fadeClass}`}
            data-testid="educational-tip"
          >
            <div className="text-center space-y-4">
              {/* Icon */}
              <div className="text-5xl" data-testid="tip-icon">
                {currentTip.icon}
              </div>
              
              {/* Content */}
              <div className="space-y-2">
                <h4 className="text-lg font-bold" data-testid="tip-title">
                  {currentTip.title}
                </h4>
                <p className="text-sm leading-relaxed opacity-95" data-testid="tip-description">
                  {currentTip.description}
                </p>
              </div>
              
              {/* Progress Indicators */}
              <div className="flex justify-center gap-2 pt-2" data-testid="tip-indicators">
                {PROCESSING_TIPS.map((_, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentTipIndex
                        ? 'w-6 h-2 bg-white'
                        : 'w-2 h-2 bg-white/40'
                    }`}
                    data-testid={`tip-dot-${index}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
