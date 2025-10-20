import { CheckCircle2, Mail, Phone, Shield, MapPin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type VerificationType = 'email' | 'phone' | 'id' | 'address';

interface VerificationBadgeProps {
  type: VerificationType;
  verified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const verificationConfig = {
  email: {
    icon: Mail,
    label: 'Email Verified',
    unverifiedLabel: 'Email Not Verified',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  phone: {
    icon: Phone,
    label: 'Phone Verified',
    unverifiedLabel: 'Phone Not Verified',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  id: {
    icon: Shield,
    label: 'ID Verified',
    unverifiedLabel: 'ID Not Verified',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  address: {
    icon: MapPin,
    label: 'Address Verified',
    unverifiedLabel: 'Address Not Verified',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
};

const sizeConfig = {
  sm: {
    icon: 'w-3 h-3',
    text: 'text-xs',
    padding: 'px-1.5 py-0.5',
    gap: 'gap-1',
  },
  md: {
    icon: 'w-4 h-4',
    text: 'text-sm',
    padding: 'px-2 py-1',
    gap: 'gap-1.5',
  },
  lg: {
    icon: 'w-5 h-5',
    text: 'text-base',
    padding: 'px-3 py-1.5',
    gap: 'gap-2',
  },
};

export function VerificationBadge({
  type,
  verified,
  size = 'md',
  showLabel = false,
  className = '',
}: VerificationBadgeProps) {
  const config = verificationConfig[type];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  if (!verified) {
    // Don't show anything if not verified (or show a subtle indicator)
    return null;
  }

  const badge = (
    <div
      className={`inline-flex items-center ${sizeStyles.gap} ${sizeStyles.padding} rounded-full ${config.bgColor} ${config.color} font-medium ${sizeStyles.text} ${className}`}
    >
      <CheckCircle2 className={sizeStyles.icon} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface VerificationBadgesProps {
  user: {
    emailVerified?: boolean;
    phoneVerified?: boolean;
    idVerified?: boolean;
    addressVerified?: boolean;
  };
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export function VerificationBadges({
  user,
  size = 'sm',
  showLabels = false,
  className = '',
}: VerificationBadgesProps) {
  const verifications: { type: VerificationType; verified: boolean }[] = [
    { type: 'email', verified: user.emailVerified || false },
    { type: 'phone', verified: user.phoneVerified || false },
    { type: 'id', verified: user.idVerified || false },
    { type: 'address', verified: user.addressVerified || false },
  ];

  const verifiedCount = verifications.filter(v => v.verified).length;

  if (verifiedCount === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {verifications.map(({ type, verified }) => (
        <VerificationBadge
          key={type}
          type={type}
          verified={verified}
          size={size}
          showLabel={showLabels}
        />
      ))}
    </div>
  );
}

interface TrustScoreProps {
  user: {
    emailVerified?: boolean;
    phoneVerified?: boolean;
    idVerified?: boolean;
    addressVerified?: boolean;
  };
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export function TrustScore({
  user,
  size = 'md',
  showPercentage = true,
  className = '',
}: TrustScoreProps) {
  const verifications = [
    user.emailVerified || false,
    user.phoneVerified || false,
    user.idVerified || false,
    user.addressVerified || false,
  ];

  const verifiedCount = verifications.filter(Boolean).length;
  const totalCount = verifications.length;
  const percentage = Math.round((verifiedCount / totalCount) * 100);

  const sizeStyles = sizeConfig[size];

  let trustLevel = 'Low';
  let trustColor = 'text-red-600';
  let trustBgColor = 'bg-red-50';

  if (percentage >= 75) {
    trustLevel = 'High';
    trustColor = 'text-green-600';
    trustBgColor = 'bg-green-50';
  } else if (percentage >= 50) {
    trustLevel = 'Medium';
    trustColor = 'text-yellow-600';
    trustBgColor = 'bg-yellow-50';
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center ${sizeStyles.gap} ${sizeStyles.padding} rounded-full ${trustBgColor} ${trustColor} font-semibold ${sizeStyles.text} ${className}`}
          >
            <Shield className={sizeStyles.icon} />
            <span>
              {showPercentage ? `${percentage}% Verified` : `${trustLevel} Trust`}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">Trust Score: {percentage}%</p>
            <p className="text-xs text-muted-foreground">
              {verifiedCount} of {totalCount} verifications completed
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

