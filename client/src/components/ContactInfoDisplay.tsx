import { useState } from "react";
import { Mail, Phone, Lock, Unlock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ContactInfoDisplayProps {
  seller: {
    id: string;
    email?: string;
    contactEmail?: string;
    phoneNumber?: string;
    shareEmailWhen: string; // 'never' | 'after_offer' | 'after_acceptance' | 'always'
    sharePhoneWhen: string; // 'never' | 'after_offer' | 'after_acceptance' | 'always'
    showEmailPublicly?: boolean;
    emailVerified?: boolean;
    phoneVerified?: boolean;
  };
  currentUser?: {
    id: string;
  };
  transactionStatus?: {
    hasOffer: boolean;
    offerAccepted: boolean;
  };
  listingId: string;
}

export function ContactInfoDisplay({
  seller,
  currentUser,
  transactionStatus = { hasOffer: false, offerAccepted: false },
  listingId,
}: ContactInfoDisplayProps) {
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  // Don't show anything if viewing own listing
  if (currentUser?.id === seller.id) {
    return null;
  }

  // Determine if email should be shown
  const canShowEmail = () => {
    if (seller.shareEmailWhen === 'always' || seller.showEmailPublicly) return true;
    if (seller.shareEmailWhen === 'never') return false;
    if (seller.shareEmailWhen === 'after_offer' && transactionStatus.hasOffer) return true;
    if (seller.shareEmailWhen === 'after_acceptance' && transactionStatus.offerAccepted) return true;
    return false;
  };

  // Determine if phone should be shown
  const canShowPhone = () => {
    if (seller.sharePhoneWhen === 'always') return true;
    if (seller.sharePhoneWhen === 'never') return false;
    if (seller.sharePhoneWhen === 'after_offer' && transactionStatus.hasOffer) return true;
    if (seller.sharePhoneWhen === 'after_acceptance' && transactionStatus.offerAccepted) return true;
    return false;
  };

  const emailAvailable = canShowEmail();
  const phoneAvailable = canShowPhone();
  const displayEmail = seller.contactEmail || seller.email;

  // Get messaging for why contact info isn't available
  const getEmailMessage = () => {
    if (seller.shareEmailWhen === 'never') {
      return 'Seller prefers in-app messaging only';
    }
    if (seller.shareEmailWhen === 'after_offer' && !transactionStatus.hasOffer) {
      return 'Email will be shared after you make an offer';
    }
    if (seller.shareEmailWhen === 'after_acceptance' && !transactionStatus.offerAccepted) {
      return 'Email will be shared after seller accepts your offer';
    }
    return '';
  };

  const getPhoneMessage = () => {
    if (seller.sharePhoneWhen === 'never') {
      return 'Seller prefers not to share phone number';
    }
    if (seller.sharePhoneWhen === 'after_offer' && !transactionStatus.hasOffer) {
      return 'Phone will be shared after you make an offer';
    }
    if (seller.sharePhoneWhen === 'after_acceptance' && !transactionStatus.offerAccepted) {
      return 'Phone will be shared after seller accepts your offer';
    }
    return '';
  };

  // If no contact info is available at all
  if (!emailAvailable && !phoneAvailable && !seller.phoneNumber) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy Protected</strong>
          <p className="text-sm mt-1">
            This seller uses in-app messaging only. Use the "Message Seller" button to start a conversation.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span>Contact Information</span>
      </div>

      {/* Email Section */}
      {(emailAvailable || seller.shareEmailWhen !== 'never') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email</span>
              {seller.emailVerified && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                  Verified
                </Badge>
              )}
            </div>
            {emailAvailable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmail(!showEmail)}
                className="h-auto p-1"
              >
                {showEmail ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </Button>
            )}
          </div>
          
          {emailAvailable ? (
            showEmail ? (
              <div className="bg-muted p-3 rounded-md">
                <a
                  href={`mailto:${displayEmail}`}
                  className="text-sm text-primary hover:underline break-all"
                >
                  {displayEmail}
                </a>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Click the lock icon to reveal email address
              </p>
            )
          ) : (
            <Alert className="py-2">
              <AlertDescription className="text-xs">
                {getEmailMessage()}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Phone Section */}
      {(phoneAvailable || seller.phoneNumber) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Phone</span>
              {seller.phoneVerified && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                  Verified
                </Badge>
              )}
            </div>
            {phoneAvailable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPhone(!showPhone)}
                className="h-auto p-1"
              >
                {showPhone ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </Button>
            )}
          </div>
          
          {phoneAvailable ? (
            showPhone ? (
              <div className="bg-muted p-3 rounded-md">
                <a
                  href={`tel:${seller.phoneNumber}`}
                  className="text-sm text-primary hover:underline"
                >
                  {seller.phoneNumber}
                </a>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Click the lock icon to reveal phone number
              </p>
            )
          ) : (
            <Alert className="py-2">
              <AlertDescription className="text-xs">
                {getPhoneMessage()}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Privacy Notice */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-xs text-blue-900">
          <strong>Privacy Tip:</strong> Start with in-app messaging to build trust before sharing personal contact information.
        </AlertDescription>
      </Alert>
    </div>
  );
}

