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
  onFolderCreated: (folderId: string, folderName: string) => void;
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
      const token = await getToken();
      const response = await fetch("/api/draft-folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          name: folderName.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create folder");
      }

      const data = await response.json();
      const newFolder = data.folder;

      // Invalidate queries to refresh the folder list
      await queryClient.invalidateQueries({ queryKey: ["/api/draft-folders"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/listings/draft-folders"] });

      // Call the callback with the new folder info
      onFolderCreated(newFolder.id, newFolder.name);

      toast({
        title: "Folder Created",
        description: `"${newFolder.name}" folder has been created successfully.`,
      });

      // Reset and close
      setFolderName("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create folder. Please try again.",
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

