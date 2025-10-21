import { useQuery } from "@tantml:query-client";
import StarRating from "./StarRating";
import { Shield, AlertTriangle, TrendingUp, Award } from "lucide-react";

interface ReputationCardProps {
  userId: string;
  compact?: boolean;
}

export default function ReputationCard({ userId, compact = false }: ReputationCardProps) {
  const { data: reputation, isLoading } = useQuery({
    queryKey: ["reputation", userId],
    queryFn: async () => {
      const response = await fetch(`/api/reputation/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch reputation");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!reputation) return null;

  const { score, fraud, stats, badges } = reputation;

  // Trust level colors
  const trustLevelColors: Record<string, { bg: string; text: string; border: string }> = {
    elite: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    trusted: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    established: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    building: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
    new: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  };

  const levelStyle = trustLevelColors[score.trustLevel] || trustLevelColors.new;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`px-3 py-1 rounded-full ${levelStyle.bg} ${levelStyle.border} border`}>
          <span className={`text-sm font-medium ${levelStyle.text}`}>
            {score.trustLevel.charAt(0).toUpperCase() + score.trustLevel.slice(1)}
          </span>
        </div>
        <StarRating rating={score.sellerRating} size="sm" />
        <span className="text-sm text-gray-600">
          {score.totalTransactions} transactions
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Reputation Score</h3>
          <p className="text-sm text-gray-600">Based on verified transactions and reviews</p>
        </div>
        <div className={`px-4 py-2 rounded-lg ${levelStyle.bg} ${levelStyle.border} border`}>
          <div className="text-center">
            <div className={`text-3xl font-bold ${levelStyle.text}`}>
              {score.overallScore}
            </div>
            <div className={`text-xs font-medium ${levelStyle.text} mt-1`}>
              {score.trustLevel.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Ratings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-600 mb-1">As Seller</div>
          <StarRating rating={score.sellerRating} size="md" />
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">As Buyer</div>
          <StarRating rating={score.buyerRating} size="md" />
        </div>
      </div>

      {/* Success Rates */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Seller Success Rate</span>
            <span className="font-medium">{score.sellerSuccessRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${score.sellerSuccessRate}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Buyer Success Rate</span>
            <span className="font-medium">{score.buyerSuccessRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${score.buyerSuccessRate}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Response Rate</span>
            <span className="font-medium">{score.responseRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full"
              style={{ width: `${score.responseRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Transaction Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {score.totalTransactions}
          </div>
          <div className="text-xs text-gray-600">Total Transactions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {score.metrics.totalReviews}
          </div>
          <div className="text-xs text-gray-600">Reviews</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {score.metrics.lastMinuteCancellations}
          </div>
          <div className="text-xs text-gray-600">Last-Min Cancels</div>
        </div>
      </div>

      {/* Badges */}
      {badges && badges.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Badges</h4>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge: any) => (
              <div
                key={badge.type}
                className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2"
                title={badge.description}
              >
                <span>{badge.icon}</span>
                <span className="text-xs font-medium text-gray-700">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {score.warnings && score.warnings.length > 0 && (
        <div className="pt-4 border-t">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-1">
                  Performance Warnings
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {score.warnings.map((warning: string, index: number) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fraud Alert */}
      {fraud?.isSuspicious && (
        <div className="pt-4 border-t">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Fraud Detection Alert
                </h4>
                <p className="text-sm text-red-700 mb-2">
                  Suspicion Score: {fraud.suspicionScore}/100
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  {fraud.patterns.map((pattern: string, index: number) => (
                    <li key={index}>• {pattern}</li>
                  ))}
                </ul>
                <p className="text-xs text-red-600 mt-2 italic">
                  {fraud.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trust System Info */}
      <div className="pt-4 border-t">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">SellFast.Now Trust System</p>
              <p>
                Our multi-layered reputation system tracks verified transactions, 
                reviews, response times, and anti-fraud metrics to ensure a safe 
                marketplace for everyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

