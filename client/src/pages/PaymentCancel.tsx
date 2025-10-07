import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <XCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle>Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges were made to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            You can try again whenever you're ready. Your items are still saved.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => setLocation('/post-ad')} 
              className="w-full"
              data-testid="button-try-again"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => setLocation('/')} 
              variant="outline"
              className="w-full"
              data-testid="button-back-home"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
