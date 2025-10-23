import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Image, Loader2, CheckCircle2, X, AlertCircle, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MobileUpload() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [sessionExpired, setSessionExpired] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const totalFiles = selectedFiles.length + newFiles.length;
    
    if (totalFiles > 24) {
      toast({
        title: "Too many images",
        description: `You can only upload up to 24 images per session. You have ${selectedFiles.length} selected.`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    // Create previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadedCount(0);

    try {
      const token = await getToken();
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to upload images.",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`/api/upload-session/${sessionId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 410) {
        setSessionExpired(true);
        toast({
          title: "Session Expired",
          description: "This upload session has expired. Please scan the QR code again on your desktop.",
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setUploadProgress(100);
      setUploadedCount(result.imageCount);
      
      toast({
        title: "Upload Successful!",
        description: `${selectedFiles.length} ${selectedFiles.length === 1 ? 'image' : 'images'} uploaded to your desktop.`,
      });

      // Clear selected files
      setSelectedFiles([]);
      setPreviews([]);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Wait for Clerk to finish loading before checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <LogIn className="h-6 w-6 text-primary" />
              <CardTitle>Sign In Required</CardTitle>
            </div>
            <CardDescription>
              You need to sign in to upload photos to your desktop session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              data-testid="button-sign-in"
              onClick={() => window.location.href = '/sign-in'}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Session Expired</CardTitle>
            </div>
            <CardDescription>
              This upload session has expired. Please return to your desktop and scan the QR code again to create a new session.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-6 w-6 text-primary" />
              Upload Photos to Desktop
            </CardTitle>
            <CardDescription>
              Take photos or select from your gallery. They'll appear on your desktop in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading || selectedFiles.length >= 24}
                data-testid="button-take-photo"
              >
                <Camera className="h-6 w-6" />
                <span className="text-sm">Take Photo</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || selectedFiles.length >= 24}
                data-testid="button-choose-gallery"
              >
                <Image className="h-6 w-6" />
                <span className="text-sm">From Gallery</span>
              </Button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            {/* Selected Images */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Selected: {selectedFiles.length} / 24
                  </p>
                  {selectedFiles.length >= 24 && (
                    <p className="text-xs text-muted-foreground">Maximum reached</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={preview}
                        alt={`Selected ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => handleRemoveFile(index)}
                        disabled={uploading}
                        data-testid={`button-remove-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Success Message */}
            {uploadedCount > 0 && !uploading && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Successfully uploaded {uploadedCount} {uploadedCount === 1 ? 'image' : 'images'} to desktop!
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="default"
                className="flex-1"
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || uploading}
                data-testid="button-upload"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2">
              Keep this page open until you see your photos on the desktop
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
