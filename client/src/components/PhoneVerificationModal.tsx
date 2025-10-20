import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onSuccess: () => void;
}

export function PhoneVerificationModal({
  isOpen,
  onClose,
  phoneNumber,
  onSuccess,
}: PhoneVerificationModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'send' | 'verify' | 'success'>('send');
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('send');
      setCode('');
      setCountdown(0);
    }
  }, [isOpen]);

  const handleSendCode = async () => {
    setIsSending(true);
    try {
      // Format phone number to E.164 format
      let formattedPhone = phoneNumber.trim();
      
      // Remove all non-digit characters
      const digits = formattedPhone.replace(/\D/g, '');
      
      // Add country code if missing (assume US +1)
      if (digits.length === 10) {
        formattedPhone = `+1${digits}`;
      } else if (digits.length === 11 && digits.startsWith('1')) {
        formattedPhone = `+${digits}`;
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${digits}`;
      }
      
      console.log('📱 Sending OTP to:', formattedPhone);
      console.log('📝 Original phone:', phoneNumber);
      
      // Use Supabase Phone Auth to send OTP
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        console.error('❌ Supabase OTP error:', error);
        throw error;
      }

      console.log('✅ OTP sent:', data);

      toast({
        title: "Code sent!",
        description: `A 6-digit code has been sent to ${phoneNumber}`,
      });

      setStep('verify');
      setCountdown(60); // 60 second cooldown before resend
    } catch (error: any) {
      console.error('❌ Error sending code:', error);
      
      let errorMessage = error.message || "Failed to send verification code";
      
      // Handle specific Supabase errors
      if (error.message?.includes('rate limit')) {
        errorMessage = "Too many attempts. Please wait a few minutes and try again.";
      } else if (error.message?.includes('Phone provider not configured')) {
        errorMessage = "Phone verification is not configured. Please contact support.";
      } else if (error.message?.includes('Invalid phone number')) {
        errorMessage = "Invalid phone number format. Please use format: +1234567890";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      // Format phone number to E.164 format (same as send)
      let formattedPhone = phoneNumber.trim();
      const digits = formattedPhone.replace(/\D/g, '');
      
      if (digits.length === 10) {
        formattedPhone = `+1${digits}`;
      } else if (digits.length === 11 && digits.startsWith('1')) {
        formattedPhone = `+${digits}`;
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${digits}`;
      }
      
      console.log('🔐 Verifying OTP code for:', formattedPhone);
      
      // Use Supabase to verify the OTP
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: 'sms',
      });

      if (error) {
        console.error('❌ Supabase verify error:', error);
        throw error;
      }

      console.log('✅ Phone verified:', data);

      // Update user's phoneVerified status in our database
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (token) {
        try {
          await fetch("/api/user/settings", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ 
              phoneVerified: true,
              verifiedAt: new Date().toISOString()
            }),
          });
        } catch (err) {
          console.error('Warning: Failed to update phoneVerified status:', err);
          // Don't fail the verification if database update fails
        }
      }

      toast({
        title: "Phone verified!",
        description: "Your phone number has been successfully verified.",
      });

      setStep('success');
      
      // Call success callback and close after a short delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('❌ Error verifying code:', error);
      
      let errorMessage = error.message || "Invalid verification code";
      
      if (error.message?.includes('expired')) {
        errorMessage = "Code has expired. Please request a new code.";
      } else if (error.message?.includes('invalid')) {
        errorMessage = "Invalid code. Please check and try again.";
      }
      
      toast({
        title: "Verification failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    setCode('');
    handleSendCode();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Verify Phone Number
          </DialogTitle>
          <DialogDescription>
            {step === 'send' && `We'll send a verification code to ${phoneNumber}`}
            {step === 'verify' && `Enter the 6-digit code sent to ${phoneNumber}`}
            {step === 'success' && 'Phone number verified successfully!'}
          </DialogDescription>
        </DialogHeader>

        {step === 'send' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={phoneNumber} disabled />
            </div>
            <p className="text-sm text-muted-foreground">
              Standard SMS rates may apply. You'll receive a 6-digit verification code.
            </p>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && code.length === 6) {
                    handleVerifyCode();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Didn't receive the code?
              </span>
              {countdown > 0 ? (
                <span className="text-muted-foreground">
                  Resend in {countdown}s
                </span>
              ) : (
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={handleResend}
                  disabled={isSending}
                >
                  Resend code
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-lg font-semibold">Verification Complete!</p>
          </div>
        )}

        <DialogFooter>
          {step === 'send' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSendCode} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Code'
                )}
              </Button>
            </>
          )}

          {step === 'verify' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleVerifyCode} 
                disabled={isVerifying || code.length !== 6}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

