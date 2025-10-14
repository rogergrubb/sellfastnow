// Trust Badge Component
// client/components/TrustBadge.tsx

import React from 'react';

interface TrustBadgeProps {
  score: number;
  scoreLevel: string;
  size?: 'small' | 'medium' | 'large';
  showScore?: boolean;
  showLabel?: boolean;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({
  score,
  scoreLevel,
  size = 'medium',
  showScore = true,
  showLabel = true,
}) => {
  const getLevelConfig = (level: string) => {
    const configs = {
      elite: {
        label: 'Elite',
        emoji: '🏆',
        color: 'gold',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-400',
      },
      trusted: {
        label: 'Trusted',
        emoji: '✅',
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-400',
      },
      established: {
        label: 'Established',
        emoji: '🔵',
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-400',
      },
      building: {
        label: 'Building Trust',
        emoji: '🟡',
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-300',
      },
      new: {
        label: 'New User',
        emoji: '⚪',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        borderColor: 'border-gray-300',
      },
    };
    
    return configs[level as keyof typeof configs] || configs.new;
  };
  
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base',
  };
  
  const config = getLevelConfig(scoreLevel);
  
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]} font-medium`}
    >
      <span className="text-base">{config.emoji}</span>
      {showScore && <span className="font-bold">{score}</span>}
      {showLabel && <span>{config.label}</span>}
    </div>
  );
};

export default TrustBadge;
