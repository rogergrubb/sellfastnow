import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Gift, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PostLoginReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostLoginReferralModal({ isOpen, onClose }: PostLoginReferralModalProps) {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const sendReferral = useMutation({
    mutationFn: async (friendEmail: string) => {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ friendEmail }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send referral");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Referral sent! 🎉",
        description: "Your friend will receive an invitation email. You'll both get 50 AI credits when they sign up!",
      });
      setEmail("");
      // Close modal after successful referral
      setTimeout(() => onClose(), 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      sendReferral.mutate(email.trim());
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 rounded-full p-4">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center mb-3 text-gray-900 dark:text-white">
            Refer a Friend & Earn 50 AI Credits
          </h2>

          {/* Subtitle */}
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8 text-lg">
            Share SellFast with friends and get rewarded when they sign up!
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter your friend's email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12 text-base bg-white dark:bg-gray-800"
                required
              />
              <Button
                type="submit"
                disabled={sendReferral.isPending || !email.trim()}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {sendReferral.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </form>

          {/* How it works */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                How it works:
              </h3>
            </div>

            <ol className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex gap-3">
                <span className="font-semibold text-blue-600 flex-shrink-0">1.</span>
                <span>Enter your friend's email address</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-blue-600 flex-shrink-0">2.</span>
                <span>They'll receive an invitation to join SellFast</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-blue-600 flex-shrink-0">3.</span>
                <span>When they create an account, you both get 50 AI credits!</span>
              </li>
            </ol>
          </div>

          {/* Skip button */}
          <div className="text-center mt-6">
            <button
              onClick={handleSkip}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm underline"
            >
              Maybe later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

