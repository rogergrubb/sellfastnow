import { useState } from "react";
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
import { FolderPlus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface CreateFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFolderCreated: (batchId: string, batchTitle: string) => void;
}

export function CreateFolderModal({
  open,
  onOpenChange,
  onFolderCreated,
}: CreateFolderModalProps) {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [folderName, setFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!folderName.trim()) {
      return;
    }

    setIsCreating(true);

    try {
      // Generate unique batch_id
      const timestamp = Date.now();
      const sanitized = folderName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      const batchId = `${sanitized}_${timestamp}`;
      const batchTitle = folderName.trim();

      // Create a placeholder draft listing to establish the folder
      const token = await getToken();
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          title: `${batchTitle} - Folder Placeholder`,
          description: "This is a placeholder listing for the folder. You can delete it or add your items.",
          price: "0",
          category: "Other",
          condition: "good",
          location: "Local Area",
          images: [],
          status: "draft",
          batchId: batchId,
          batchTitle: batchTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create folder");
      }

      // Invalidate queries to refresh the folder list
      await queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/listings/mine"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/listings/draft-folders"] });

      // Call the callback with the new folder info
      onFolderCreated(batchId, batchTitle);

      toast({
        title: "Folder Created",
        description: `"${batchTitle}" folder has been created successfully.`,
      });

      // Reset and close
      setFolderName("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setFolderName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-red-600" />
            Create New Folder
          </DialogTitle>
          <DialogDescription>
            Create a new folder to organize your draft listings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="e.g., Garage Sale Items"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && folderName.trim()) {
                  handleCreate();
                }
              }}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Give your folder a descriptive name
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!folderName.trim() || isCreating}
            className="bg-red-600 hover:bg-red-700"
          >
            {isCreating ? "Creating..." : "Create Folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

