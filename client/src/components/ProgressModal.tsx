import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Loader2, ImageIcon, Upload, Brain } from "lucide-react";

interface AnalyzedItem {
  index: number;
  title: string;
  status: 'completed' | 'analyzing' | 'waiting' | 'failed';
  imageUrl?: string;
}

export type ProcessingPhase = 'upload' | 'ai' | 'complete';

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
      description: "Preparing images for AI analysis"
    },
    ai: {
      title: "🤖 AI Analyzing Your Items",
      icon: Brain,
      description: "Generating descriptions and pricing"
    },
    complete: {
      title: "✅ Processing Complete",
      icon: CheckCircle2,
      description: "All items ready for review"
    }
  };
  
  const currentPhaseConfig = phaseConfig[phase];

  // Phase-specific processing tips
  const uploadTips = [
    "High-quality images upload faster and look better",
    "Multiple angles help AI understand your product",
    "Clear photos lead to better AI descriptions",
    "Well-lit images get more buyer attention"
  ];
  
  const aiTips = [
    "AI-generated descriptions help items sell 40% faster",
    "Quality descriptions increase buyer confidence",
    "Professional listings get 3x more views", 
    "Accurate pricing attracts serious buyers",
    "AI detects details you might miss",
    "Save hours of manual description writing"
  ];

  const processingTips = phase === 'upload' ? uploadTips : aiTips;
  const [currentTip, setCurrentTip] = useState(processingTips[0]);
  const [startTime, setStartTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(countdown);

  // Reset start time when modal opens or phase changes
  useEffect(() => {
    if (open) {
      setStartTime(Date.now());
      setTimeRemaining(countdown);
      setCurrentTip(processingTips[0]); // Reset tip when phase changes
    }
  }, [open, countdown, phase]);

  // Rotate tips every 5 seconds
  useEffect(() => {
    if (!open || isComplete) return;
    
    const tipRotation = setInterval(() => {
      setCurrentTip(prev => {
        const currentIndex = processingTips.indexOf(prev);
        return processingTips[(currentIndex + 1) % processingTips.length];
      });
    }, 5000);

    return () => clearInterval(tipRotation);
  }, [open, isComplete, processingTips]);

  // Accurate time calculation based on actual processing speed
  useEffect(() => {
    if (!open || isComplete) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const completedItems = analyzedItems.filter(item => item.status === 'completed').length;
      
      if (completedItems > 0) {
        // Calculate average time per item based on actual processing
        const avgTimePerItem = elapsed / completedItems;
        const remainingItems = totalImages - completedItems;
        const estimated = Math.max(0, Math.round(avgTimePerItem * remainingItems));
        setTimeRemaining(estimated);
      } else {
        // Before any items complete, use initial estimate
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [open, isComplete, analyzedItems, totalImages, startTime]);

  // Calculate circular progress for countdown ring based on items completed
  const circumference = 2 * Math.PI * 45; // radius = 45
  const completedFraction = totalImages > 0 ? currentIndex / totalImages : 0;
  const progressOffset = circumference * (1 - completedFraction);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

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
        
        {/* Phase Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
            phase === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <Upload className="h-4 w-4" />
            <span>1. Upload</span>
            {phase !== 'upload' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          </div>
          
          <div className="h-px w-8 bg-border" />
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
            phase === 'ai' ? 'bg-primary text-primary-foreground' : phase === 'complete' ? 'bg-muted text-muted-foreground' : 'bg-muted/50 text-muted-foreground/50'
          }`}>
            <Brain className="h-4 w-4" />
            <span>2. AI Analysis</span>
            {phase === 'complete' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          </div>
        </div>
        
        <div className="space-y-6 py-4">
          {/* Circular Countdown Timer */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90">
                {/* Background circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted-foreground/20"
                />
                {/* Progress circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  className="text-primary transition-all duration-500 ease-linear"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold tabular-nums">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
                <span className="text-xs text-muted-foreground">remaining</span>
              </div>
            </div>
          </div>

          {/* Linear Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-3" data-testid="progress-bar" />
            </div>
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
                        <span className="text-sm font-medium">Analyzing...</span>
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

          {/* Rotating Tip */}
          <div className="p-4 bg-accent/30 rounded-lg border">
            <div className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentTip}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
