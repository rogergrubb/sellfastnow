import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FolderPlus, FolderOpen } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface DraftFolder {
  id: string;
  name: string;
  listingsCount: number;
}

interface FolderSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (folderId: string, folderName: string) => Promise<void>;
}

export function FolderSelectionModal({
  open,
  onOpenChange,
  onSave,
}: FolderSelectionModalProps) {
  const { getToken } = useAuth();
  const [mode, setMode] = useState<"existing" | "new">("new");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [folders, setFolders] = useState<DraftFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch available folders when modal opens
  useEffect(() => {
    if (open) {
      fetchFolders();
    }
  }, [open]);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch("/api/draft-folders", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
        
        // Default to "new" if no folders exist, otherwise "existing"
        if (data.folders && data.folders.length > 0) {
          setMode("existing");
          setSelectedFolder(data.folders[0].id);
        } else {
          setMode("new");
        }
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (mode === "existing" && !selectedFolder) {
      return;
    }

    if (mode === "new" && !newFolderName.trim()) {
      return;
    }

    setSaving(true);
    try {
      let folderId: string;
      let folderName: string;

      if (mode === "existing") {
        const folder = folders.find(f => f.id === selectedFolder);
        if (!folder) return;
        
        folderId = folder.id;
        folderName = folder.name;
      } else {
        // Create new folder via API
        const token = await getToken();
        const response = await fetch("/api/draft-folders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            name: newFolderName.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create folder");
        }

        const data = await response.json();
        folderId = data.folder.id;
        folderName = data.folder.name;
      }

      await onSave(folderId, folderName);
      onOpenChange(false);
      
      // Reset form
      setNewFolderName("");
      setSelectedFolder("");
    } catch (error) {
      console.error("Error saving to folder:", error);
    } finally {
      setSaving(false);
    }
  };

  const canSave = 
    (mode === "existing" && selectedFolder) ||
    (mode === "new" && newFolderName.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Draft to Folder</DialogTitle>
          <DialogDescription>
            Choose an existing folder or create a new one to organize your draft
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "existing" | "new")}>
              {/* Add to Existing Folder */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="existing" disabled={folders.length === 0} />
                  <Label htmlFor="existing" className={`flex items-center cursor-pointer ${folders.length === 0 ? 'opacity-50' : ''}`}>
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Add to Existing Folder
                  </Label>
                </div>

                {mode === "existing" && folders.length > 0 && (
                  <div className="ml-6 space-y-2">
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a folder" />
                      </SelectTrigger>
                      <SelectContent>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name} ({folder.listingsCount} items)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {mode === "existing" && folders.length === 0 && (
                  <div className="ml-6 text-sm text-muted-foreground">
                    No existing folders. Create a new one below.
                  </div>
                )}
              </div>

              {/* Create New Folder */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new" className="flex items-center cursor-pointer">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create New Folder
                  </Label>
                </div>

                {mode === "new" && (
                  <div className="ml-6 space-y-2">
                    <Input
                      placeholder="e.g., Old Coins, Garage Sale Items"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      Give your folder a descriptive name
                    </p>
                  </div>
                )}
              </div>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="bg-red-600 hover:bg-red-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save to Folder"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

