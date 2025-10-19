import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tantml:react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageCircle, Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userProfile, isLoading } = useQuery<any>({
    queryKey: ['/api/auth/user'],
    enabled: !!user,
  });

  const [contactEmail, setContactEmail] = useState(userProfile?.contactEmail || userProfile?.email || '');
  const [contactPreference, setContactPreference] = useState(userProfile?.contactPreference || 'in_app');
  const [showEmailPublicly, setShowEmailPublicly] = useState(userProfile?.showEmailPublicly || false);

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Settings Saved",
        description: "Your contact preferences have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate({
      contactEmail,
      contactPreference,
      showEmailPublicly,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Account Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Contact Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Preferences</CardTitle>
            <CardDescription>
              Choose how buyers can contact you about your listings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Method */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Preferred Contact Method</Label>
              <RadioGroup value={contactPreference} onValueChange={setContactPreference}>
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <RadioGroupItem value="in_app" id="in_app" />
                  <div className="flex-1">
                    <Label htmlFor="in_app" className="font-medium cursor-pointer flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      In-App Messaging Only
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Buyers can send you messages through the platform. Your email stays private.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <RadioGroupItem value="email" id="email" />
                  <div className="flex-1">
                    <Label htmlFor="email" className="font-medium cursor-pointer flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Only
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Buyers can contact you via email. Your email will be visible on your listings.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <RadioGroupItem value="both" id="both" />
                  <div className="flex-1">
                    <Label htmlFor="both" className="font-medium cursor-pointer flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <Mail className="h-4 w-4" />
                      Both Methods
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Buyers can choose to message you in-app or via email.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Contact Email */}
            {(contactPreference === 'email' || contactPreference === 'both') && (
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  This email will be shown to buyers. Leave blank to use your account email ({userProfile?.email}).
                </p>
              </div>
            )}

            {/* Show Email Publicly */}
            {(contactPreference === 'email' || contactPreference === 'both') && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="showEmailPublicly" className="text-base font-medium">
                    Display Email on Listings
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show your contact email directly on your listing pages
                  </p>
                </div>
                <Switch
                  id="showEmailPublicly"
                  checked={showEmailPublicly}
                  onCheckedChange={setShowEmailPublicly}
                />
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSave} 
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        {/* Additional Settings Sections Can Go Here */}
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>
              Manage your email notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">New Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications when you get new messages
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Listing Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone favorites or views your listings
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

