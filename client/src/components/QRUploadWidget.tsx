import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Smartphone, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QRUploadWidgetProps {
  onImagesReceived: (imageUrls: string[]) => void;
}

export function QRUploadWidget({ onImagesReceived }: QRUploadWidgetProps) {
  const { getToken } = useAuth();
  const { toast } = useToast();
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadUrl, setUploadUrl] = useState<string>("");
  const [imageCount, setImageCount] = useState(0);
  const [lastImageCount, setLastImageCount] = useState(0);
  const [polling, setPolling] = useState(false);

  // Create upload session
  useEffect(() => {
    let isMounted = true;

    const createSession = async () => {
      try {
        const token = await getToken();
        const response = await fetch("/api/upload-session/create", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to create session");
        }

        const session = await response.json();
        if (isMounted) {
          setSessionId(session.id);
          const baseUrl = window.location.origin;
          setUploadUrl(`${baseUrl}/mobile-upload/${session.id}`);
          setLoading(false);
          console.log('✅ QR Upload session created:', session.id);
        }
      } catch (error: any) {
        console.error("Error creating upload session:", error);
        if (isMounted) {
          setLoading(false);
          toast({
            title: "Error",
            description: "Failed to create upload session. Please refresh the page.",
            variant: "destructive",
          });
        }
      }
    };

    createSession();

    return () => {
      isMounted = false;
    };
  }, [getToken, toast]);

  // Poll for new images
  useEffect(() => {
    if (!sessionId) return;

    const pollInterval = setInterval(async () => {
      try {
        setPolling(true);
        const token = await getToken();
        const response = await fetch(`/api/upload-session/${sessionId}/images`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const newCount = data.images.length;
          
          if (newCount > lastImageCount) {
            // New images received!
            const newImages = data.images.slice(lastImageCount);
            console.log(`📲 Received ${newImages.length} new images from phone`);
            
            setImageCount(newCount);
            setLastImageCount(newCount);
            onImagesReceived(newImages);
            
            toast({
              title: "Photos Received!",
              description: `${newImages.length} ${newImages.length === 1 ? 'photo' : 'photos'} uploaded from your phone.`,
            });
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      } finally {
        setPolling(false);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [sessionId, lastImageCount, getToken, onImagesReceived, toast]);

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        // Cleanup session when component unmounts
        (async () => {
          try {
            const token = await getToken();
            await fetch(`/api/upload-session/${sessionId}`, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            });
          } catch (error) {
            console.error("Session cleanup error:", error);
          }
        })();
      }
    };
  }, [sessionId, getToken]);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!sessionId || !uploadUrl) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to create upload session.{" "}
              <Button variant="ghost" onClick={handleRefresh} className="p-0 h-auto underline">
                Refresh page
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="h-5 w-5 text-primary" />
          Upload from Phone
        </CardTitle>
        <CardDescription className="text-sm">
          Scan with your phone to upload photos from your camera or gallery
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code */}
        <div className="flex justify-center p-3 bg-white rounded-md">
          <QRCodeSVG value={uploadUrl} size={120} level="M" />
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground text-center">
          <p>Scan with phone camera → Tap notification → Select photos</p>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <div className="flex items-center gap-2 text-muted-foreground">
            {polling ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : imageCount > 0 ? (
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            ) : (
              <div className="h-3 w-3 rounded-full border-2 border-muted-foreground" />
            )}
            <span className="text-xs">
              {imageCount > 0 ? `${imageCount} photos received` : "Waiting for uploads..."}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-7 text-xs"
            data-testid="button-qr-refresh"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            New Code
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Session expires in 30 minutes
        </p>
      </CardContent>
    </Card>
  );
}
