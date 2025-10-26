import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SaveDraftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId: string;
  metadata?: {
    title?: string;
    objectTypes?: string[];
    geolocation?: string;
    timestamp?: string;
  };
  onSave: (collectionName: string, subsetName?: string) => Promise<void>;
}

export function SaveDraftModal({
  open,
  onOpenChange,
  draftId,
  metadata,
  onSave,
}: SaveDraftModalProps) {
  const { toast } = useToast();
  const [collectionName, setCollectionName] = useState("");
  const [subsetName, setSubsetName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [segment, setSegment] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMonetization, setShowMonetization] = useState(false);
  const [monetizationOffer, setMonetizationOffer] = useState<any>(null);

  // Fetch AI suggestions when modal opens
  useEffect(() => {
    if (open && metadata) {
      fetchSuggestions();
    }
  }, [open, metadata]);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch("/api/ai/suggestCollections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          objectTypes: metadata?.objectTypes || [],
          geolocation: metadata?.geolocation,
          timestamp: metadata?.timestamp,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setSegment(data.segmentPrediction);

        // Fetch monetization offer if segment detected
        if (data.segmentPrediction && data.segmentPrediction !== "general") {
          fetchMonetizationOffer(data.segmentPrediction);
        }
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      // Fallback suggestions
      setSuggestions([
        "My Collection",
        "Draft Items",
        "Unsorted Drafts",
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchMonetizationOffer = async (segmentType: string) => {
    try {
      const response = await fetch(`/api/monetization/offer/${segmentType}`, {
        credentials: "include",
      });

      if (response.ok) {
        const offer = await response.json();
        setMonetizationOffer(offer);
        setShowMonetization(true);

        // Log view event
        await fetch("/api/monetization/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            eventType: "view",
            segment: segmentType,
            offerType: offer.offerType,
          }),
        });
      }
    } catch (error) {
      console.error("Error fetching monetization offer:", error);
    }
  };

  const handleSave = async () => {
    if (!collectionName.trim()) {
      toast({
        title: "Collection name required",
        description: "Please enter a collection name or select a suggestion",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await onSave(collectionName.trim(), subsetName.trim() || undefined);
      
      toast({
        title: "Draft saved!",
        description: `Saved to "${collectionName}"${subsetName ? ` → ${subsetName}` : ""}`,
      });

      onOpenChange(false);
      
      // Reset form
      setCollectionName("");
      setSubsetName("");
      setSuggestions([]);
      setSegment(null);
      setShowMonetization(false);
    } catch (error: any) {
      toast({
        title: "Failed to save draft",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMonetizationClick = async () => {
    if (segment && monetizationOffer) {
      // Log click event
      await fetch("/api/monetization/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventType: "click",
          segment,
          offerType: monetizationOffer.offerType,
        }),
      });

      // TODO: Open upsell modal or redirect to upgrade page
      toast({
        title: "Coming soon!",
        description: "This feature will be available soon.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Draft</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Collection Name */}
          <div className="space-y-2">
            <Label htmlFor="collection">Collection</Label>
            <Input
              id="collection"
              placeholder="e.g., Garage Sale, Flip Batch, Home Inventory"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
            />
          </div>

          {/* AI Suggestions */}
          {loadingSuggestions ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating suggestions...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI Suggestions:
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setCollectionName(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Subset Name */}
          <div className="space-y-2">
            <Label htmlFor="subset">
              Subset <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="subset"
              placeholder="e.g., Tools, Furniture, Photos"
              value={subsetName}
              onChange={(e) => setSubsetName(e.target.value)}
            />
          </div>

          {/* Monetization Banner */}
          {showMonetization && monetizationOffer && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-purple-900">
                    {monetizationOffer.offerDescription}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-purple-600 hover:text-purple-700"
                    onClick={handleMonetizationClick}
                  >
                    {monetizationOffer.ctaText} →
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !collectionName.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save to Collection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

