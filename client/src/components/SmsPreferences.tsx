import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, Bell, Gift, TrendingUp, Calendar } from "lucide-react";

interface SmsPreferencesProps {
  phoneNumber?: string;
  smsWeeklyUpdates?: boolean;
  smsMonthlyUpdates?: boolean;
  smsCreditGiveaways?: boolean;
  smsPromotional?: boolean;
  onUpdate: (preferences: {
    phoneNumber?: string;
    smsWeeklyUpdates?: boolean;
    smsMonthlyUpdates?: boolean;
    smsCreditGiveaways?: boolean;
    smsPromotional?: boolean;
  }) => Promise<void>;
}

export function SmsPreferences({
  phoneNumber: initialPhoneNumber = "",
  smsWeeklyUpdates: initialWeekly = false,
  smsMonthlyUpdates: initialMonthly = false,
  smsCreditGiveaways: initialGiveaways = false,
  smsPromotional: initialPromo = false,
  onUpdate,
}: SmsPreferencesProps) {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [smsWeeklyUpdates, setSmsWeeklyUpdates] = useState(initialWeekly);
  const [smsMonthlyUpdates, setSmsMonthlyUpdates] = useState(initialMonthly);
  const [smsCreditGiveaways, setSmsCreditGiveaways] = useState(initialGiveaways);
  const [smsPromotional, setSmsPromotional] = useState(initialPromo);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        phoneNumber,
        smsWeeklyUpdates,
        smsMonthlyUpdates,
        smsCreditGiveaways,
        smsPromotional,
      });
      
      toast({
        title: "Preferences saved",
        description: "Your SMS notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update SMS preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasAnyEnabled = smsWeeklyUpdates || smsMonthlyUpdates || smsCreditGiveaways || smsPromotional;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          <CardTitle>SMS Notifications</CardTitle>
        </div>
        <CardDescription>
          Get important updates and exclusive offers via text message
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phone Number Input */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Required for SMS notifications. Standard message rates may apply.
          </p>
        </div>

        {/* SMS Preferences */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <Label htmlFor="weekly" className="text-base">
                  Weekly Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get a weekly summary of new listings and your saved search matches
                </p>
              </div>
            </div>
            <Switch
              id="weekly"
              checked={smsWeeklyUpdates}
              onCheckedChange={setSmsWeeklyUpdates}
              disabled={!phoneNumber}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <Label htmlFor="monthly" className="text-base">
                  Monthly Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Monthly platform updates, stats, and seller success stories
                </p>
              </div>
            </div>
            <Switch
              id="monthly"
              checked={smsMonthlyUpdates}
              onCheckedChange={setSmsMonthlyUpdates}
              disabled={!phoneNumber}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Gift className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <Label htmlFor="giveaways" className="text-base">
                  Free AI Credit Giveaways
                </Label>
                <p className="text-sm text-muted-foreground">
                  Be the first to know about free AI credits and special promotions
                </p>
              </div>
            </div>
            <Switch
              id="giveaways"
              checked={smsCreditGiveaways}
              onCheckedChange={setSmsCreditGiveaways}
              disabled={!phoneNumber}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <Label htmlFor="promotional" className="text-base">
                  Promotional Offers
                </Label>
                <p className="text-sm text-muted-foreground">
                  Exclusive deals, new features, and platform announcements
                </p>
              </div>
            </div>
            <Switch
              id="promotional"
              checked={smsPromotional}
              onCheckedChange={setSmsPromotional}
              disabled={!phoneNumber}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {hasAnyEnabled && phoneNumber ? (
              <span className="text-green-600 font-medium">
                ✓ SMS notifications enabled
              </span>
            ) : (
              "Enable notifications to stay updated"
            )}
          </p>
          <Button onClick={handleSave} disabled={saving || !phoneNumber}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>

        {/* Opt-out Notice */}
        <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
          <p>
            <strong>Privacy:</strong> Your phone number is never shared with other users.
            Reply STOP to any message to unsubscribe. Standard message rates may apply.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

