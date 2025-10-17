// Trust Score Display Component
// Shows user trust score with badges and breakdown

import React, { useState, useEffect } from 'react';
import { Star, Shield, Award, TrendingUp, MessageCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface TrustScoreProps {
  userId: string;
  variant?: 'full' | 'compact' | 'badge';
  showDetails?: boolean;
}

interface TrustScore {
  overallScore: number;
  scoreLevel: string;
  riskLevel: string;
  badges: any[];
  totalTransactions: number;
  successfulTransactions: number;
  averageRating: number | null;
  totalReviews: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  idVerified: boolean;
}

interface TrustBreakdown {
  overall: {
    score: number;
    level: string;
    maxScore: number;
    percentage: number;
  };
  components: {
    name: string;
    score: number;
    maxScore: number;
    weight: string;
    description: string;
    details?: any;
  }[];
  risk: {
    level: string;
    color: string;
  };
  badges: any[];
}

export const TrustScoreDisplay: React.FC<TrustScoreProps> = ({
  userId,
  variant = 'full',
  showDetails = false,
}) => {
  const [score, setScore] = useState<TrustScore | null>(null);
  const [breakdown, setBreakdown] = useState<TrustBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(showDetails);

  useEffect(() => {
    fetchTrustScore();
  }, [userId]);

  const fetchTrustScore = async () => {
    try {
      const response = await fetch(`/api/trust/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setScore(data.data);
      }
    } catch (error) {
      console.error('Error fetching trust score:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBreakdown = async () => {
    if (breakdown) {
      setShowBreakdown(!showBreakdown);
      return;
    }

    try {
      const response = await fetch(`/api/trust/me/breakdown`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setBreakdown(data.data);
        setShowBreakdown(true);
      }
    } catch (error) {
      console.error('Error fetching breakdown:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!score) {
    return null;
  }

  // Badge only variant
  if (variant === 'badge') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
        <Shield className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          {getLevelLabel(score.scoreLevel)}
        </span>
        <span className="text-xs text-blue-600">{score.overallScore}</span>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className={`w-5 h-5 ${getLevelColor(score.scoreLevel)}`} />
            <span className="font-semibold text-gray-900">Trust Score</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{score.overallScore}</div>
            <div className="text-xs text-gray-500">/ 1000</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getLevelBgColor(score.scoreLevel)}`}
              style={{ width: `${(score.overallScore / 1000) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className={`font-medium ${getLevelColor(score.scoreLevel)}`}>
            {getLevelLabel(score.scoreLevel)}
          </span>
          <span>{score.totalTransactions} transactions</span>
        </div>

        {score.badges.length > 0 && (
          <div className="flex gap-1 mt-3">
            {score.badges.slice(0, 3).map((badge) => (
              <div
                key={badge.id}
                className="text-lg"
                title={badge.name}
              >
                {badge.icon}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className={`w-8 h-8 ${getLevelColor(score.scoreLevel)}`} />
              <div>
                <h3 className="text-xl font-bold text-gray-900">Trust Score</h3>
                <p className="text-sm text-gray-600">
                  {getLevelLabel(score.scoreLevel)} Seller
                </p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold text-gray-900">{score.overallScore}</div>
            <div className="text-sm text-gray-500">out of 1,000</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getLevelBgColor(score.scoreLevel)}`}
                style={{ width: `${(score.overallScore / 1000) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {Math.round((score.overallScore / 1000) * 100)}%
            </span>
          </div>

          {/* Level Milestones */}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>New (0)</span>
            <span>Building (200)</span>
            <span>Established (400)</span>
            <span>Trusted (600)</span>
            <span>Elite (800)</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Transactions</div>
            <div className="text-lg font-semibold text-gray-900">
              {score.successfulTransactions}/{score.totalTransactions}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
            <Star className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Rating</div>
            <div className="text-lg font-semibold text-gray-900">
              {score.averageRating?.toFixed(1) || 'N/A'}
              {score.totalReviews > 0 && (
                <span className="text-xs text-gray-500 ml-1">
                  ({score.totalReviews})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Verifications */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Verifications</h4>
        <div className="space-y-2">
          <VerificationItem
            label="Email"
            verified={score.emailVerified}
          />
          <VerificationItem
            label="Phone"
            verified={score.phoneVerified}
          />
          <VerificationItem
            label="ID"
            verified={score.idVerified}
          />
        </div>
      </div>

      {/* Badges */}
      {score.badges.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Badges</h4>
          <div className="flex flex-wrap gap-2">
            {score.badges.map((badge) => (
              <div
                key={badge.id}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                style={{ borderColor: badge.color + '40' }}
              >
                <span className="text-xl">{badge.icon}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {badge.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {badge.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown Toggle */}
      <div className="p-6">
        <button
          onClick={fetchBreakdown}
          className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          {showBreakdown ? 'Hide' : 'Show'} Detailed Breakdown
        </button>
      </div>

      {/* Detailed Breakdown */}
      {showBreakdown && breakdown && (
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Score Components</h4>
          <div className="space-y-4">
            {breakdown.components.map((component) => (
              <div key={component.name} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{component.name}</span>
                    <span className="text-xs text-gray-500">({component.weight})</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {component.score}/{component.maxScore}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${(component.score / component.maxScore) * 100}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-600">{component.description}</p>

                {component.details && (
                  <div className="mt-2 text-xs text-gray-500">
                    {Object.entries(component.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-medium text-gray-700">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Level */}
      {score.riskLevel !== 'low' && (
        <div className="p-4 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-900">
              Risk Level: <span className="font-medium capitalize">{score.riskLevel}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const VerificationItem: React.FC<{ label: string; verified: boolean }> = ({
  label,
  verified,
}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-700">{label}</span>
    {verified ? (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-xs font-medium">Verified</span>
      </div>
    ) : (
      <span className="text-xs text-gray-400">Not verified</span>
    )}
  </div>
);

// Helper Functions
const getLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    new: 'New',
    building: 'Building',
    established: 'Established',
    trusted: 'Trusted',
    elite: 'Elite',
  };
  return labels[level] || 'Unknown';
};

const getLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    new: 'text-gray-500',
    building: 'text-blue-500',
    established: 'text-green-500',
    trusted: 'text-purple-500',
    elite: 'text-yellow-500',
  };
  return colors[level] || 'text-gray-500';
};

const getLevelBgColor = (level: string): string => {
  const colors: Record<string, string> = {
    new: 'bg-gray-400',
    building: 'bg-blue-500',
    established: 'bg-green-500',
    trusted: 'bg-purple-500',
    elite: 'bg-yellow-500',
  };
  return colors[level] || 'bg-gray-400';
};

export default TrustScoreDisplay;
