import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import PartnerStripeConnect from "@/components/PartnerStripeConnect";
import { 
  LayoutDashboard, Package, Users, Mail, Settings, 
  TrendingUp, DollarSign, ShoppingBag, Eye, Upload,
  Plus, Search, Filter, MoreVertical, Edit, Trash2,
  ExternalLink, CheckCircle, Clock, XCircle, Palette,
  Globe, Phone, MapPin, Save, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function PartnerDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch partner profile
  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ["/api/partners/profile"],
  });

  // Fetch partner stats
  const { data: stats } = useQuery({
    queryKey: ["/api/partners/stats"],
    enabled: !!partner,
  });

  // Fetch partner listings
  const { data: listings = [] } = useQuery({
    queryKey: ["/api/partners/listings"],
    enabled: !!partner,
  });

  // Fetch partner clients
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/partners/clients"],
    enabled: !!partner,
  });

  if (partnerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Partner Account</h2>
          <p className="text-gray-600 mb-6">
            You don't have a business partner account yet. Create one to get started!
          </p>
          <Button onClick={() => navigate("/partner/onboard")} className="w-full">
            Become a Partner
          </Button>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    suspended: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{partner.businessName}</h1>
              <p className="text-gray-600 mt-1">Partner Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[partner.status as keyof typeof statusColors]}`}>
                {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
              </span>
              <Button
                variant="outline"
                onClick={() => window.open(`/partner/${partner.customDomain}`, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Storefront
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Listings ({listings.length})
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clients ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <OverviewTab stats={stats} partner={partner} navigate={navigate} />
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings">
            <ListingsTab listings={listings} partner={partner} />
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <ClientsTab clients={clients} partner={partner} />
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <CampaignsTab partner={partner} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SettingsTab partner={partner} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ stats, partner, navigate }: any) {
  const statCards = [
    {
      title: "Total Revenue",
      value: `$${stats?.totalRevenue?.toLocaleString() || '0'}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Commission Earned",
      value: `$${stats?.totalCommissionEarned?.toLocaleString() || '0'}`,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Active Listings",
      value: stats?.activeListings || 0,
      icon: Package,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Total Sales",
      value: stats?.totalSales || 0,
      icon: ShoppingBag,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Fee Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <DollarSign className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Platform Fee</h3>
            <p className="text-blue-800">
              Your current platform fee is <strong>{stats?.platformFeePercent || 3}%</strong>. 
              You keep <strong>{100 - (stats?.platformFeePercent || 3)}%</strong> of every sale.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            className="flex items-center justify-center gap-2"
            onClick={() => navigate('/listings/new')}
          >
            <Plus className="w-4 h-4" />
            Add New Listing
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2"
            onClick={() => navigate('/partner/bulk-upload')}
          >
            <Upload className="w-4 h-4" />
            Bulk Upload CSV
          </Button>
          <Button variant="outline" className="flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            Send Campaign
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">New listing published</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">Sale completed - $450</p>
              <p className="text-xs text-gray-500">5 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            <Users className="w-5 h-5 text-purple-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">New client added</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Listings Tab Component
function ListingsTab({ listings, partner }: any) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredListings = listings.filter((listing: any) =>
    listing.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Listings</h2>
          <p className="text-gray-600">Manage your inventory and products</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Bulk Upload
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Listing
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search listings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Listings Yet</h3>
          <p className="text-gray-600 mb-6">Start adding products to your storefront</p>
          <Button className="flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Add Your First Listing
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing: any) => (
            <div key={listing.id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
              <div className="relative h-48 bg-gray-200">
                {listing.images?.[0] && (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    listing.status === 'active' ? 'bg-green-100 text-green-800' :
                    listing.status === 'sold' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {listing.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{listing.title}</h3>
                <p className="text-2xl font-bold text-blue-600 mb-3">${listing.price}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{listing.category}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Clients Tab Component
function ClientsTab({ clients, partner }: any) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    emailOptIn: true,
    smsOptIn: false,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/partners/clients", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Client added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/partners/clients"] });
      setShowAddForm(false);
      setNewClient({ email: "", firstName: "", lastName: "", phone: "", emailOptIn: true, smsOptIn: false });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Add Client Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Client</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="email"
              placeholder="Email *"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="First Name"
              value={newClient.firstName}
              onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={newClient.lastName}
              onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            />
          </div>
          <div className="flex gap-4 mt-4">
            <Button onClick={() => addClientMutation.mutate(newClient)}>
              Add Client
            </Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opt-In</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.map((client: any) => (
              <tr key={client.id}>
                <td className="px-6 py-4 text-sm">{client.firstName} {client.lastName}</td>
                <td className="px-6 py-4 text-sm">{client.email}</td>
                <td className="px-6 py-4 text-sm">{client.phone || '-'}</td>
                <td className="px-6 py-4 text-sm">
                  {client.emailOptIn && <span className="text-green-600">Email</span>}
                  {client.smsOptIn && <span className="text-blue-600 ml-2">SMS</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Campaigns Tab Component
function CampaignsTab({ partner }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Email & SMS Campaigns</h2>
        <p className="text-gray-600">Send marketing campaigns to your clients</p>
      </div>

      <div className="bg-white rounded-lg shadow p-12 text-center">
        <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
        <p className="text-gray-600">Campaign management features will be available soon</p>
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab({ partner }: any) {
  const [formData, setFormData] = useState(partner);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/partners/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/partners/profile"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Manage your storefront settings and branding</p>
      </div>

      {/* Stripe Connect */}
      <PartnerStripeConnect />

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Business Name</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Business Email</label>
              <input
                type="email"
                value={formData.businessEmail}
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={formData.businessPhone || ''}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <input
                type="url"
                value={formData.businessWebsite || ''}
                onChange={(e) => setFormData({ ...formData, businessWebsite: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.businessDescription || ''}
              onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Branding</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-16 h-10 rounded border"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-16 h-10 rounded border"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <Button onClick={() => updateMutation.mutate(formData)} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

