// Email Verification Component
import { useState } from "react";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationProps {
  email: string;
  isVerified: boolean;
  onVerificationComplete?: () => void;
}

export function EmailVerification({
  email,
  isVerified,
  onVerificationComplete,
}: EmailVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSendVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/verification/email/send", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
        toast({
          title: "Verification Email Sent",
          description: data.message || "Please check your inbox for the verification link.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send verification email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/verification/email/resend", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Verification Email Resent",
          description: data.message || "Please check your inbox.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to resend verification email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resending verification email:", error);
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 dark:text-green-300">
          Your email address <strong>{email}</strong> is verified.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Verify Your Email
        </CardTitle>
        <CardDescription>
          Verify your email address to increase your account security and trustworthiness.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>{email}</strong>
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Click the button below to receive a verification link via email.
            </p>
          </div>
        </div>

        {sent && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Verification email sent! Please check your inbox and click the verification link.
              The link will expire in 24 hours.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {!sent ? (
            <Button
              onClick={handleSendVerification}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Verification Email
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleResend}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                "Resend Email"
              )}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Didn't receive the email? Check your spam folder or click resend.
        </p>
      </CardContent>
    </Card>
  );
}

