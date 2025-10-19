import { Mail, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailVerificationPromptProps {
  email: string;
  onResendEmail?: () => void;
  isResending?: boolean;
}

export function EmailVerificationPrompt({ 
  email, 
  onResendEmail,
  isResending = false 
}: EmailVerificationPromptProps) {
  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription className="text-base">
            We've sent a verification link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step-by-step instructions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Next Steps:</h3>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Open your email inbox</p>
                  <p className="text-sm text-muted-foreground">
                    Look for an email from SellFast.Now with the subject "Verify your email address"
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Click the verification link</p>
                  <p className="text-sm text-muted-foreground">
                    This will confirm your email address and activate your account
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Return to SellFast.Now and sign in</p>
                  <p className="text-sm text-muted-foreground">
                    After verifying, sign in and complete your profile setup
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Spam folder warning */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Can't find the email?</strong> Check your spam or junk folder. 
              Sometimes verification emails end up there. If you still don't see it, 
              you can request a new verification email below.
            </AlertDescription>
          </Alert>

          {/* Success indicator */}
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex gap-2 items-start">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900 dark:text-green-100">
                  Account created successfully!
                </p>
                <p className="text-green-700 dark:text-green-300 mt-1">
                  Your account has been created. Just verify your email to get started.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onResendEmail}
              disabled={isResending}
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
            
            <Button
              className="flex-1"
              onClick={() => window.location.href = '/sign-in'}
            >
              Go to Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Additional help */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help?{" "}
              <a href="mailto:support@sellfast.now" className="text-primary hover:underline">
                Contact support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

