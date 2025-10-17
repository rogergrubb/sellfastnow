// User Trust Profile Component
// client/components/UserTrustProfile.tsx

import React, { useEffect, useState } from 'react';
import TrustBadge from './TrustBadge';
import VerificationBadges from './VerificationBadges';

interface TrustData {
  overallScore: number;
  scoreLevel: string;
  levelDisplay: {
    label: string;
    color: string;
    emoji: string;
  };
  components: {
    verification: number;
    transaction: number;
    reputation: number;
    responsiveness: number;
  };
  metrics: {
    totalTransactions: number;
    successfulTransactions: number;
    totalReviews: number;
    averageRating: string;
    averageResponseTime: number;
  };
}

interface UserTrustProfileProps {
  userId: string;
  layout?: 'compact' | 'detailed' | 'inline';
  showBreakdown?: boolean;
}

const UserTrustProfile: React.FC<UserTrustProfileProps> = ({
  userId,
  layout = 'compact',
  showBreakdown = false,
}) => {
  const [trustData, setTrustData] = useState<TrustData | null>(null);
  const [verifications, setVerifications] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTrustData = async () => {
      try {
        const [scoreRes, verificationsRes, badgesRes] = await Promise.all([
          fetch(`/api/trust/score/${userId}`),
          fetch(`/api/trust/verifications/${userId}`),
          fetch(`/api/trust/badges/${userId}`),
        ]);
        
        const [score, verifs, bdgs] = await Promise.all([
          scoreRes.json(),
          verificationsRes.json(),
          badgesRes.json(),
        ]);
        
        setTrustData(score);
        setVerifications(verifs);
        setBadges(bdgs);
      } catch (error) {
        console.error('Error fetching trust data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrustData();
  }, [userId]);
  
  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded h-20 w-full"></div>;
  }
  
  if (!trustData) {
    return null;
  }
  
  // Inline layout - minimal display
  if (layout === 'inline') {
    return (
      <div className="inline-flex items-center gap-2">
        <TrustBadge
          score={trustData.overallScore}
          scoreLevel={trustData.scoreLevel}
          size="small"
          showLabel={false}
        />
        <VerificationBadges
          badges={badges}
          verifications={verifications}
          layout="horizontal"
          size="small"
          showLabels={false}
        />
      </div>
    );
  }
  
  // Compact layout - card with basic info
  if (layout === 'compact') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Trust Score</h3>
            <TrustBadge
              score={trustData.overallScore}
              scoreLevel={trustData.scoreLevel}
              size="medium"
            />
          </div>
          
          {trustData.metrics.averageRating && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">
                {parseFloat(trustData.metrics.averageRating).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">
                ⭐ {trustData.metrics.totalReviews} reviews
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-600 mb-2">Verifications</div>
          <VerificationBadges
            badges={badges}
            verifications={verifications}
            layout="horizontal"
            size="small"
          />
        </div>
        
        {trustData.metrics.averageResponseTime && (
          <div className="text-xs text-gray-600">
            ⚡ Usually responds in{' '}
            <span className="font-semibold">
              {trustData.metrics.averageResponseTime < 60
                ? `${trustData.metrics.averageResponseTime} min`
                : `${Math.round(trustData.metrics.averageResponseTime / 60)} hours`}
            </span>
          </div>
        )}
      </div>
    );
  }
  
  // Detailed layout - full breakdown
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Trust Profile</h2>
          <TrustBadge
            score={trustData.overallScore}
            scoreLevel={trustData.scoreLevel}
            size="large"
          />
        </div>
        
        {trustData.metrics.averageRating && (
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-800">
              {parseFloat(trustData.metrics.averageRating).toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">
              ⭐ {trustData.metrics.totalReviews} reviews
            </div>
          </div>
        )}
      </div>
      
      {/* Verifications */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Verifications & Badges</h3>
        <VerificationBadges
          badges={badges}
          verifications={verifications}
          layout="horizontal"
          size="medium"
        />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Transactions</div>
          <div className="text-xl font-bold text-gray-800">
            {trustData.metrics.successfulTransactions}
          </div>
          <div className="text-xs text-gray-500">
            of {trustData.metrics.totalTransactions} completed
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Response Time</div>
          <div className="text-xl font-bold text-gray-800">
            {trustData.metrics.averageResponseTime < 60
              ? `${trustData.metrics.averageResponseTime}m`
              : `${Math.round(trustData.metrics.averageResponseTime / 60)}h`}
          </div>
          <div className="text-xs text-gray-500">average</div>
        </div>
      </div>
      
      {/* Score Breakdown */}
      {showBreakdown && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Score Breakdown</h3>
          <div className="space-y-3">
            <ScoreComponent
              label="Verification"
              score={trustData.components.verification}
              maxScore={25}
              color="blue"
            />
            <ScoreComponent
              label="Transaction History"
              score={trustData.components.transaction}
              maxScore={25}
              color="green"
            />
            <ScoreComponent
              label="Reputation"
              score={trustData.components.reputation}
              maxScore={25}
              color="purple"
            />
            <ScoreComponent
              label="Responsiveness"
              score={trustData.components.responsiveness}
              maxScore={25}
              color="orange"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for score breakdown bars
interface ScoreComponentProps {
  label: string;
  score: number;
  maxScore: number;
  color: string;
}

const ScoreComponent: React.FC<ScoreComponentProps> = ({ label, score, maxScore, color }) => {
  const percentage = (score / maxScore) * 100;
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };
  
  const bgColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;
  
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">
          {score}/{maxScore}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${bgColor} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default UserTrustProfile;
