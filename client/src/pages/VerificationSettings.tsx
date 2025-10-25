// Verification Settings Page
import { useEffect, useState } from "react";
import { Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmailVerification } from "@/components/EmailVerification";
import { PhoneVerification } from "@/components/PhoneVerification";
import { TrustScore } from "@/components/VerificationBadge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface VerificationStatus {
  emailVerified: boolean;
  phoneVerified: boolean;
  idVerified: boolean;
  addressVerified: boolean;
  verifiedAt?: string;
  isFullyVerified: boolean;
}

interface User {
  email?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  idVerified?: boolean;
  addressVerified?: boolean;
}

export default function VerificationSettings() {
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const fetchVerificationStatus = async () => {
    try {
      const [statusResponse, userResponse] = await Promise.all([
        fetch("/api/verification/status", { credentials: "include" }),
        fetch("/api/auth/user", { credentials: "include" }),
      ]);

      if (statusResponse.ok && userResponse.ok) {
        const statusData = await statusResponse.json();
        const userData = await userResponse.json();
        setVerificationStatus(statusData);
        setUser(userData);
      } else {
        toast({
          title: "Error",
          description: "Failed to load verification status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
      toast({
        title: "Error",
        description: "Failed to load verification status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const handleVerificationComplete = () => {
    fetchVerificationStatus();
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!verificationStatus || !user) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Failed to load verification settings. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Account Verification
        </h1>
        <p className="text-muted-foreground mt-2">
          Verify your account to build trust and unlock additional features.
        </p>
      </div>

      {/* Trust Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
          <CardDescription>
            Your current verification level and trust score
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Trust Score</h3>
              <p className="text-sm text-muted-foreground">
                Complete verifications to increase your trust score
              </p>
            </div>
            <TrustScore
              user={{
                emailVerified: verificationStatus.emailVerified,
                phoneVerified: verificationStatus.phoneVerified,
                idVerified: verificationStatus.idVerified,
                addressVerified: verificationStatus.addressVerified,
              }}
              size="lg"
              showPercentage={true}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              {verificationStatus.emailVerified ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="font-medium">Email</p>
                <p className="text-xs text-muted-foreground">
                  {verificationStatus.emailVerified ? "Verified" : "Not verified"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border">
              {verificationStatus.phoneVerified ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-xs text-muted-foreground">
                  {verificationStatus.phoneVerified ? "Verified" : "Not verified"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border">
              {verificationStatus.idVerified ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="font-medium">ID</p>
                <p className="text-xs text-muted-foreground">
                  {verificationStatus.idVerified ? "Verified" : "Coming soon"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border">
              {verificationStatus.addressVerified ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="font-medium">Address</p>
                <p className="text-xs text-muted-foreground">
                  {verificationStatus.addressVerified ? "Verified" : "Coming soon"}
                </p>
              </div>
            </div>
          </div>

          {verificationStatus.isFullyVerified && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-300">
                    Fully Verified Account
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Congratulations! Your account is fully verified. This increases your
                    trustworthiness and unlocks all platform features.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Verification */}
      <EmailVerification
        email={user.email || ""}
        isVerified={verificationStatus.emailVerified}
        onVerificationComplete={handleVerificationComplete}
      />

      {/* Phone Verification */}
      <PhoneVerification
        phoneNumber={user.phoneNumber}
        isVerified={verificationStatus.phoneVerified}
        onVerificationComplete={handleVerificationComplete}
      />

      {/* Benefits Section */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits of Verification</CardTitle>
          <CardDescription>
            Why you should verify your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Build Trust</p>
                <p className="text-sm text-muted-foreground">
                  Verified accounts are more trustworthy and get more responses
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Unlock Features</p>
                <p className="text-sm text-muted-foreground">
                  Access premium features and higher transaction limits
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Enhanced Security</p>
                <p className="text-sm text-muted-foreground">
                  Protect your account with multi-factor authentication
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Priority Support</p>
                <p className="text-sm text-muted-foreground">
                  Get faster response times from our support team
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

