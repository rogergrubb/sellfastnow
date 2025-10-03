import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MessageSquare } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

interface RespondToCancellationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commentId: string;
  listingTitle?: string;
  listingPrice?: string;
  originalComment: string;
  originalCommenterName?: string;
  onSuccess?: () => void;
}

export function RespondToCancellationModal({
  open,
  onOpenChange,
  commentId,
  listingTitle,
  listingPrice,
  originalComment,
  originalCommenterName,
  onSuccess,
}: RespondToCancellationModalProps) {
  const { toast } = useToast();
  const [responseText, setResponseText] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const respondMutation = useMutation({
    mutationFn: async (data: { responseText: string; isPublic: boolean }) => {
      return await apiRequest("POST", `/api/cancellations/${commentId}/response`, data);
    },
    onSuccess: () => {
      toast({
        title: "Response posted",
        description: "Your response has been added to the cancellation comment.",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setResponseText("");
      setIsPublic(true);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post response",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!responseText.trim()) {
      toast({
        title: "Response cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (responseText.length > 500) {
      toast({
        title: "Response too long",
        description: "Response must be 500 characters or less",
        variant: "destructive",
      });
      return;
    }

    respondMutation.mutate({
      responseText: responseText.trim(),
      isPublic,
    });
  };

  const characterCount = responseText.length;
  const maxChars = 500;
  const isOverLimit = characterCount > maxChars;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-respond-cancellation">
        <DialogHeader>
          <DialogTitle data-testid="heading-respond-cancellation">
            Respond to Cancellation Comment
          </DialogTitle>
          <DialogDescription>
            Add your response to help maintain clear communication
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Info */}
          {(listingTitle || listingPrice) && (
            <div className="border-b pb-3">
              <p className="text-sm font-medium" data-testid="text-transaction-info">
                Transaction: {listingTitle}
                {listingPrice && <span className="text-muted-foreground"> - {listingPrice}</span>}
              </p>
            </div>
          )}

          {/* Original Comment */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {originalCommenterName ? `${originalCommenterName}'s comment:` : "Original comment:"}
            </Label>
            <Card>
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground italic" data-testid="text-original-comment">
                  "{originalComment}"
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Response Input */}
          <div>
            <Label htmlFor="response-text" className="text-sm font-medium mb-2 block">
              Your response:
            </Label>
            <Textarea
              id="response-text"
              data-testid="textarea-response"
              placeholder="Thanks for explaining! I completely understand..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className={`min-h-[120px] ${isOverLimit ? 'border-destructive' : ''}`}
            />
            <p
              className={`text-sm mt-1 ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}
              data-testid="text-char-count"
            >
              {characterCount} / {maxChars} characters
            </p>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="response-public"
              data-testid="checkbox-response-public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="response-public"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Make this response public
              </label>
              <p className="text-sm text-muted-foreground">
                Recommended - shows you're professional and helps build your reputation
              </p>
            </div>
          </div>

          {/* Tips */}
          <Card className="bg-muted/50">
            <CardContent className="p-3">
              <p className="text-sm font-medium mb-2">Tips for good responses:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Be professional and courteous</li>
                <li>Acknowledge their explanation</li>
                <li>Keep it brief</li>
                <li>No personal attacks</li>
              </ul>
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          {isPublic && (
            <p className="text-xs text-muted-foreground">
              Note: Your response will be visible on both your profile and{" "}
              {originalCommenterName ? `${originalCommenterName}'s` : "the other party's"} profile.
              Being understanding builds your reputation.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={respondMutation.isPending}
            data-testid="button-cancel-response"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={respondMutation.isPending || !responseText.trim() || isOverLimit}
            data-testid="button-post-response"
          >
            {respondMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Post Response
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
