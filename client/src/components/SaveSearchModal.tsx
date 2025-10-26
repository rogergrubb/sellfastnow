import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface SaveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSearch?: any;
}

export default function SaveSearchModal({ isOpen, onClose, editingSearch }: SaveSearchModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    searchQuery: "",
    category: "",
    condition: "",
    priceMin: "",
    priceMax: "",
    location: "",
    distance: "",
    emailNotifications: true,
    smsNotifications: false,
    notificationFrequency: "instant",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (editingSearch) {
      setFormData({
        name: editingSearch.name || "",
        searchQuery: editingSearch.searchQuery || "",
        category: editingSearch.category || "",
        condition: editingSearch.condition || "",
        priceMin: editingSearch.priceMin?.toString() || "",
        priceMax: editingSearch.priceMax?.toString() || "",
        location: editingSearch.location || "",
        distance: editingSearch.distance?.toString() || "",
        emailNotifications: editingSearch.emailNotifications !== false,
        smsNotifications: editingSearch.smsNotifications === true,
        notificationFrequency: editingSearch.notificationFrequency || "instant",
      });
    } else {
      setFormData({
        name: "",
        searchQuery: "",
        category: "",
        condition: "",
        priceMin: "",
        priceMax: "",
        location: "",
        distance: "",
        emailNotifications: true,
        smsNotifications: false,
        notificationFrequency: "instant",
      });
    }
  }, [editingSearch, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingSearch
        ? `/api/saved-searches/${editingSearch.id}`
        : "/api/saved-searches";
      const method = editingSearch ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches"] });
      toast({ title: editingSearch ? "Alert updated" : "Alert created" });
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save alert", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Please enter a name for this alert", variant: "destructive" });
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingSearch ? "Edit" : "Create"} Search Alert</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Alert Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Vintage Cameras under $200"
              required
            />
          </div>

          <div>
            <Label htmlFor="searchQuery">Keywords</Label>
            <Input
              id="searchQuery"
              value={formData.searchQuery}
              onChange={(e) => setFormData({ ...formData, searchQuery: e.target.value })}
              placeholder="e.g., Canon, Nikon, vintage"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Any category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any category</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Vehicles">Vehicles</SelectItem>
                  <SelectItem value="Clothing">Clothing</SelectItem>
                  <SelectItem value="Books">Books</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Any condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any condition</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like-new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priceMin">Min Price ($)</Label>
              <Input
                id="priceMin"
                type="number"
                value={formData.priceMin}
                onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="priceMax">Max Price ($)</Label>
              <Input
                id="priceMax"
                type="number"
                value={formData.priceMax}
                onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                placeholder="No limit"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., New York, NY"
              />
            </div>
            <div>
              <Label htmlFor="distance">Distance (miles)</Label>
              <Input
                id="distance"
                type="number"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                placeholder="25"
              />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Notification Preferences</h4>

            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <Switch
                id="emailNotifications"
                checked={formData.emailNotifications}
                onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                {!user?.phoneVerified && (
                  <span className="text-xs text-muted-foreground">Phone verification required</span>
                )}
              </div>
              <Switch
                id="smsNotifications"
                checked={formData.smsNotifications}
                disabled={!user?.phoneVerified}
                onCheckedChange={(checked) => {
                  if (checked && !user?.phoneVerified) {
                    toast({
                      title: "Phone Verification Required",
                      description: "Please verify your phone number in settings to enable SMS alerts.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setFormData({ ...formData, smsNotifications: checked });
                }}
              />
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.notificationFrequency}
                onValueChange={(v) => setFormData({ ...formData, notificationFrequency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editingSearch ? "Update Alert" : "Create Alert"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
