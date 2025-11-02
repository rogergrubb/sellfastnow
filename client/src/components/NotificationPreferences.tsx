// Notification Preferences Component
// Allows users to configure their notification settings

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, MessageSquare, Phone, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreferences {
  userId: string;
  // In-app
  inAppMessages: boolean;
  inAppOffers: boolean;
  inAppReviews: boolean;
  inAppTransactions: boolean;
  inAppSales: boolean;
  inAppPurchases: boolean;
  inAppSystem: boolean;
  // Email
  emailMessages: boolean;
  emailOffers: boolean;
  emailReviews: boolean;
  emailTransactions: boolean;
  emailSales: boolean;
  emailPurchases: boolean;
  emailSystem: boolean;
  emailDailyDigest: boolean;
  emailWeeklyDigest: boolean;
  // SMS
  smsMessages: boolean;
  smsOffers: boolean;
  smsReviews: boolean;
  smsTransactions: boolean;
  smsSales: boolean;
  smsPurchases: boolean;
  smsSystem: boolean;
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietHoursTimezone: string;
}

export function NotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch preferences
  const { data: preferences, isLoading } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notifications-new/preferences"],
    enabled: !!user,
  });

  const [localPrefs, setLocalPrefs] = useState<Partial<NotificationPreferences>>({});

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const response = await fetch("/api/notifications-new/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update preferences");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications-new/preferences"] });
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...localPrefs, [key]: value };
    setLocalPrefs(updated);
    updatePreferencesMutation.mutate({ [key]: value });
  };

  const handleTimeChange = (key: "quietHoursStart" | "quietHoursEnd", value: string) => {
    const updated = { ...localPrefs, [key]: value };
    setLocalPrefs(updated);
  };

  const handleSaveQuietHours = () => {
    updatePreferencesMutation.mutate({
      quietHoursEnabled: localPrefs.quietHoursEnabled,
      quietHoursStart: localPrefs.quietHoursStart,
      quietHoursEnd: localPrefs.quietHoursEnd,
      quietHoursTimezone: localPrefs.quietHoursTimezone,
    });
  };

  if (isLoading || !localPrefs) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Loading preferences...</p>
        </CardContent>
      </Card>
    );
  }

  const PreferenceRow = ({
    label,
    description,
    inAppKey,
    emailKey,
    smsKey,
  }: {
    label: string;
    description: string;
    inAppKey: keyof NotificationPreferences;
    emailKey: keyof NotificationPreferences;
    smsKey: keyof NotificationPreferences;
  }) => (
    <div className="flex items-start justify-between py-4">
      <div className="flex-1">
        <Label className="text-base font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="flex gap-8 items-center">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <Switch
            checked={localPrefs[inAppKey] as boolean}
            onCheckedChange={(checked) => handleToggle(inAppKey, checked)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <Switch
            checked={localPrefs[emailKey] as boolean}
            onCheckedChange={(checked) => handleToggle(emailKey, checked)}
          />
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <Switch
            checked={localPrefs[smsKey] as boolean}
            onCheckedChange={(checked) => handleToggle(smsKey, checked)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to be notified about different events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Channel Headers */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Notification Type</p>
            </div>
            <div className="flex gap-8">
              <div className="flex items-center gap-2 w-16 justify-center">
                <Bell className="h-4 w-4" />
                <span className="text-xs">App</span>
              </div>
              <div className="flex items-center gap-2 w-16 justify-center">
                <Mail className="h-4 w-4" />
                <span className="text-xs">Email</span>
              </div>
              <div className="flex items-center gap-2 w-16 justify-center">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">SMS</span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Notification Types */}
          <div className="space-y-1">
            <PreferenceRow
              label="Messages"
              description="When someone sends you a message"
              inAppKey="inAppMessages"
              emailKey="emailMessages"
              smsKey="smsMessages"
            />
            <Separator />
            <PreferenceRow
              label="Offers"
              description="When someone makes an offer on your listing"
              inAppKey="inAppOffers"
              emailKey="emailOffers"
              smsKey="smsOffers"
            />
            <Separator />
            <PreferenceRow
              label="Reviews"
              description="When someone leaves you a review"
              inAppKey="inAppReviews"
              emailKey="emailReviews"
              smsKey="smsReviews"
            />
            <Separator />
            <PreferenceRow
              label="Transactions"
              description="Updates about your transactions"
              inAppKey="inAppTransactions"
              emailKey="emailTransactions"
              smsKey="smsTransactions"
            />
            <Separator />
            <PreferenceRow
              label="Sales"
              description="When your item sells"
              inAppKey="inAppSales"
              emailKey="emailSales"
              smsKey="smsSales"
            />
            <Separator />
            <PreferenceRow
              label="Purchases"
              description="When you purchase an item"
              inAppKey="inAppPurchases"
              emailKey="emailPurchases"
              smsKey="smsPurchases"
            />
            <Separator />
            <PreferenceRow
              label="System"
              description="Important platform updates and announcements"
              inAppKey="inAppSystem"
              emailKey="emailSystem"
              smsKey="smsSystem"
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Digest Options */}
      <Card>
        <CardHeader>
          <CardTitle>Email Digests</CardTitle>
          <CardDescription>
            Receive summaries of your notifications via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Daily Digest</Label>
              <p className="text-sm text-muted-foreground">
                Get a daily summary of your notifications
              </p>
            </div>
            <Switch
              checked={localPrefs.emailDailyDigest}
              onCheckedChange={(checked) => handleToggle("emailDailyDigest", checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Get a weekly summary of your activity
              </p>
            </div>
            <Switch
              checked={localPrefs.emailWeeklyDigest}
              onCheckedChange={(checked) => handleToggle("emailWeeklyDigest", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Pause notifications during specific hours (applies to email and SMS only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Enable Quiet Hours</Label>
            <Switch
              checked={localPrefs.quietHoursEnabled}
              onCheckedChange={(checked) => handleToggle("quietHoursEnabled", checked)}
            />
          </div>

          {localPrefs.quietHoursEnabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={localPrefs.quietHoursStart || "22:00"}
                    onChange={(e) => handleTimeChange("quietHoursStart", e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={localPrefs.quietHoursEnd || "08:00"}
                    onChange={(e) => handleTimeChange("quietHoursEnd", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Timezone</Label>
                <Select
                  value={localPrefs.quietHoursTimezone || "America/New_York"}
                  onValueChange={(value) => setLocalPrefs({ ...localPrefs, quietHoursTimezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveQuietHours} className="w-full">
                Save Quiet Hours
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
