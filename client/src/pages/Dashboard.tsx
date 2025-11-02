import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Home,
  Heart,
  MessageCircle,
  Settings,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  Rocket,
  Menu,
  X,
  Share2,
  Upload,
  Star,
  ShoppingBag,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Listing, Message } from "@shared/schema";
import ListingCard from "@/components/ListingCard";
import { DashboardShareModal } from "@/components/DashboardShareModal";
import InlineListingEditor from "@/components/InlineListingEditor";
import { LeaveReviewModal } from "@/components/LeaveReviewModal";

type DashboardStats = {
  totalActive: number;
  totalViews: number;
  totalMessages: number;
  totalSold: number;
};

// Settings Form Component
function SettingsForm({ user }: { user: User }) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      return apiRequest("/api/users/profile", "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ firstName, lastName });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-settings">
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Enter first name"
          data-testid="input-first-name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Enter last name"
          data-testid="input-last-name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={user.email || ""}
          disabled
          className="bg-muted"
          data-testid="input-email"
        />
        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
      </div>
      <Button
        type="submit"
        disabled={updateProfileMutation.isPending}
        data-testid="button-save-profile"
      >
        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { getToken, user: authUser, loading: authLoading } = useAuth();
  const isSignedIn = !!authUser;
  const isLoaded = !authLoading;
  
  const [activeTab, setActiveTab] = useState("my-listings");
  const [listingFilter, setListingFilter] = useState("active");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null); // null = All Draft Folders
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingListing, setReviewingListing] = useState<Listing | null>(null);

  // Sync active tab and filter with URL query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    const filterParam = urlParams.get("filter");
    
    if (tabParam === "favorites" || tabParam === "settings") {
      setActiveTab(tabParam);
    } else {
      setActiveTab("my-listings");
    }
    
    // Set listing filter if provided in URL
    if (filterParam && ["all", "active", "draft", "sold", "expired"].includes(filterParam)) {
      setListingFilter(filterParam as "all" | "active" | "draft" | "sold" | "expired");
    }
  }, []);

  // Fetch current user with Bearer token auth
  const { data: user, isLoading: userLoading, isSuccess, isError } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const token = await getToken();
      console.log('🔑 Dashboard fetching user with token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('❌ Dashboard user fetch failed:', response.status);
        throw new Error(`Failed to fetch user: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Dashboard user fetch successful:', data?.id);
      return data;
    },
    retry: false,
    enabled: isLoaded && isSignedIn,
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/listings/stats"],
    enabled: !!user,
  });

  // Fetch unread message count
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: !!user,
    retry: false,
  });

  // Safely calculate unread count with proper type checking
  const unreadCount = Array.isArray(messages)
    ? messages.filter(m => m.receiverId === user?.id && !m.isRead).length
    : 0;

  // Fetch user's listings
  const { data: userListings = [], isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: ["/api/user/listings"],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch('/api/user/listings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch favorites
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<Listing[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user && activeTab === "favorites",
  });

  // Fetch purchases (transactions where user is buyer)
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions/buyer", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const token = await getToken();
      const response = await fetch(`/api/transactions/buyer/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch purchases: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!user && activeTab === "purchases",
  });

  // Delete listing mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      const response = await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete listing: ${response.status}`);
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings/stats"] });
      toast({
        title: "Success",
        description: "Listing deleted successfully",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const token = await getToken();
      console.log('🔑 Bulk delete - Token:', token ? 'present' : 'missing');
      console.log('🗑️ Attempting to delete listings:', ids);
      
      const results = await Promise.all(
        ids.map(async id => {
          const response = await fetch(`/api/listings/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed to delete ${id}:`, response.status, errorText);
          } else {
            console.log(`✅ Successfully deleted ${id}`);
          }
          
          return { response, id };
        })
      );
      
      const failed = results.filter(r => !r.response.ok);
      if (failed.length > 0) {
        const firstError = await failed[0].response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(firstError.message || `Failed to delete ${failed.length} listing(s)`);
      }
      
      return results;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings/stats"] });
      setSelectedListings([]);
      setIsSelectMode(false);
      toast({
        title: "Success",
        description: `${ids.length} listing(s) deleted successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete listings",
        variant: "destructive",
      });
    },
  });

  // Mark as sold mutation
  const markAsSoldMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      const response = await fetch(`/api/listings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'sold' }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark as sold: ${response.status}`);
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings/stats"] });
      toast({
        title: "Success",
        description: "Listing marked as sold",
      });
    },
  });

  const publishDraftMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      const response = await fetch(`/api/listings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to publish draft: ${response.status}`);
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings/stats"] });
      toast({
        title: "Success",
        description: "Listing published successfully!",
      });
    },
  });

  // Bulk publish all drafts mutation
  const bulkPublishMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const draftListings = filteredListings.filter(l => l.status === 'draft');
      
      if (draftListings.length === 0) {
        throw new Error('No draft listings to publish');
      }
      
      console.log(`📤 Publishing ${draftListings.length} draft listing(s)`);
      
      const results = await Promise.all(
        draftListings.map(async listing => {
          const response = await fetch(`/api/listings/${listing.id}/status`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'active' }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed to publish ${listing.id}:`, response.status, errorText);
          } else {
            console.log(`✅ Successfully published ${listing.id}`);
          }
          
          return { response, id: listing.id };
        })
      );
      
      const failed = results.filter(r => !r.response.ok);
      if (failed.length > 0) {
        throw new Error(`Failed to publish ${failed.length} listing(s)`);
      }
      
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings/stats"] });
      toast({
        title: "Success",
        description: `${results.length} draft(s) published successfully!`,
      });
      // Switch to Active tab to see published listings
      setListingFilter('active');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish drafts",
        variant: "destructive",
      });
    },
  });

  // Redirect if not signed in with Clerk
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      console.log('❌ Dashboard: User not signed in, redirecting to home');
      navigate("/");
      toast({
        title: "Authentication required",
        description: "Please log in to access your dashboard",
        variant: "destructive",
      });
    }
  }, [isLoaded, isSignedIn, navigate, toast]);

  // Redirect if API call fails or user not found (only after loading completes)
  useEffect(() => {
    // Only check after both auth and user query have loaded
    if (isLoaded && !userLoading) {
      if (isError || (isSuccess && !user)) {
        console.log('❌ Dashboard: User fetch failed or user not found, redirecting to home');
        navigate("/");
        toast({
          title: "Authentication required",
          description: "Please log in to access your dashboard",
          variant: "destructive",
        });
      }
    }
  }, [isLoaded, userLoading, isError, isSuccess, user, navigate, toast]);

  // Show loading state while checking auth
  if (authLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If not logged in or error, don't render (useEffect will redirect)
  if (!isSignedIn || !isSuccess || !user) {
    return null;
  }

  const currentUser = user;

  // Get user display name
  const userName =
    currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser.email || "User";

  const userInitials =
    currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
      : currentUser.email?.[0]?.toUpperCase() || "U";

  // Get formatted member since date
  const memberSince = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "N/A";

  // Filter and sort listings
  const filteredListings = userListings
    .filter((listing) => {
      if (listingFilter !== "all" && listing.status !== listingFilter) return false;
      if (searchQuery && !listing.title.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      // Filter by selected folder (only for drafts)
      if (listingFilter === "draft" && selectedFolder !== null) {
        if (listing.folderId !== selectedFolder) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (sortBy === "price-high") {
        return parseFloat(b.price) - parseFloat(a.price);
      } else if (sortBy === "price-low") {
        return parseFloat(a.price) - parseFloat(b.price);
      }
      return 0;
    });

  // Sidebar content
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* User Profile Section */}
      <div className="p-6 border-b">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-3" data-testid="avatar-user">
            <AvatarImage src={currentUser.profileImageUrl || ""} />
            <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold" data-testid="text-user-name">
            {userName}
          </h2>
          <p className="text-sm text-muted-foreground" data-testid="text-member-since">
            Member since {memberSince}
          </p>
          <Link href="/dashboard?tab=settings">
            <Button variant="ghost" size="sm" className="mt-2" data-testid="link-edit-profile">
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <Button
            variant={activeTab === "my-listings" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => {
              setActiveTab("my-listings");
              setSidebarOpen(false);
            }}
            data-testid="button-nav-my-listings"
          >
            <Home className="mr-2 h-4 w-4" />
            My Listings
          </Button>
          <Button
            variant={activeTab === "favorites" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => {
              setActiveTab("favorites");
              setSidebarOpen(false);
            }}
            data-testid="button-nav-favorites"
          >
            <Heart className="mr-2 h-4 w-4" />
            Favorites
          </Button>
          <Button
            variant={activeTab === "purchases" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => {
              setActiveTab("purchases");
              setSidebarOpen(false);
            }}
            data-testid="button-nav-purchases"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Purchases
          </Button>
          <Button
            variant={activeTab === "messages" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => {
              navigate("/messages");
            }}
            data-testid="button-nav-messages"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Messages
            {unreadCount > 0 && (
              <Badge className="ml-auto" variant="default">
                {unreadCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "settings" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => {
              setActiveTab("settings");
              setSidebarOpen(false);
            }}
            data-testid="button-nav-settings"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="overlay-sidebar"
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-60 bg-card border-r z-50 transform transition-transform duration-200 lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        data-testid="sidebar-dashboard"
      >
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="button-close-sidebar"
        >
          <X className="h-5 w-5" />
        </Button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-open-sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="w-10" />
        </div>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* My Listings Tab */}
            <TabsContent value="my-listings" className="space-y-6 m-0">
              {/* Stats Cards - Compact Version */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card data-testid="card-stat-active" className="p-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground mb-1">
                      Total Active
                    </span>
                    <span className="text-2xl font-bold text-green-600" data-testid="text-stat-active">
                      {stats?.totalActive || 0}
                    </span>
                  </div>
                </Card>
                <Card data-testid="card-stat-views" className="p-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground mb-1">
                      Total Views
                    </span>
                    <span className="text-2xl font-bold text-blue-600" data-testid="text-stat-views">
                      {stats?.totalViews || 0}
                    </span>
                  </div>
                </Card>
                <Card 
                  data-testid="card-stat-messages"
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate("/messages")}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground mb-1">
                      Messages
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-purple-600" data-testid="text-stat-messages">
                        {messages.length || 0}
                      </span>
                      {unreadCount > 0 && (
                        <Badge className="text-xs" variant="default">
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
                <Card data-testid="card-stat-sold" className="p-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground mb-1">
                      Items Sold
                    </span>
                    <span className="text-2xl font-bold text-orange-600" data-testid="text-stat-sold">
                      {stats?.totalSold || 0}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Listing Management Section with Sidebar */}
              <div className="flex gap-0 overflow-x-auto">
                {/* Left Sidebar */}
                <DashboardSidebar
                  listingFilter={listingFilter}
                  selectedFolder={selectedFolder}
                  onFilterChange={setListingFilter}
                  onFolderSelect={setSelectedFolder}
                  onDeleteMultipleClick={() => setIsSelectMode(true)}
                  isSelectMode={isSelectMode}
                />

                {/* Main Content Area */}
                <div className="flex-1">
                  <Card>
                    <CardHeader className="space-y-3 py-3 px-4">
                      {/* Action Buttons */}
                      {!isSelectMode && (
                        <div className="flex justify-end gap-2">
                          {/* Bulk Edit Button */}
                          <Link href="/bulk-edit">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Bulk Edit
                            </Button>
                          </Link>
                          
                          {/* Publish All Button (only for drafts) */}
                          {listingFilter === "draft" && filteredListings.filter(l => l.status === 'draft').length > 0 && (
                            <Button
                              size="sm"
                              onClick={() => {
                                const draftCount = filteredListings.filter(l => l.status === 'draft').length;
                                if (confirm(`Publish all ${draftCount} draft listing(s)? They will become visible to buyers.`)) {
                                  bulkPublishMutation.mutate();
                                }
                              }}
                              disabled={bulkPublishMutation.isPending}
                              data-testid="button-publish-all"
                              className="h-8 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              {bulkPublishMutation.isPending ? 'Publishing...' : 'Publish All'}
                            </Button>
                          )}
                        </div>
                      )}

                  {/* Bulk Actions Bar */}
                  {isSelectMode && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-900">
                          {selectedListings.length} item(s) selected
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsSelectMode(false);
                            setSelectedListings([]);
                          }}
                          data-testid="button-cancel-select"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (selectedListings.length === 0) {
                              toast({
                                title: "No items selected",
                                description: "Please select at least one listing to delete",
                                variant: "destructive",
                              });
                              return;
                            }
                            if (confirm(`Are you sure you want to delete ${selectedListings.length} listing(s)?`)) {
                              bulkDeleteMutation.mutate(selectedListings);
                            }
                          }}
                          disabled={bulkDeleteMutation.isPending || selectedListings.length === 0}
                          data-testid="button-delete-selected"
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 py-3">
                  {/* Search and Sort - Compact */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Search my listings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-sm"
                        data-testid="input-search-listings"
                      />
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-40 h-8 text-sm" data-testid="select-sort">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select All Checkbox */}
                  {isSelectMode && filteredListings.length > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <input
                        type="checkbox"
                        id="select-all"
                        checked={selectedListings.length === filteredListings.length && filteredListings.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedListings(filteredListings.map(l => l.id));
                          } else {
                            setSelectedListings([]);
                          }
                        }}
                        className="w-4 h-4 cursor-pointer"
                        data-testid="checkbox-select-all"
                      />
                      <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                        Select All ({filteredListings.length} items)
                      </label>
                    </div>
                  )}

                  {/* Listings List */}
                  {listingsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : filteredListings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Home className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Post your first item to get started
                      </p>
                      <Link href="/post-ad">
                        <Button data-testid="button-post-first-item">
                          <Plus className="h-4 w-4 mr-2" />
                          Post Your First Item
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredListings.map((listing) => (
                        <Card
                          key={listing.id}
                          className="hover-elevate"
                          data-testid={`card-my-listing-${listing.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                              {/* Checkbox for selection mode */}
                              {isSelectMode && (
                                <div className="flex items-start pt-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedListings.includes(listing.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedListings([...selectedListings, listing.id]);
                                      } else {
                                        setSelectedListings(selectedListings.filter(id => id !== listing.id));
                                      }
                                    }}
                                    className="w-5 h-5 cursor-pointer"
                                    data-testid={`checkbox-listing-${listing.id}`}
                                  />
                                </div>
                              )}

                              {/* Thumbnail */}
                              <Link href={`/listings/${listing.id}`}>
                                <div className="w-full sm:w-32 h-32 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                  {listing.images && listing.images.length > 0 ? (
                                    <img
                                      src={listing.images[0]}
                                      alt={listing.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                      No image
                                    </div>
                                  )}
                                </div>
                              </Link>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <Link href={`/listings/${listing.id}`}>
                                  <h3
                                    className="font-semibold text-lg mb-1 truncate hover:text-primary"
                                    data-testid={`text-listing-title-${listing.id}`}
                                  >
                                    {listing.title}
                                  </h3>
                                </Link>
                                <p
                                  className="text-xl font-bold text-primary mb-2"
                                  data-testid={`text-listing-price-${listing.id}`}
                                >
                                  ${parseFloat(listing.price).toFixed(2)}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <Badge variant="outline" data-testid={`badge-condition-${listing.id}`}>
                                    {listing.condition}
                                  </Badge>
                                  <Badge
                                    variant={
                                      listing.status === "active"
                                        ? "default"
                                        : listing.status === "sold"
                                        ? "secondary"
                                        : listing.status === "draft"
                                        ? "outline"
                                        : "destructive"
                                    }
                                    className={listing.status === "draft" ? "border-yellow-500 text-yellow-700 bg-yellow-50" : ""}
                                    data-testid={`badge-status-${listing.id}`}
                                  >
                                    {listing.status === "draft" ? "📝 Draft" : listing.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {listing.createdAt
                                    ? new Date(listing.createdAt).toLocaleDateString()
                                    : ""}
                                </p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex sm:flex-col gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingListing(listing);
                                    setEditorOpen(true);
                                  }}
                                  data-testid={`button-edit-${listing.id}`}
                                >
                                  <Edit2 className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                {listing.status === "draft" && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => publishDraftMutation.mutate(listing.id)}
                                    disabled={publishDraftMutation.isPending}
                                    data-testid={`button-publish-${listing.id}`}
                                    className="bg-green-600 hover:bg-green-700"
                                    title="Publish this draft"
                                  >
                                    <Rocket className="h-4 w-4 mr-1" />
                                    Publish
                                  </Button>
                                )}
                                {listing.status === "active" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => markAsSoldMutation.mutate(listing.id)}
                                    disabled={markAsSoldMutation.isPending}
                                    data-testid={`button-mark-sold-${listing.id}`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Sold
                                  </Button>
                                )}
                                {listing.status === "sold" && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      setReviewingListing(listing);
                                      setReviewModalOpen(true);
                                    }}
                                    data-testid={`button-review-buyer-${listing.id}`}
                                    className="bg-amber-600 hover:bg-amber-700"
                                    title="Leave a review for the buyer"
                                  >
                                    <Star className="h-4 w-4 mr-1" />
                                    Review Buyer
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this listing?")) {
                                      deleteMutation.mutate(listing.id);
                                    }
                                  }}
                                  disabled={deleteMutation.isPending}
                                  data-testid={`button-delete-${listing.id}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
                </div>
              </div>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  {favoritesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Heart className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No saved listings</h3>
                      <p className="text-muted-foreground mb-4">
                        Browse listings and save your favorites
                      </p>
                      <Link href="/">
                        <Button data-testid="button-browse-listings">Browse Listings</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favorites.map((listing) => {
                        const timePosted = listing.createdAt
                          ? (() => {
                              const now = new Date();
                              const created = new Date(listing.createdAt);
                              const diffMs = now.getTime() - created.getTime();
                              const diffMins = Math.floor(diffMs / 60000);
                              const diffHours = Math.floor(diffMins / 60);
                              const diffDays = Math.floor(diffHours / 24);
                              if (diffMins < 60) return `${diffMins}m ago`;
                              if (diffHours < 24) return `${diffHours}h ago`;
                              return `${diffDays}d ago`;
                            })()
                          : "N/A";
                        
                        return (
                          <ListingCard
                            key={listing.id}
                            id={listing.id}
                            title={listing.title}
                            price={parseFloat(listing.price)}
                            location={listing.location}
                            timePosted={timePosted}
                            image={listing.images && listing.images.length > 0 ? listing.images[0] : undefined}
                          />
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Purchases Tab */}
            <TabsContent value="purchases" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>My Purchases</CardTitle>
                </CardHeader>
                <CardContent>
                  {purchasesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading purchases...</div>
                  ) : purchases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Items you buy will appear here
                      </p>
                      <Link href="/">
                        <Button data-testid="button-browse-to-buy">Browse Listings</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {purchases.map((transaction: any) => (
                        <div key={transaction.id} className="flex gap-4 p-4 border rounded-lg">
                          {transaction.listing?.images?.[0] && (
                            <img
                              src={transaction.listing.images[0]}
                              alt={transaction.listing.title}
                              className="w-24 h-24 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold">{transaction.listing?.title || 'Item'}</h4>
                            <p className="text-sm text-muted-foreground">
                              Purchased from {transaction.seller?.firstName} {transaction.seller?.lastName}
                            </p>
                            <p className="text-sm font-medium">${transaction.amount}</p>
                            <p className="text-xs text-muted-foreground">
                              Status: {transaction.status}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {transaction.status === 'completed' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  // Set up review for seller
                                  setReviewingListing(transaction.listing);
                                  setReviewModalOpen(true);
                                }}
                                className="bg-amber-600 hover:bg-amber-700"
                                title="Leave a review for the seller"
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Review Seller
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="m-0 space-y-6">
              {/* Profile Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <SettingsForm user={currentUser} />
                </CardContent>
              </Card>

              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage your notification settings (coming soon)
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Mobile FAB */}
      <Link href="/post-ad">
        <Button
          size="icon"
          className="lg:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-30"
          data-testid="button-fab-create"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>

      {/* Share Modal */}
      <DashboardShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        listings={(userListings || []).map(listing => ({
          id: listing.id,
          title: listing.title,
        }))}
        userId={currentUser?.id}
      />

      {/* Inline Listing Editor Modal */}
      {editingListing && (
        <InlineListingEditor
          listing={editingListing}
          open={editorOpen}
          onOpenChange={setEditorOpen}
          onSave={() => {
            // Refresh listings after save
            queryClient.invalidateQueries({ queryKey: ['/api/listings/my-listings'] });
          }}
        />
      )}

      {/* Leave Review Modal */}
      {reviewingListing && currentUser && (
        <LeaveReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          listingId={reviewingListing.id}
          reviewedUserId={reviewingListing.buyerId || ''}
          reviewerRole="seller"
          currentUserId={currentUser.id}
          queryKey={['/api/listings/my-listings']}
        />
      )}
    </div>
  );
}
