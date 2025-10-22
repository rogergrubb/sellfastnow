import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Shield, Mail, User, Phone, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PhoneVerificationModal } from "@/components/PhoneVerificationModal";

export default function Settings() {
  const { toast } = useToast();
  const { getToken } = useAuth();
  
  // Profile Information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  
  // Location
  const [locationInput, setLocationInput] = useState("");
  const [locationData, setLocationData] = useState<any>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingLocations, setSearchingLocations] = useState(false);
  
  // Contact Preferences
  const [contactEmail, setContactEmail] = useState("");
  const [contactPreference, setContactPreference] = useState("in_app");
  const [showEmailPublicly, setShowEmailPublicly] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sharePhoneWhen, setSharePhoneWhen] = useState("never");
  const [shareEmailWhen, setShareEmailWhen] = useState("after_acceptance");
  
  // Privacy Settings
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [showLastActive, setShowLastActive] = useState(true);
  const [showItemsSold, setShowItemsSold] = useState(true);
  const [allowMessagesFrom, setAllowMessagesFrom] = useState("verified");
  const [requireVerifiedToContact, setRequireVerifiedToContact] = useState(true);
  
  // Meeting Preferences
  const [preferredMeetingLocations, setPreferredMeetingLocations] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [willingToShip, setWillingToShip] = useState(false);
  const [shippingFeeAmount, setShippingFeeAmount] = useState("");
  
  // Phone verification modal
  const [isPhoneVerificationModalOpen, setIsPhoneVerificationModalOpen] = useState(false);

  // Fetch current settings
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Load settings when data is fetched
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName || "");
      setLastName(currentUser.lastName || "");
      setBio(currentUser.bio || "");
      setContactEmail(currentUser.contactEmail || "");
      setContactPreference(currentUser.contactPreference || "in_app");
      setShowEmailPublicly(currentUser.showEmailPublicly || false);
      setPhoneNumber(currentUser.phoneNumber || "");
      setSharePhoneWhen(currentUser.sharePhoneWhen || "never");
      setShareEmailWhen(currentUser.shareEmailWhen || "after_acceptance");
      setProfileVisibility(currentUser.profileVisibility || "public");
      setShowLastActive(currentUser.showLastActive ?? true);
      setShowItemsSold(currentUser.showItemsSold ?? true);
      setAllowMessagesFrom(currentUser.allowMessagesFrom || "verified");
      setRequireVerifiedToContact(currentUser.requireVerifiedToContact ?? true);
      setWillingToShip(currentUser.willingToShip || false);
      setShippingFeeAmount(currentUser.shippingFeeAmount || "");
      
      // Parse JSON fields
      try {
        if (currentUser.preferredMeetingLocations) {
          setPreferredMeetingLocations(JSON.parse(currentUser.preferredMeetingLocations));
        }
        if (currentUser.availableTimes) {
          setAvailableTimes(JSON.parse(currentUser.availableTimes));
        }
      } catch (e) {
        console.error("Error parsing JSON fields:", e);
      }
      
      // Set location if available
      if (currentUser.locationCity) {
        const parts = [
          currentUser.locationCity,
          currentUser.locationRegion,
          currentUser.locationCountry
        ].filter(Boolean);
        setLocationInput(parts.join(", "));
      }
    }
  }, [currentUser]);

  // Search for location suggestions with US prioritization
  const searchLocationSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingLocations(true);
    try {
      // First try US-only search
      const usResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=5&addressdetails=1`
      );
      const usData = await usResponse.json();

      // Then try worldwide search
      const worldResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const worldData = await worldResponse.json();

      // Combine results, prioritizing US
      const combined = [
        ...usData,
        ...worldData.filter((w: any) => !usData.some((u: any) => u.place_id === w.place_id))
      ].slice(0, 8);

      setLocationSuggestions(combined);
      setShowSuggestions(combined.length > 0);
    } catch (error) {
      console.error("Error searching locations:", error);
    } finally {
      setSearchingLocations(false);
    }
  };

  // Debounce location search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationInput && locationInput.length >= 3) {
        searchLocationSuggestions(locationInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [locationInput]);

  // Select a location from suggestions
  const handleSelectLocation = (suggestion: any) => {
    const displayName = suggestion.display_name;
    setLocationInput(displayName);
    setLocationData({
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      city: suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || "",
      region: suggestion.address?.state || suggestion.address?.region || "",
      country: suggestion.address?.country || "",
      postalCode: suggestion.address?.postcode || "",
    });
    setShowSuggestions(false);
    toast({
      title: "Location selected!",
      description: displayName,
    });
  };

  // Handle email verification
  const handleVerifyEmail = async () => {
    // Email is verified through Clerk authentication
    // If user is logged in, their email is already verified by Clerk
    toast({
      title: "Email Verified",
      description: "Your email is verified through your Clerk account. No additional verification needed.",
    });
  };

  // Handle phone verification
  const handleVerifyPhone = async () => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please add a phone number first",
        variant: "destructive",
      });
      return;
    }
    
    // Auto-save the phone number if it's different from saved value
    if (phoneNumber !== currentUser?.phoneNumber) {
      try {
        const token = await getToken();
        
        if (!token) {
          throw new Error("Not authenticated");
        }

        // Save just the phone number
        const response = await fetch("/api/user/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            phoneNumber: phoneNumber.trim() || null 
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to save phone number");
        }

        toast({
          title: "Phone number saved",
          description: "Opening verification...",
        });
        
        // Small delay to show the toast
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to save phone number",
          variant: "destructive",
        });
        return;
      }
    }

    // Open verification modal
    setIsPhoneVerificationModalOpen(true);
  };
  
  const handlePhoneVerificationSuccess = () => {
    // Refresh user data to show verified status
    window.location.reload();
  };

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const token = await getToken();
      
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save settings");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved!",
        description: "Your preferences have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    const settings: any = {
      firstName,
      lastName,
      bio,
      contactEmail: contactEmail.trim() || null,
      contactPreference,
      showEmailPublicly,
      phoneNumber: phoneNumber.trim() || null,
      sharePhoneWhen,
      shareEmailWhen,
      profileVisibility,
      showLastActive,
      showItemsSold,
      allowMessagesFrom,
      requireVerifiedToContact,
      preferredMeetingLocations: JSON.stringify(preferredMeetingLocations),
      availableTimes: JSON.stringify(availableTimes),
      willingToShip,
      shippingFeeAmount: shippingFeeAmount ? parseFloat(shippingFeeAmount) : null,
    };

    // Add location data if geocoded
    if (locationData) {
      settings.locationCity = locationData.city;
      settings.locationRegion = locationData.region;
      settings.locationCountry = locationData.country;
      settings.locationPostalCode = locationData.postalCode;
      settings.locationLatitude = locationData.latitude;
      settings.locationLongitude = locationData.longitude;
    }

    saveSettingsMutation.mutate(settings);
  };

  const toggleMeetingLocation = (location: string) => {
    setPreferredMeetingLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const toggleAvailableTime = (time: string) => {
    setAvailableTimes(prev =>
      prev.includes(time)
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile, privacy, and safety preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              This information helps buyers and sellers connect with you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                />
                <p className="text-xs text-muted-foreground">
                  Shown publicly on your profile
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
                <p className="text-xs text-muted-foreground">
                  Kept private until you meet
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/200 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Your Location
            </CardTitle>
            <CardDescription>
              Set your location to see nearby listings and help buyers find you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">City, State or ZIP Code</Label>
              <div className="relative">
                <Input
                  id="location"
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    setLocationData(null); // Clear selection when typing
                  }}
                  onFocus={() => {
                    if (locationSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Start typing a city name..."
                  className="flex-1"
                />
                {searchingLocations && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                
                {/* Autocomplete Dropdown */}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {locationSuggestions.map((suggestion, index) => {
                      const isUS = suggestion.address?.country === "United States";
                      return (
                        <button
                          key={suggestion.place_id}
                          onClick={() => handleSelectLocation(suggestion)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-b-0 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || "Unknown City"}
                                {suggestion.address?.state && `, ${suggestion.address.state}`}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {suggestion.display_name}
                              </p>
                            </div>
                            {isUS && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                                USA
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {locationData && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Location set: {locationData.city}, {locationData.region}, {locationData.country}
                  </span>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Type at least 3 characters to search. US locations are shown first.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Preferences
            </CardTitle>
            <CardDescription>
              Choose how buyers can contact you about your listings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Privacy Tip:</strong> Start with in-app messaging. You can always share your contact info later after getting to know the buyer.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Label>How would you like buyers to contact you?</Label>
              <RadioGroup value={contactPreference} onValueChange={setContactPreference}>
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="in_app" id="in_app" />
                  <div className="space-y-1">
                    <Label htmlFor="in_app" className="font-medium cursor-pointer">
                      In-app messaging only (Most private - recommended)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Buyers can message you through SellFast.Now. Your email and phone stay private.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="email" id="email" />
                  <div className="space-y-1">
                    <Label htmlFor="email" className="font-medium cursor-pointer">
                      Email (Balanced)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Buyers can message in-app or email you directly.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="both" id="both" />
                  <div className="space-y-1">
                    <Label htmlFor="both" className="font-medium cursor-pointer">
                      Email and Phone (Direct contact)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Buyers can reach you via in-app, email, or phone.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
                <Input
                  id="contactEmail"
                  type="text"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Different from your account email (e.g., contact@example.com)"
                />
                <p className="text-xs text-muted-foreground">
                  Use a different email for listing inquiries
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>When to share your contact info?</Label>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Share email:</Label>
                  <RadioGroup value={shareEmailWhen} onValueChange={setShareEmailWhen}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="never" id="email_never" />
                      <Label htmlFor="email_never" className="font-normal cursor-pointer">Never automatically</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="after_offer" id="email_after_offer" />
                      <Label htmlFor="email_after_offer" className="font-normal cursor-pointer">After buyer makes an offer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="after_acceptance" id="email_after_acceptance" />
                      <Label htmlFor="email_after_acceptance" className="font-normal cursor-pointer">After I accept their offer (Recommended)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="always" id="email_always" />
                      <Label htmlFor="email_always" className="font-normal cursor-pointer">Show publicly on listings</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Share phone:</Label>
                  <RadioGroup value={sharePhoneWhen} onValueChange={setSharePhoneWhen}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="never" id="phone_never" />
                      <Label htmlFor="phone_never" className="font-normal cursor-pointer">Never automatically</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="after_offer" id="phone_after_offer" />
                      <Label htmlFor="phone_after_offer" className="font-normal cursor-pointer">After buyer makes an offer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="after_acceptance" id="phone_after_acceptance" />
                      <Label htmlFor="phone_after_acceptance" className="font-normal cursor-pointer">After I accept their offer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="always" id="phone_always" />
                      <Label htmlFor="phone_always" className="font-normal cursor-pointer">Show publicly on listings</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Safety */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Safety
            </CardTitle>
            <CardDescription>
              Control who can see your profile and contact you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Profile Visibility</Label>
              <RadioGroup value={profileVisibility} onValueChange={setProfileVisibility}>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="public" id="public" />
                  <div className="space-y-1">
                    <Label htmlFor="public" className="font-medium cursor-pointer">Public</Label>
                    <p className="text-sm text-muted-foreground">
                      Anyone can view your profile and listings
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="members_only" id="members_only" />
                  <div className="space-y-1">
                    <Label htmlFor="members_only" className="font-medium cursor-pointer">Members Only</Label>
                    <p className="text-sm text-muted-foreground">
                      Only registered users can view your profile
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="private" id="private" />
                  <div className="space-y-1">
                    <Label htmlFor="private" className="font-medium cursor-pointer">Private</Label>
                    <p className="text-sm text-muted-foreground">
                      Only you can view your full profile
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show last active time</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see when you were last online
                  </p>
                </div>
                <Switch
                  checked={showLastActive}
                  onCheckedChange={setShowLastActive}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show items sold count</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your transaction history
                  </p>
                </div>
                <Switch
                  checked={showItemsSold}
                  onCheckedChange={setShowItemsSold}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require verified accounts to contact me</Label>
                  <p className="text-sm text-muted-foreground">
                    Only users with verified email can message you
                  </p>
                </div>
                <Switch
                  checked={requireVerifiedToContact}
                  onCheckedChange={setRequireVerifiedToContact}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Allow messages from:</Label>
              <RadioGroup value={allowMessagesFrom} onValueChange={setAllowMessagesFrom}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="anyone" id="anyone" />
                  <Label htmlFor="anyone" className="font-normal cursor-pointer">Anyone</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="verified" id="verified" />
                  <Label htmlFor="verified" className="font-normal cursor-pointer">Verified users only (Recommended)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none" className="font-normal cursor-pointer">No one (Disable messaging)</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Verification Status
            </CardTitle>
            <CardDescription>
              Verify your identity to build trust with buyers and sellers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Build Trust:</strong> Verified accounts are more likely to complete successful transactions. Buyers prefer sellers with verified contact information.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Verification</p>
                    <p className="text-sm text-muted-foreground">Verify your email address</p>
                  </div>
                </div>
                {currentUser?.emailVerified ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleVerifyEmail}
                  >
                    Verify
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone Verification</p>
                    <p className="text-sm text-muted-foreground">Verify via SMS</p>
                  </div>
                </div>
                {currentUser?.phoneVerified ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    disabled={!phoneNumber}
                    onClick={handleVerifyPhone}
                  >
                    {phoneNumber ? "Verify" : "Add Phone First"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meeting Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Preferences</CardTitle>
            <CardDescription>
              Let buyers know your preferences for completing transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Safety First:</strong> Always meet in public places during daylight hours. Tell a friend where you're going and when you'll be back.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Label>Preferred meeting locations (select all that apply):</Label>
              <div className="space-y-2">
                {[
                  { value: "public_places", label: "Public places (coffee shops, malls, police stations)" },
                  { value: "my_location", label: "My location" },
                  { value: "buyer_location", label: "Buyer's location" },
                  { value: "shipping_only", label: "Shipping only (no in-person meetings)" },
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={preferredMeetingLocations.includes(option.value)}
                      onCheckedChange={() => toggleMeetingLocation(option.value)}
                    />
                    <Label htmlFor={option.value} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Available times (select all that apply):</Label>
              <div className="space-y-2">
                {[
                  { value: "weekdays", label: "Weekdays" },
                  { value: "weekends", label: "Weekends" },
                  { value: "evenings", label: "Evenings" },
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={availableTimes.includes(option.value)}
                      onCheckedChange={() => toggleAvailableTime(option.value)}
                    />
                    <Label htmlFor={option.value} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Willing to ship items</Label>
                  <p className="text-sm text-muted-foreground">
                    Offer shipping as an option for buyers
                  </p>
                </div>
                <Switch
                  checked={willingToShip}
                  onCheckedChange={setWillingToShip}
                />
              </div>

              {willingToShip && (
                <div className="space-y-2">
                  <Label htmlFor="shippingFee">Shipping Fee (Optional)</Label>
                  <Input
                    id="shippingFee"
                    type="number"
                    step="0.01"
                    value={shippingFeeAmount}
                    onChange={(e) => setShippingFeeAmount(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to calculate shipping based on item
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            onClick={handleSaveSettings}
            disabled={saveSettingsMutation.isPending}
            size="lg"
          >
            {saveSettingsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save All Settings"
            )}
          </Button>
        </div>
      </div>
      
      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={isPhoneVerificationModalOpen}
        onClose={() => setIsPhoneVerificationModalOpen(false)}
        phoneNumber={phoneNumber}
        onSuccess={handlePhoneVerificationSuccess}
      />
    </div>
  );
}

