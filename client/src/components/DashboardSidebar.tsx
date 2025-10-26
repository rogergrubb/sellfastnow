import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  FolderOpen, 
  Package, 
  Clock, 
  Plus, 
  Share2, 
  Trash2,
  Folders
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { CreateFolderModal } from "@/components/CreateFolderModal";
import { cn } from "@/lib/utils";

interface DraftFolder {
  batchId: string;
  batchTitle: string;
  count: number;
}

interface DashboardSidebarProps {
  listingFilter: string;
  selectedFolder: string | null;
  onFilterChange: (filter: string) => void;
  onFolderSelect: (batchId: string | null) => void;
  onShareClick: () => void;
  onDeleteMultipleClick: () => void;
  isSelectMode: boolean;
}

export function DashboardSidebar({
  listingFilter,
  selectedFolder,
  onFilterChange,
  onFolderSelect,
  onShareClick,
  onDeleteMultipleClick,
  isSelectMode,
}: DashboardSidebarProps) {
  const { getToken } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch available draft folders using React Query
  const { data: foldersData, isLoading: foldersLoading } = useQuery({
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
    staleTime: 0,
    refetchOnMount: true,
  });

  const folders = (foldersData || []) as DraftFolder[];
  
  // Sort folders alphabetically
  const sortedFolders = [...folders].sort((a, b) => 
    a.batchTitle.localeCompare(b.batchTitle)
  );

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 space-y-2 sticky top-0 h-screen overflow-y-auto">
      {/* Active Button */}
      <Button
        variant={listingFilter === "active" ? "default" : "outline"}
        className={cn(
          "w-full justify-start text-left",
          listingFilter === "active" && "bg-red-500 hover:bg-red-600 text-white"
        )}
        onClick={() => {
          onFilterChange("active");
          onFolderSelect(null);
        }}
        data-testid="sidebar-button-active"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Active
      </Button>

      {/* Draft Folders Section */}
      <div className="pt-4">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Draft Folders
        </div>
        
        {foldersLoading ? (
          <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
        ) : sortedFolders.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500">No folders yet</div>
        ) : (
          <div className="space-y-1">
            {sortedFolders.map((folder) => (
              <Button
                key={folder.batchId}
                variant={listingFilter === "draft" && selectedFolder === folder.batchId ? "default" : "outline"}
                className={cn(
                  "w-full justify-start text-left",
                  listingFilter === "draft" && selectedFolder === folder.batchId 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-white hover:bg-gray-100"
                )}
                onClick={() => {
                  onFilterChange("draft");
                  onFolderSelect(folder.batchId);
                }}
                data-testid={`sidebar-button-folder-${folder.batchId}`}
              >
                <FolderOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="flex-1 truncate">{folder.batchTitle}</span>
                <span className="text-xs ml-2 opacity-70">{folder.count}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Sold Button */}
      <Button
        variant={listingFilter === "sold" ? "default" : "outline"}
        className={cn(
          "w-full justify-start text-left",
          listingFilter === "sold" && "bg-red-500 hover:bg-red-600 text-white"
        )}
        onClick={() => {
          onFilterChange("sold");
          onFolderSelect(null);
        }}
        data-testid="sidebar-button-sold"
      >
        <Package className="h-4 w-4 mr-2" />
        Sold
      </Button>

      {/* Expired Button */}
      <Button
        variant={listingFilter === "expired" ? "default" : "outline"}
        className={cn(
          "w-full justify-start text-left",
          listingFilter === "expired" && "bg-red-500 hover:bg-red-600 text-white"
        )}
        onClick={() => {
          onFilterChange("expired");
          onFolderSelect(null);
        }}
        data-testid="sidebar-button-expired"
      >
        <Clock className="h-4 w-4 mr-2" />
        Expired
      </Button>

      {/* Divider */}
      <div className="border-t border-gray-300 my-4"></div>

      {/* Create New Button */}
      <Link href="/post-ad">
        <Button
          className="w-full justify-start text-left bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="sidebar-button-create-new"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </Link>

      {/* Create New Folder Button */}
      <Button
        variant="outline"
        className="w-full justify-start text-left bg-white hover:bg-gray-100"
        onClick={() => setShowCreateModal(true)}
        data-testid="sidebar-button-create-folder"
      >
        <Folders className="h-4 w-4 mr-2" />
        Create New Folder
      </Button>

      {/* Share Button */}
      {!isSelectMode && (
        <Button
          variant="outline"
          className="w-full justify-start text-left bg-white hover:bg-gray-100"
          onClick={onShareClick}
          data-testid="sidebar-button-share"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      )}

      {/* Delete Multiple Button */}
      {!isSelectMode && (
        <Button
          className="w-full justify-start text-left bg-red-600 hover:bg-red-700 text-white"
          onClick={onDeleteMultipleClick}
          data-testid="sidebar-button-delete-multiple"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Multiple
        </Button>
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onFolderCreated={(batchId, batchTitle) => {
          // Select the newly created folder
          onFilterChange("draft");
          onFolderSelect(batchId);
        }}
      />
    </div>
  );
}

