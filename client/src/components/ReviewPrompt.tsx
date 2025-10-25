// Review Prompt Component - Shows after transaction completion
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "./ReviewForm";
import { Star, X } from "lucide-react";

interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: string;
  createdAt: string;
  listing?: {
    title: string;
  };
  buyer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  seller?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export function ReviewPrompt() {
  const { user } = useAuth();
  const [dismissedTransactions, setDismissedTransactions] = useState<string[]>([]);
  const [activeReviewTransaction, setActiveReviewTransaction] = useState<Transaction | null>(null);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  // Load dismissed transactions from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem("dismissedReviewPrompts");
    if (dismissed) {
      setDismissedTransactions(JSON.parse(dismissed));
    }
  }, []);

  // Fetch completed transactions that need reviews
  const { data: transactionsNeedingReview } = useQuery({
    queryKey: ["/api/transactions/need-review", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Fetch user's completed transactions
      const response = await fetch("/api/transactions", {
        headers,
        credentials: "include",
      });

      if (!response.ok) return [];

      const transactions: Transaction[] = await response.json();

      // Filter for completed transactions
      const completed = transactions.filter(
        (t) => t.status === "completed"
      );

      // Check which ones don't have reviews yet
      const needReview: Transaction[] = [];

      for (const transaction of completed) {
        // Check if user already reviewed this transaction
        const reviewResponse = await fetch(
          `/api/reviews/transaction/${transaction.id}`,
          {
            headers,
            credentials: "include",
          }
        );

        if (reviewResponse.ok) {
          const reviews = await reviewResponse.json();
          const userReview = reviews.find(
            (r: any) => r.reviewerId === user.id
          );

          if (!userReview && !dismissedTransactions.includes(transaction.id)) {
            needReview.push(transaction);
          }
        }
      }

      return needReview;
    },
    enabled: !!user,
    refetchInterval: 60000, // Check every minute
  });

  const handleDismiss = (transactionId: string) => {
    const updated = [...dismissedTransactions, transactionId];
    setDismissedTransactions(updated);
    localStorage.setItem("dismissedReviewPrompts", JSON.stringify(updated));
  };

  const handleReviewClick = (transaction: Transaction) => {
    setActiveReviewTransaction(transaction);
    setIsReviewFormOpen(true);
  };

  const handleReviewFormClose = () => {
    setIsReviewFormOpen(false);
    setActiveReviewTransaction(null);
  };

  if (!user || !transactionsNeedingReview || transactionsNeedingReview.length === 0) {
    return null;
  }

  // Show only the most recent transaction needing review
  const transaction = transactionsNeedingReview[0];
  const otherUser = transaction.buyerId === user.id ? transaction.seller : transaction.buyer;
  const userRole = transaction.buyerId === user.id ? "buyer" : "seller";

  if (!otherUser) return null;

  return (
    <>
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Leave a Review</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss(transaction.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            How was your experience with{" "}
            <span className="font-semibold">
              {otherUser.firstName} {otherUser.lastName}
            </span>
            ?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">{transaction.listing?.title}</p>
              <p className="text-muted-foreground">
                Transaction completed
              </p>
            </div>
            <Button onClick={() => handleReviewClick(transaction)}>
              Write Review
            </Button>
          </div>

          {transactionsNeedingReview.length > 1 && (
            <p className="text-xs text-muted-foreground mt-3">
              +{transactionsNeedingReview.length - 1} more transaction
              {transactionsNeedingReview.length - 1 !== 1 ? "s" : ""} waiting for review
            </p>
          )}
        </CardContent>
      </Card>

      {activeReviewTransaction && (
        <ReviewForm
          isOpen={isReviewFormOpen}
          onClose={handleReviewFormClose}
          transactionId={activeReviewTransaction.id}
          listingId={activeReviewTransaction.listingId}
          reviewedUserId={otherUser.id}
          reviewedUserName={`${otherUser.firstName} ${otherUser.lastName}`}
          reviewerRole={userRole}
        />
      )}
    </>
  );
}

