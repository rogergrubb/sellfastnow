import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { LocationInput, LocationData } from "@/components/LocationInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function LocationSetupPage() {
  const [location, setLocation] = useState<LocationData | undefined>();
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Auto-detect location on mount
  useEffect(() => {
    handleAutoDetect();
  }, []);

  const handleAutoDetect = async () => {
    setAutoDetecting(true);
    try {
      const response = await fetch('/api/location/detect');
      if (response.ok) {
        const data = await response.json();
        if (data.city && data.country) {
          setLocation({
            city: data.city,
            region: data.region || "",
            country: data.country,
            postalCode: data.postalCode || "",
            latitude: data.latitude,
            longitude: data.longitude,
            displayPrecision: 'city'
          });
          toast({
            title: "Location Detected",
            description: `We detected you're in ${data.city}, ${data.country}. You can change this if needed.`,
          });
        } else {
          toast({
            title: "Auto-detection unavailable",
            description: "Please enter your location manually.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error auto-detecting location:', error);
      toast({
        title: "Auto-detection failed",
        description: "Please enter your location manually.",
        variant: "destructive",
      });
    } finally {
      setAutoDetecting(false);
    }
  };

  const handleSave = async () => {
    if (!location || !location.city || !location.country) {
      toast({
        title: "Location Required",
        description: "Please enter at least your city and country.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/location', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(location),
      });

      if (response.ok) {
        toast({
          title: "Location Saved",
          description: "Your location has been set successfully!",
        });
        // Redirect to dashboard or home
        setLocation('/');
      } else {
        throw new Error('Failed to save location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Error",
        description: "Failed to save your location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Allow users to skip and set location later
    setLocation('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>📍 Set Your Location</CardTitle>
          <CardDescription>
            Help buyers find items near them. Your exact address is never shared publicly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationInput
            value={location}
            onChange={setLocation}
            onAutoDetect={handleAutoDetect}
            autoDetecting={autoDetecting}
            required
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={saving}
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !location?.city || !location?.country}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

