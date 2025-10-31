import { useState, useEffect } from "react";
import { X, Bell, Gift, Mail, Search, Building2, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [keywords, setKeywords] = useState("");
  const [preferences, setPreferences] = useState({
    keywordAlerts: false,
    bulkSales: false,
    estateSales: false,
    giveaway: false,
    newsletter: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const [referralSubmitting, setReferralSubmitting] = useState(false);
  const [referralSuccess, setReferralSuccess] = useState(false);

  useEffect(() => {
    // Check if user has already seen the modal
    const hasSeenModal = localStorage.getItem("hasSeenWelcomeModal");
    if (hasSeenModal) return;

    // Show after 10 seconds OR when user scrolls 50%
    let timeoutId: NodeJS.Timeout;
    let hasShown = false;

    const showModal = () => {
      if (!hasShown) {
        hasShown = true;
        setIsOpen(true);
        localStorage.setItem("hasSeenWelcomeModal", "true");
      }
    };

    // Timer: Show after 10 seconds
    timeoutId = setTimeout(showModal, 10000);

    // Scroll: Show when user scrolls 50% down
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= 50) {
        showModal();
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      alert("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/welcome-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          keywords: keywords.trim() || null,
          preferences,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to sign up");
      }

      setSubmitted(true);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.error("Error signing up:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {submitted ? (
          // Success state
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              You're All Set! 🎉
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Check your email to confirm your preferences.
            </p>
          </div>
        ) : (
          // Form state
          <form onSubmit={handleSubmit} className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to SellFast.Now!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Never miss a deal - get personalized notifications
              </p>
            </div>

            {/* Keyword search alerts */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  id="keywordAlerts"
                  checked={preferences.keywordAlerts}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, keywordAlerts: checked as boolean })
                  }
                />
                <Label htmlFor="keywordAlerts" className="flex items-center gap-2 cursor-pointer">
                  <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Get notified when items matching your keywords are posted</span>
                </Label>
              </div>
              {preferences.keywordAlerts && (
                <Input
                  type="text"
                  placeholder="e.g., vintage camera, antique furniture, iPhone"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="ml-6"
                />
              )}
            </div>

            {/* Bulk/liquidation sales */}
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="bulkSales"
                  checked={preferences.bulkSales}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, bulkSales: checked as boolean })
                  }
                />
                <Label htmlFor="bulkSales" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium">Notify me of bulk/liquidation sales</span>
                </Label>
              </div>
            </div>

            {/* Estate sales */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="estateSales"
                  checked={preferences.estateSales}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, estateSales: checked as boolean })
                  }
                />
                <Label htmlFor="estateSales" className="flex items-center gap-2 cursor-pointer">
                  <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="font-medium">Notify me of estate sales in my area</span>
                </Label>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

            {/* Referral Section */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-lg">Refer a Friend & Earn 50 AI Credits</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Know someone who'd love SellFast? Invite them and you'll both benefit!
              </p>
              {referralSuccess ? (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-3 rounded-lg text-sm">
                  ✅ Referral sent! You'll get 50 credits when they sign up.
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Friend's email address"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!friendEmail) {
                        alert("Please enter your friend's email");
                        return;
                      }
                      setReferralSubmitting(true);
                      try {
                        const response = await fetch("/api/referrals", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            "x-user-id": localStorage.getItem("userId") || "",
                          },
                          body: JSON.stringify({ friendEmail }),
                        });
                        if (response.ok) {
                          setReferralSuccess(true);
                          setFriendEmail("");
                        } else {
                          const data = await response.json();
                          alert(data.message || "Failed to send referral");
                        }
                      } catch (error) {
                        alert("Something went wrong. Please try again.");
                      } finally {
                        setReferralSubmitting(false);
                      }
                    }}
                    disabled={referralSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {referralSubmitting ? "Sending..." : "Send"}
                  </Button>
                </div>
              )}
            </div>

            {/* Giveaway */}
            <div className="mb-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="giveaway"
                  checked={preferences.giveaway}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, giveaway: checked as boolean })
                  }
                />
                <Label htmlFor="giveaway" className="flex items-center gap-2 cursor-pointer">
                  <Gift className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-medium">Enter to win 100 free AI credits (monthly drawing)</span>
                </Label>
              </div>
            </div>

            {/* Newsletter */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="newsletter"
                  checked={preferences.newsletter}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, newsletter: checked as boolean })
                  }
                />
                <Label htmlFor="newsletter" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium">Monthly newsletter with deals and tips</span>
                </Label>
              </div>
            </div>

            {/* Email input */}
            <div className="mb-6">
              <Label htmlFor="email" className="mb-2 block font-semibold">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-lg"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold h-12 text-lg"
              >
                {isSubmitting ? "Signing Up..." : "Sign Me Up!"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="px-6"
              >
                Maybe Later
              </Button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

