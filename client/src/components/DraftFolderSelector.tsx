import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, FolderOpen, FolderPlus, Folders } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { CreateFolderModal } from "@/components/CreateFolderModal";

interface DraftFolder {
  batchId: string;
  batchTitle: string;
  count: number;
}

interface DraftFolderSelectorProps {
  selectedFolder: string | null; // null = "All Draft Folders"
  onFolderSelect: (batchId: string | null) => void;
  className?: string;
}

export function DraftFolderSelector({
  selectedFolder,
  onFolderSelect,
  className = "",
}: DraftFolderSelectorProps) {
  const { getToken } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch available draft folders using React Query
  const { data: foldersData, isLoading: loading, refetch } = useQuery({
    queryKey: ["/api/listings/draft-folders"],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch("/api/listings/draft-folders", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch draft folders");
      }

      const data = await response.json();
      return data.folders || [];
    },
    staleTime: 0, // Always refetch when query is invalidated
    refetchOnMount: true, // Refetch when component mounts
  });

  const folders = foldersData || [];

  // Get display label for button
  const getButtonLabel = () => {
    if (selectedFolder === null) {
      return "All Draft Folders";
    }
    
    const folder = folders.find(f => f.batchId === selectedFolder);
    return folder ? folder.batchTitle : "Draft Folders";
  };

  const totalDrafts = folders.reduce((sum, f) => sum + f.count, 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`bg-red-500 hover:bg-red-600 text-white border-red-600 hover:border-red-700 ${className}`}
        >
          <Folders className="h-4 w-4 mr-2" />
          {getButtonLabel()}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Draft Folders</span>
          {totalDrafts > 0 && (
            <span className="text-xs text-muted-foreground">
              {totalDrafts} total
            </span>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {/* All Draft Folders option */}
        <DropdownMenuItem
          onClick={() => onFolderSelect(null)}
          className={selectedFolder === null ? "bg-accent" : ""}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          <span className="flex-1">All Draft Folders</span>
          {totalDrafts > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              {totalDrafts}
            </span>
          )}
        </DropdownMenuItem>

        {folders.length > 0 && <DropdownMenuSeparator />}

        {/* Individual folders */}
        {folders.map((folder) => (
          <DropdownMenuItem
            key={folder.batchId}
            onClick={() => onFolderSelect(folder.batchId)}
            className={selectedFolder === folder.batchId ? "bg-accent" : ""}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            <span className="flex-1 truncate">{folder.batchTitle}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {folder.count}
            </span>
          </DropdownMenuItem>
        ))}

        {folders.length === 0 && !loading && (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No draft folders yet
          </div>
        )}

        {loading && (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        )}

        {/* Create New Folder option */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setShowCreateModal(true)}
          className="text-red-600 font-medium"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Create New Folder
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* Create Folder Modal */}
      <CreateFolderModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onFolderCreated={(batchId, batchTitle) => {
          // Refresh folder list
          refetch();
          // Select the newly created folder
          onFolderSelect(batchId);
        }}
      />
    </DropdownMenu>
  );
}

