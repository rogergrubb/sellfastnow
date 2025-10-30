import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Bell, MessageSquare, DollarSign, Package, Star, Calendar, Gift } from "lucide-react";

interface SmsPreferencesProps {
  phoneNumber?: string;
  // Marketing
  smsWeeklyUpdates?: boolean;
  smsMonthlyUpdates?: boolean;
  smsCreditGiveaways?: boolean;
  smsPromotional?: boolean;
  // Transactions
  smsOfferReceived?: boolean;
  smsOfferResponse?: boolean;
  smsPaymentConfirmed?: boolean;
  // Messages
  smsNewMessage?: boolean;
  // Listings
  smsListingPublished?: boolean;
  smsListingEngagement?: boolean;
  smsListingSold?: boolean;
  // Reviews
  smsReviewReceived?: boolean;
  // Meetups
  smsMeetupReminder?: boolean;
  onUpdate: (preferences: any) => Promise<void>;
}

export default function SmsPreferencesEnhanced({
  phoneNumber: initialPhone = "",
  smsWeeklyUpdates = false,
  smsMonthlyUpdates = false,
  smsCreditGiveaways = false,
  smsPromotional = false,
  smsOfferReceived = false,
  smsOfferResponse = false,
  smsPaymentConfirmed = false,
  smsNewMessage = false,
  smsListingPublished = false,
  smsListingEngagement = false,
  smsListingSold = false,
  smsReviewReceived = false,
  smsMeetupReminder = false,
  onUpdate,
}: SmsPreferencesProps) {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [saving, setSaving] = useState(false);

  // Marketing preferences
  const [weeklyUpdates, setWeeklyUpdates] = useState(smsWeeklyUpdates);
  const [monthlyUpdates, setMonthlyUpdates] = useState(smsMonthlyUpdates);
  const [creditGiveaways, setCreditGiveaways] = useState(smsCreditGiveaways);
  const [promotional, setPromotional] = useState(smsPromotional);

  // Transaction preferences
  const [offerReceived, setOfferReceived] = useState(smsOfferReceived);
  const [offerResponse, setOfferResponse] = useState(smsOfferResponse);
  const [paymentConfirmed, setPaymentConfirmed] = useState(smsPaymentConfirmed);

  // Message preferences
  const [newMessage, setNewMessage] = useState(smsNewMessage);

  // Listing preferences
  const [listingPublished, setListingPublished] = useState(smsListingPublished);
  const [listingEngagement, setListingEngagement] = useState(smsListingEngagement);
  const [listingSold, setListingSold] = useState(smsListingSold);

  // Review preferences
  const [reviewReceived, setReviewReceived] = useState(smsReviewReceived);

  // Meetup preferences
  const [meetupReminder, setMeetupReminder] = useState(smsMeetupReminder);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        phoneNumber,
        smsWeeklyUpdates: weeklyUpdates,
        smsMonthlyUpdates: monthlyUpdates,
        smsCreditGiveaways: creditGiveaways,
        smsPromotional: promotional,
        smsOfferReceived: offerReceived,
        smsOfferResponse: offerResponse,
        smsPaymentConfirmed: paymentConfirmed,
        smsNewMessage: newMessage,
        smsListingPublished: listingPublished,
        smsListingEngagement: listingEngagement,
        smsListingSold: listingSold,
        smsReviewReceived: reviewReceived,
        smsMeetupReminder: meetupReminder,
      });

      toast({
        title: "Preferences Saved",
        description: "Your SMS notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const anyEnabled = weeklyUpdates || monthlyUpdates || creditGiveaways || promotional ||
    offerReceived || offerResponse || paymentConfirmed || newMessage ||
    listingPublished || listingEngagement || listingSold || reviewReceived || meetupReminder;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phone Number</CardTitle>
          <CardDescription>
            Enter your phone number to receive SMS notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="max-w-md"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Include country code (e.g., +1 for US)
              </p>
            </div>
            {phoneNumber && anyEnabled && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Bell className="h-4 w-4" />
                <span>SMS notifications enabled</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Offers & Payments</CardTitle>
          </div>
          <CardDescription>
            Get notified about offers and payment activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="offerReceived">New Offer Received</Label>
              <p className="text-sm text-muted-foreground">
                When someone makes an offer on your listing
              </p>
            </div>
            <Switch
              id="offerReceived"
              checked={offerReceived}
              onCheckedChange={setOfferReceived}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="offerResponse">Offer Accepted/Rejected</Label>
              <p className="text-sm text-muted-foreground">
                When seller responds to your offer
              </p>
            </div>
            <Switch
              id="offerResponse"
              checked={offerResponse}
              onCheckedChange={setOfferResponse}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="paymentConfirmed">Payment Confirmed</Label>
              <p className="text-sm text-muted-foreground">
                When payment is received or confirmed
              </p>
            </div>
            <Switch
              id="paymentConfirmed"
              checked={paymentConfirmed}
              onCheckedChange={setPaymentConfirmed}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>Messages</CardTitle>
          </div>
          <CardDescription>
            Stay updated on buyer and seller messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="newMessage">New Message</Label>
              <p className="text-sm text-muted-foreground">
                When you receive a message about a listing
              </p>
            </div>
            <Switch
              id="newMessage"
              checked={newMessage}
              onCheckedChange={setNewMessage}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <CardTitle>Your Listings</CardTitle>
          </div>
          <CardDescription>
            Track activity on your listings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="listingPublished">Listing Published</Label>
              <p className="text-sm text-muted-foreground">
                Confirmation when your listing goes live
              </p>
            </div>
            <Switch
              id="listingPublished"
              checked={listingPublished}
              onCheckedChange={setListingPublished}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="listingEngagement">Views & Favorites</Label>
              <p className="text-sm text-muted-foreground">
                When someone favorites your item
              </p>
            </div>
            <Switch
              id="listingEngagement"
              checked={listingEngagement}
              onCheckedChange={setListingEngagement}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="listingSold">Item Sold</Label>
              <p className="text-sm text-muted-foreground">
                When your item is successfully sold
              </p>
            </div>
            <Switch
              id="listingSold"
              checked={listingSold}
              onCheckedChange={setListingSold}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            <CardTitle>Reviews & Reputation</CardTitle>
          </div>
          <CardDescription>
            Get notified about your reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reviewReceived">New Review</Label>
              <p className="text-sm text-muted-foreground">
                When someone leaves you a review
              </p>
            </div>
            <Switch
              id="reviewReceived"
              checked={reviewReceived}
              onCheckedChange={setReviewReceived}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Meetups</CardTitle>
          </div>
          <CardDescription>
            Reminders for scheduled meetups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="meetupReminder">Meetup Reminder</Label>
              <p className="text-sm text-muted-foreground">
                1 hour before scheduled meetup
              </p>
            </div>
            <Switch
              id="meetupReminder"
              checked={meetupReminder}
              onCheckedChange={setMeetupReminder}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            <CardTitle>Marketing & Promotions</CardTitle>
          </div>
          <CardDescription>
            Platform updates, deals, and special offers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weeklyUpdates">Weekly Updates</Label>
              <p className="text-sm text-muted-foreground">
                Platform activity and new listings
              </p>
            </div>
            <Switch
              id="weeklyUpdates"
              checked={weeklyUpdates}
              onCheckedChange={setWeeklyUpdates}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="monthlyUpdates">Monthly Updates</Label>
              <p className="text-sm text-muted-foreground">
                Monthly stats and new features
              </p>
            </div>
            <Switch
              id="monthlyUpdates"
              checked={monthlyUpdates}
              onCheckedChange={setMonthlyUpdates}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="creditGiveaways">Credit Giveaways</Label>
              <p className="text-sm text-muted-foreground">
                Free AI credit announcements
              </p>
            </div>
            <Switch
              id="creditGiveaways"
              checked={creditGiveaways}
              onCheckedChange={setCreditGiveaways}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="promotional">Promotional Offers</Label>
              <p className="text-sm text-muted-foreground">
                Special deals and announcements
              </p>
            </div>
            <Switch
              id="promotional"
              checked={promotional}
              onCheckedChange={setPromotional}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Reply STOP to any SMS to unsubscribe
        </p>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}

