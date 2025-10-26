import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ReliabilityBadgeProps {
  userId: string;
  showDetails?: boolean;
}

interface ReliabilityScore {
  totalMeetups: number;
  completedMeetups: number;
  cancelledMeetups: number;
  onTimeCount: number;
  lateCount: number;
  noShowCount: number;
  reliabilityScore: number;
  averagePunctuality: number;
}

export function ReliabilityBadge({ userId, showDetails = false }: ReliabilityBadgeProps) {
  const { data: score } = useQuery<ReliabilityScore>({
    queryKey: [`/api/reliability/${userId}`],
    enabled: !!userId,
  });

  if (!score || score.totalMeetups === 0) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 75) return "bg-blue-100 text-blue-800 border-blue-200";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Improvement";
  };

  const reliabilityPercent = Math.round(score.reliabilityScore);
  const onTimeRate = score.totalMeetups > 0 
    ? Math.round((score.onTimeCount / score.totalMeetups) * 100) 
    : 0;

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant="outline" 
              className={`${getScoreColor(reliabilityPercent)} font-medium`}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              {reliabilityPercent}% Reliable
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p className="font-semibold">{getScoreLabel(reliabilityPercent)}</p>
              <p>{score.completedMeetups} of {score.totalMeetups} meetups completed</p>
              <p>{onTimeRate}% on-time arrival</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Meetup Reliability</h4>
        <Badge 
          variant="outline" 
          className={`${getScoreColor(reliabilityPercent)} font-medium`}
        >
          {getScoreLabel(reliabilityPercent)}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Completed</span>
          </div>
          <span className="font-medium">
            {score.completedMeetups} / {score.totalMeetups}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>On Time</span>
          </div>
          <span className="font-medium">{onTimeRate}%</span>
        </div>

        {score.cancelledMeetups > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>Cancelled</span>
            </div>
            <span className="font-medium">{score.cancelledMeetups}</span>
          </div>
        )}

        {score.noShowCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>No Shows</span>
            </div>
            <span className="font-medium">{score.noShowCount}</span>
          </div>
        )}
      </div>

      {score.averagePunctuality !== null && (
        <div className="pt-2 border-t text-xs text-gray-500">
          Average arrival: {score.averagePunctuality > 0 ? '+' : ''}{Math.round(score.averagePunctuality)} minutes
        </div>
      )}
    </div>
  );
}

