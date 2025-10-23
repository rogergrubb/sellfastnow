import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck } from "lucide-react";

interface AccountTierBadgeProps {
  tier: 'none' | 'express' | 'standard';
  size?: 'sm' | 'md' | 'lg';
}

export default function AccountTierBadge({ tier, size = 'md' }: AccountTierBadgeProps) {
  if (tier === 'none') {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (tier === 'express') {
    return (
      <Badge
        variant="outline"
        className={`${sizeClasses[size]} bg-green-50 text-green-700 border-green-300 flex items-center gap-1`}
      >
        <Shield className={iconSizes[size]} />
        Express Verified
      </Badge>
    );
  }

  if (tier === 'standard') {
    return (
      <Badge
        variant="outline"
        className={`${sizeClasses[size]} bg-blue-50 text-blue-700 border-blue-300 flex items-center gap-1`}
      >
        <ShieldCheck className={iconSizes[size]} />
        Standard Verified
      </Badge>
    );
  }

  return null;
}

