// Phone Verification Component
import { useState } from "react";
import { Phone, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface PhoneVerificationProps {
  phoneNumber?: string;
  isVerified: boolean;
  onVerificationComplete?: () => void;
}

export function PhoneVerification({
  phoneNumber: initialPhone,
  isVerified,
  onVerificationComplete,
}: PhoneVerificationProps) {
  const [step, setStep] = useState<"input" | "verify">("input");
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const { toast } = useToast();

  const handleSendCode = async () => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/verification/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setCodeSent(true);
        setStep("verify");
        toast({
          title: "Code Sent",
          description: data.message || "Please check your phone for the verification code.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/verification/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber, code }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || "Phone number verified successfully!",
        });
        onVerificationComplete?.();
      } else {
        toast({
          title: "Error",
          description: data.error || "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      toast({
        title: "Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setCode("");
    await handleSendCode();
  };

  const handleChangeNumber = () => {
    setStep("input");
    setCode("");
    setCodeSent(false);
  };

  if (isVerified) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 dark:text-green-300">
          Your phone number <strong>{initialPhone}</strong> is verified.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Verify Your Phone Number
        </CardTitle>
        <CardDescription>
          Verify your phone number to increase your account security and enable SMS notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "input" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter your phone number in international format (e.g., +1234567890)
              </p>
            </div>

            <Button
              onClick={handleSendCode}
              disabled={loading || !phoneNumber}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Send Verification Code
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Code sent to <strong>{phoneNumber}</strong>
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Enter the 6-digit code you received via SMS.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={loading}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
              <Button
                onClick={handleChangeNumber}
                disabled={loading}
                variant="outline"
              >
                Change Number
              </Button>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <button
                onClick={handleResendCode}
                disabled={loading}
                className="hover:underline disabled:opacity-50"
              >
                Resend Code
              </button>
              <span>Code expires in 10 minutes</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

