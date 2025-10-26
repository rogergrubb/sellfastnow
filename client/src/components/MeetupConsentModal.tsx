import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Shield, AlertCircle, Check } from "lucide-react";

interface MeetupConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onConsent: () => void;
}

export function MeetupConsentModal({
  isOpen,
  onClose,
  sessionId,
  onConsent,
}: MeetupConsentModalProps) {
  const shareLocationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/meetups/${sessionId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to share location");
      }

      return response.json();
    },
    onSuccess: () => {
      onConsent();
      onClose();
    },
  });

  const handleAccept = () => {
    shareLocationMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Share Your Location?
          </DialogTitle>
          <DialogDescription>
            The other party has requested to share locations for your meetup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm text-green-900 flex items-center gap-2">
              <Check className="w-4 h-4" />
              What You're Agreeing To
            </h4>
            <ul className="text-xs text-green-800 space-y-1 ml-6 list-disc">
              <li>Share your real-time location with the other party</li>
              <li>See their location on a live map</li>
              <li>Session expires automatically after 60 minutes</li>
              <li>You can end sharing at any time</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm text-amber-900 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy & Safety
            </h4>
            <ul className="text-xs text-amber-800 space-y-1 ml-6 list-disc">
              <li>Your location is only visible during this session</li>
              <li>Meet in a public, well-lit location</li>
              <li>You can share session details with a trusted contact</li>
              <li>Location data is encrypted and secure</li>
            </ul>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Never share personal information or meet in isolated areas. Always prioritize your safety.
              </span>
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={shareLocationMutation.isPending}
            >
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={shareLocationMutation.isPending}
            >
              {shareLocationMutation.isPending ? "Accepting..." : "Accept & Share"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

