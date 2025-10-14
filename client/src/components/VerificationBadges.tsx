// Verification Badges Component
// client/components/VerificationBadges.tsx

import React from 'react';

interface Badge {
  id: string;
  badgeType: string;
  badgeName: string;
  badgeIcon: string;
  badgeColor: string;
  earnedAt: string;
}

interface VerificationBadgesProps {
  badges: Badge[];
  verifications: {
    phoneVerified: boolean;
    emailVerified: boolean;
    idVerified: boolean;
    paymentVerified: boolean;
    socialVerified: boolean;
  };
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
}

const VerificationBadges: React.FC<VerificationBadgesProps> = ({
  badges,
  verifications,
  layout = 'horizontal',
  size = 'medium',
  showLabels = true,
}) => {
  const sizeClasses = {
    small: {
      container: 'gap-1',
      badge: 'text-xs px-2 py-0.5',
      icon: 'text-sm',
    },
    medium: {
      container: 'gap-2',
      badge: 'text-sm px-2.5 py-1',
      icon: 'text-base',
    },
    large: {
      container: 'gap-3',
      badge: 'text-base px-3 py-1.5',
      icon: 'text-lg',
    },
  };
  
  const layoutClasses = {
    horizontal: 'flex flex-row flex-wrap',
    vertical: 'flex flex-col',
    grid: 'grid grid-cols-2 md:grid-cols-3',
  };
  
  const getBadgeColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      orange: 'bg-orange-100 text-orange-800 border-orange-300',
      gray: 'bg-gray-100 text-gray-600 border-gray-300',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };
  
  // Core verification badges (always show if verified)
  const coreVerificationBadges = [
    {
      type: 'phone_verified',
      verified: verifications.phoneVerified,
      icon: '✓',
      label: 'Phone',
      color: 'blue',
    },
    {
      type: 'email_verified',
      verified: verifications.emailVerified,
      icon: '✓',
      label: 'Email',
      color: 'blue',
    },
    {
      type: 'payment_verified',
      verified: verifications.paymentVerified,
      icon: '💳',
      label: 'Payment',
      color: 'green',
    },
    {
      type: 'id_verified',
      verified: verifications.idVerified,
      icon: '🆔',
      label: 'ID',
      color: 'gold',
    },
  ];
  
  const visibleCoreVerifications = coreVerificationBadges.filter(b => b.verified);
  
  // Earned badges (from database)
  const earnedBadges = badges.filter(b =>
    !['phone_verified', 'email_verified', 'payment_verified', 'id_verified'].includes(b.badgeType)
  );
  
  const allVisibleBadges = [
    ...visibleCoreVerifications.map(v => ({
      type: v.type,
      icon: v.icon,
      label: v.label,
      color: v.color,
    })),
    ...earnedBadges.map(b => ({
      type: b.badgeType,
      icon: b.badgeIcon,
      label: b.badgeName,
      color: b.badgeColor,
    })),
  ];
  
  if (allVisibleBadges.length === 0) {
    return null;
  }
  
  return (
    <div className={`${layoutClasses[layout]} ${sizeClasses[size].container}`}>
      {allVisibleBadges.map((badge, index) => (
        <div
          key={`${badge.type}-${index}`}
          className={`inline-flex items-center gap-1 rounded-full border font-medium ${getBadgeColor(badge.color)} ${sizeClasses[size].badge}`}
          title={badge.label}
        >
          <span className={sizeClasses[size].icon}>{badge.icon}</span>
          {showLabels && <span>{badge.label}</span>}
        </div>
      ))}
    </div>
  );
};

export default VerificationBadges;
