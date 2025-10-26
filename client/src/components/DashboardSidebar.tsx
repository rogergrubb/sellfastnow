import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Clock, 
  FolderOpen, 
  ChevronRight,
  ChevronDown,
  Plus, 
  Trash2,
  Home as HomeIcon,
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
  onDeleteMultipleClick: () => void;
  isSelectMode: boolean;
}

export function DashboardSidebar({
  listingFilter,
  selectedFolder,
  onFilterChange,
  onFolderSelect,
  onDeleteMultipleClick,
  isSelectMode,
}: DashboardSidebarProps) {
  const { getToken } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draftsExpanded, setDraftsExpanded] = useState(true);

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

  // Icon mapping for folder names (can be customized)
  const getFolderIcon = (folderName: string) => {
    const lowerName = folderName.toLowerCase();
    if (lowerName.includes('coin')) return '🪙';
    if (lowerName.includes('garage') || lowerName.includes('sale')) return '🏠';
    if (lowerName.includes('furniture')) return '🪑';
    if (lowerName.includes('electronics')) return '📱';
    if (lowerName.includes('clothes') || lowerName.includes('clothing')) return '👕';
    return '📁';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 space-y-1 sticky top-0 h-screen overflow-y-auto">
      {/* SellFast Logo */}
      <div className="flex items-center gap-2 mb-8">
        <HomeIcon className="h-8 w-8 text-teal-600" />
        <span className="text-2xl font-bold">SellFast</span>
      </div>

      {/* My Listings Header */}
      <div className="text-2xl font-bold mb-6">My Listings</div>

      {/* Active Button */}
      <button
        onClick={() => {
          onFilterChange("active");
          onFolderSelect(null);
        }}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
          listingFilter === "active" 
            ? "bg-gray-100 font-medium" 
            : "hover:bg-gray-50"
        )}
        data-testid="sidebar-button-active"
      >
        <HomeIcon className="h-5 w-5 text-gray-600" />
        <span className="text-lg">Active</span>
      </button>

      {/* Sold Button */}
      <button
        onClick={() => {
          onFilterChange("sold");
          onFolderSelect(null);
        }}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
          listingFilter === "sold" 
            ? "bg-gray-100 font-medium" 
            : "hover:bg-gray-50"
        )}
        data-testid="sidebar-button-sold"
      >
        <Package className="h-5 w-5 text-gray-600" />
        <span className="text-lg">Sold</span>
      </button>

      {/* Expired Button */}
      <button
        onClick={() => {
          onFilterChange("expired");
          onFolderSelect(null);
        }}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
          listingFilter === "expired" 
            ? "bg-gray-100 font-medium" 
            : "hover:bg-gray-50"
        )}
        data-testid="sidebar-button-expired"
      >
        <Clock className="h-5 w-5 text-gray-600" />
        <span className="text-lg">Expired</span>
      </button>

      {/* Drafts Section */}
      <div className="py-2">
        <button
          onClick={() => setDraftsExpanded(!draftsExpanded)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
            listingFilter === "draft" && selectedFolder === null
              ? "bg-gray-100 font-medium" 
              : "hover:bg-gray-50"
          )}
          data-testid="sidebar-button-drafts"
        >
          <FolderOpen className="h-5 w-5 text-gray-600" />
          <span className="text-lg flex-1">Drafts</span>
          {draftsExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {/* Draft Folders List */}
        {draftsExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {foldersLoading ? (
              <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
            ) : sortedFolders.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">No folders yet</div>
            ) : (
              sortedFolders.map((folder) => (
                <button
                  key={folder.batchId}
                  onClick={() => {
                    onFilterChange("draft");
                    onFolderSelect(folder.batchId);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors",
                    listingFilter === "draft" && selectedFolder === folder.batchId
                      ? "bg-gray-100 font-medium" 
                      : "hover:bg-gray-50"
                  )}
                  data-testid={`sidebar-button-folder-${folder.batchId}`}
                >
                  <span className="text-xl">{getFolderIcon(folder.batchTitle)}</span>
                  <span className="flex-1 truncate">{folder.batchTitle}</span>
                </button>
              ))
            )}

            {/* Create New Folder */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-50 rounded-lg"
              data-testid="sidebar-button-create-folder"
            >
              <span className="text-base text-gray-700">Create New Folder</span>
            </button>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="py-4"></div>

      {/* Create New Listing */}
      <Link href="/post-ad">
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-50"
          data-testid="sidebar-button-create-new"
        >
          <Plus className="h-5 w-5 text-gray-600" />
          <span className="text-lg">Create New Listing</span>
        </button>
      </Link>

      {/* Delete Multiple Items */}
      {!isSelectMode && (
        <button
          onClick={onDeleteMultipleClick}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-50"
          data-testid="sidebar-button-delete-multiple"
        >
          <Trash2 className="h-5 w-5 text-gray-600" />
          <span className="text-lg">Delete Multiple Items</span>
        </button>
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onFolderCreated={(batchId, batchTitle) => {
          // Select the newly created folder
          onFilterChange("draft");
          onFolderSelect(batchId);
          setDraftsExpanded(true); // Ensure drafts section is expanded
        }}
      />
    </div>
  );
}

