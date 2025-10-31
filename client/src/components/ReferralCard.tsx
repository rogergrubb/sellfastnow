import { useState } from "react";
import { Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";

export default function ReferralCard() {
  const [friendEmail, setFriendEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!friendEmail) {
      setError("Please enter your friend's email");
      return;
    }

    if (!user) {
      setError("Please sign in to refer friends");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ friendEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFriendEmail("");
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(data.message || "Failed to send referral");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-full">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Refer a Friend & Earn 50 AI Credits</CardTitle>
            <CardDescription className="text-base mt-1">
              Share SellFast with friends and get rewarded when they sign up!
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-lg flex items-center gap-3">
            <Gift className="h-6 w-6" />
            <div>
              <p className="font-semibold">Referral sent successfully!</p>
              <p className="text-sm">You'll receive 50 AI credits when your friend creates an account.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter your friend's email address"
                value={friendEmail}
                onChange={(e) => {
                  setFriendEmail(e.target.value);
                  setError("");
                }}
                className="flex-1 h-12 text-lg"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                disabled={isSubmitting || !user}
                className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-lg font-semibold"
              >
                {isSubmitting ? "Sending..." : "Send Invite"}
              </Button>
            </div>
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}
            {!user && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please <a href="/sign-in" className="text-blue-600 hover:underline">sign in</a> to refer friends.
              </p>
            )}
          </form>
        )}
        
        <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Gift className="h-4 w-4 text-blue-600" />
            How it works:
          </h4>
          <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-6 list-decimal">
            <li>Enter your friend's email address</li>
            <li>They'll receive an invitation to join SellFast</li>
            <li>When they create an account, you both get 50 AI credits!</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

