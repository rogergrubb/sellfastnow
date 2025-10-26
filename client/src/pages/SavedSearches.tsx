import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Mail, MessageSquare, Trash2, Edit, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SaveSearchModal from "@/components/SaveSearchModal";

export default function SavedSearches() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSearch, setEditingSearch] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: searches = [], isLoading } = useQuery({
    queryKey: ["/api/saved-searches"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches"] });
      toast({ title: "Search alert deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/saved-searches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches"] });
      toast({ title: "Alert updated" });
    },
  });

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Saved Search Alerts</h1>
          <p className="text-muted-foreground">Get notified when new listings match your criteria</p>
        </div>
        <Button onClick={() => { setEditingSearch(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Alert
        </Button>
      </div>

      {searches.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No saved searches yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a search alert to get notified when new listings match your criteria
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Alert
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searches.map((search: any) => (
            <Card key={search.id} className={!search.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{search.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleMutation.mutate({ id: search.id, isActive: search.isActive })}
                  >
                    {search.isActive ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {search.searchQuery && (
                  <div className="text-sm">
                    <span className="font-medium">Keywords:</span> {search.searchQuery}
                  </div>
                )}
                {search.category && (
                  <Badge variant="secondary">{search.category}</Badge>
                )}
                {(search.priceMin || search.priceMax) && (
                  <div className="text-sm">
                    <span className="font-medium">Price:</span> ${search.priceMin || 0} - ${search.priceMax || "∞"}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {search.emailNotifications && <Mail className="h-4 w-4" />}
                  {search.smsNotifications && <MessageSquare className="h-4 w-4" />}
                  <span>{search.notificationFrequency}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setEditingSearch(search); setIsModalOpen(true); }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(search.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SaveSearchModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingSearch(null); }}
        editingSearch={editingSearch}
      />
    </div>
  );
}
