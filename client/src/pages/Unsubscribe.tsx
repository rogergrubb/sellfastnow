import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function Unsubscribe() {
  const [, params] = useRoute("/unsubscribe");
  const [, navigate] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const user = searchParams.get("user");
    setUserId(user);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/unsubscribe/review-reminders', userId],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Unsubscribing you from review reminders...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-center text-destructive">Unsubscribe Failed</CardTitle>
            <CardDescription className="text-center">
              We couldn't process your unsubscribe request. Please try again or contact support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full" data-testid="button-go-home">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-center">Successfully Unsubscribed</CardTitle>
          <CardDescription className="text-center">
            You've been unsubscribed from review reminder emails. You can re-enable these emails at any time from your account settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/")} className="w-full" data-testid="button-browse-listings">
            Browse Listings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
