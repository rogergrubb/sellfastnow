import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Clock, Shield, Users } from "lucide-react";

interface MeetupInitiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  listingId: string;
  onSuccess: (sessionId: string) => void;
}

export function MeetupInitiationModal({
  isOpen,
  onClose,
  transactionId,
  listingId,
  onSuccess,
}: MeetupInitiationModalProps) {
  const [meetupLocation, setMeetupLocation] = useState("");
  const [meetupLat, setMeetupLat] = useState<number | null>(null);
  const [meetupLng, setMeetupLng] = useState<number | null>(null);

  const createMeetupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/meetups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          transactionId,
          listingId,
          suggestedMeetupName: meetupLocation,
          suggestedMeetupLat: meetupLat,
          suggestedMeetupLng: meetupLng,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create meetup session");
      }

      return response.json();
    },
    onSuccess: (data) => {
      onSuccess(data.meetupSession.id);
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMeetupMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Initiate Meetup Location Sharing
          </DialogTitle>
          <DialogDescription>
            Start a secure, time-limited location sharing session with the other party.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meetupLocation">Suggested Meetup Location (Optional)</Label>
            <Input
              id="meetupLocation"
              placeholder="e.g., Starbucks on Main Street"
              value={meetupLocation}
              onChange={(e) => setMeetupLocation(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Suggest a public place for the meetup. You can select from a map later.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm text-blue-900 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              How It Works
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li className="flex items-start gap-2">
                <Users className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>Both parties must consent to share their location</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>Session automatically expires after 60 minutes</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>Your location is only visible to the other party during the session</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={createMeetupMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createMeetupMutation.isPending}
            >
              {createMeetupMutation.isPending ? "Creating..." : "Start Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

