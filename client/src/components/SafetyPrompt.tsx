import { AlertTriangle, Shield, MapPin, Users, Clock, Phone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SafetyPromptProps {
  variant?: 'full' | 'compact';
  showMeetingTips?: boolean;
  className?: string;
}

export function SafetyPrompt({ 
  variant = 'full', 
  showMeetingTips = true,
  className = '' 
}: SafetyPromptProps) {
  if (variant === 'compact') {
    return (
      <Alert className={`bg-amber-50 border-amber-200 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900">Safety First</AlertTitle>
        <AlertDescription className="text-amber-800 text-sm">
          Always meet in public places during daylight hours. Tell someone where you're going.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`p-6 border-amber-200 bg-amber-50 ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <Shield className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-amber-900 text-lg mb-1">
            Safety Guidelines
          </h3>
          <p className="text-sm text-amber-800">
            Follow these best practices to ensure safe transactions
          </p>
        </div>
      </div>

      <Separator className="my-4 bg-amber-200" />

      <div className="space-y-4">
        {showMeetingTips && (
          <>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 text-sm mb-1">
                  Meet in Public Places
                </h4>
                <p className="text-sm text-amber-800">
                  Choose well-lit, populated areas like coffee shops, shopping centers, or police station parking lots.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 text-sm mb-1">
                  Daytime Meetings
                </h4>
                <p className="text-sm text-amber-800">
                  Schedule meetings during daylight hours when more people are around.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 text-sm mb-1">
                  Bring a Friend
                </h4>
                <p className="text-sm text-amber-800">
                  Consider bringing someone with you, or at minimum tell a friend or family member where you're going and when you'll be back.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 text-sm mb-1">
                  Keep Your Phone Charged
                </h4>
                <p className="text-sm text-amber-800">
                  Ensure your phone is fully charged and easily accessible in case you need help.
                </p>
              </div>
            </div>
          </>
        )}

        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900 text-sm mb-1">
              Trust Your Instincts
            </h4>
            <p className="text-sm text-amber-800">
              If something feels off, don't hesitate to cancel or reschedule the meeting. Your safety is the priority.
            </p>
          </div>
        </div>
      </div>

      <Alert className="mt-4 bg-white border-amber-300">
        <AlertDescription className="text-xs text-amber-900">
          <strong>Verification Matters:</strong> Prefer meeting with users who have verified their email, phone, or ID. Check for verification badges on their profile.
        </AlertDescription>
      </Alert>
    </Card>
  );
}

interface MeetingPreferencesDisplayProps {
  seller: {
    preferredMeetingLocations?: string | null;
    availableTimes?: string | null;
    willingToShip?: boolean;
    shippingFeeAmount?: string | null;
  };
  className?: string;
}

export function MeetingPreferencesDisplay({ 
  seller, 
  className = '' 
}: MeetingPreferencesDisplayProps) {
  // Parse JSON strings
  const parsePreference = (pref: string | null | undefined): string[] => {
    if (!pref) return [];
    try {
      return JSON.parse(pref);
    } catch {
      return [];
    }
  };

  const meetingLocations = parsePreference(seller.preferredMeetingLocations);
  const availableTimes = parsePreference(seller.availableTimes);

  const locationLabels: Record<string, string> = {
    public_places: 'Public places (coffee shops, malls, police stations)',
    my_location: 'Seller\'s location',
    buyer_location: 'Buyer\'s location',
    shipping_only: 'Shipping only (no in-person)',
  };

  const timeLabels: Record<string, string> = {
    weekdays: 'Weekdays',
    weekends: 'Weekends',
    evenings: 'Evenings',
  };

  // If no preferences set, don't show anything
  if (meetingLocations.length === 0 && availableTimes.length === 0 && !seller.willingToShip) {
    return null;
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-lg mb-1">
            Meeting Preferences
          </h3>
          <p className="text-sm text-muted-foreground">
            Seller's preferred meeting arrangements
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {meetingLocations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Preferred Locations</h4>
            <div className="flex flex-wrap gap-2">
              {meetingLocations.map((location) => (
                <Badge key={location} variant="secondary" className="text-xs">
                  {locationLabels[location] || location}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {availableTimes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Available Times</h4>
            <div className="flex flex-wrap gap-2">
              {availableTimes.map((time) => (
                <Badge key={time} variant="outline" className="text-xs">
                  {timeLabels[time] || time}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {seller.willingToShip && (
          <div>
            <h4 className="text-sm font-medium mb-2">Shipping Available</h4>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">
                Willing to ship
              </Badge>
              {seller.shippingFeeAmount && parseFloat(seller.shippingFeeAmount) > 0 && (
                <span className="text-sm text-muted-foreground">
                  Shipping fee: ${parseFloat(seller.shippingFeeAmount).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <SafetyPrompt variant="compact" showMeetingTips={false} className="mt-4" />
    </Card>
  );
}

