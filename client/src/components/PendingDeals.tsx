import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Package, DollarSign, User, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface Transaction {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  amount: number;
  status: string;
  role: 'buyer' | 'seller';
  otherPartyName: string;
  createdAt: string;
  expiresAt?: string;
}

export function PendingDeals() {
  const { data: user } = useQuery<{ id: string }>({ 
    queryKey: ['/api/auth/user'],
    retry: false,
  });
  
  const { data: pendingDeals = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions/pending'],
    enabled: !!user, // Only fetch if user is authenticated
  });

  // Don't show anything if user is not logged in
  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (pendingDeals.length === 0) {
    return null; // Don't show section if no pending deals
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Deals Pending Action</h2>
            <p className="text-sm text-gray-600">
              You have {pendingDeals.length} transaction{pendingDeals.length !== 1 ? 's' : ''} awaiting your response
            </p>
          </div>
        </div>
        <Link href="/transactions">
          <Button variant="outline" size="sm">
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingDeals.slice(0, 6).map((deal) => (
          <Card key={deal.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <Link href={`/transactions`}>
              <div className="cursor-pointer">
                <div className="flex gap-3 p-4">
                  {/* Listing Image */}
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {deal.listingImage ? (
                      <img 
                        src={deal.listingImage} 
                        alt={deal.listingTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Deal Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate mb-1">
                      {deal.listingTitle}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <User className="w-3 h-3" />
                      <span className="truncate">
                        {deal.role === 'buyer' ? 'Buying from' : 'Selling to'} {deal.otherPartyName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 font-semibold text-green-600">
                        <DollarSign className="w-4 h-4" />
                        <span>${(deal.amount / 100).toFixed(2)}</span>
                      </div>
                      
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        deal.status === 'pending_payment' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : deal.status === 'escrow'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {deal.status === 'pending_payment' && 'Payment Due'}
                        {deal.status === 'escrow' && deal.role === 'buyer' && 'Confirm Receipt'}
                        {deal.status === 'escrow' && deal.role === 'seller' && 'In Escrow'}
                        {deal.status === 'pending_meetup' && 'Arrange Meetup'}
                      </span>
                    </div>

                    {deal.expiresAt && (
                      <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Expires {new Date(deal.expiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="px-4 pb-4">
                  <Button 
                    className="w-full" 
                    size="sm"
                    variant={deal.status === 'pending_payment' ? 'default' : 'outline'}
                  >
                    {deal.status === 'pending_payment' && 'Complete Payment'}
                    {deal.status === 'escrow' && deal.role === 'buyer' && 'Confirm Receipt'}
                    {deal.status === 'escrow' && deal.role === 'seller' && 'View Status'}
                    {deal.status === 'pending_meetup' && 'Arrange Meetup'}
                  </Button>
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>

      {pendingDeals.length > 6 && (
        <div className="mt-4 text-center">
          <Link href="/transactions">
            <Button variant="link" className="text-orange-600">
              View {pendingDeals.length - 6} more pending deal{pendingDeals.length - 6 !== 1 ? 's' : ''}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

