import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, XCircle, Lightbulb } from "lucide-react";

interface ListingQualityScoreProps {
  listingId: string;
}

export default function ListingQualityScore({ listingId }: ListingQualityScoreProps) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/analytics/listings/${listingId}/quality`],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Listing Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-2 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { qualityScore } = data;
  const percentage = (qualityScore / 10) * 100;

  // Determine quality level
  let qualityLevel: "excellent" | "good" | "fair" | "poor";
  let qualityColor: string;
  let qualityIcon: React.ReactNode;
  let qualityText: string;

  if (qualityScore >= 9) {
    qualityLevel = "excellent";
    qualityColor = "text-green-600";
    qualityIcon = <CheckCircle className="h-5 w-5 text-green-600" />;
    qualityText = "Excellent";
  } else if (qualityScore >= 7) {
    qualityLevel = "good";
    qualityColor = "text-blue-600";
    qualityIcon = <CheckCircle className="h-5 w-5 text-blue-600" />;
    qualityText = "Good";
  } else if (qualityScore >= 5) {
    qualityLevel = "fair";
    qualityColor = "text-yellow-600";
    qualityIcon = <AlertCircle className="h-5 w-5 text-yellow-600" />;
    qualityText = "Fair";
  } else {
    qualityLevel = "poor";
    qualityColor = "text-red-600";
    qualityIcon = <XCircle className="h-5 w-5 text-red-600" />;
    qualityText = "Needs Improvement";
  }

  // Generate improvement suggestions based on score
  const suggestions: string[] = [];
  
  if (qualityScore < 10) {
    if (qualityScore < 2) {
      suggestions.push("Add a clear, descriptive title (20-80 characters)");
    }
    if (qualityScore < 5) {
      suggestions.push("Write a detailed description (at least 200 characters)");
    }
    if (qualityScore < 8) {
      suggestions.push("Add more photos (at least 5 high-quality images)");
    }
    if (qualityScore < 10) {
      suggestions.push("Ensure all details are complete and accurate");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Listing Quality Score</CardTitle>
            <CardDescription>How well-optimized is your listing?</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {qualityIcon}
            <span className={`text-2xl font-bold ${qualityColor}`}>
              {qualityScore}/10
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{qualityText}</span>
            <span className="text-sm text-muted-foreground">{percentage.toFixed(0)}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        {suggestions.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Suggestions to improve:
                </p>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-blue-800 dark:text-blue-200">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {qualityScore >= 9 && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Great job! Your listing is well-optimized and ready to attract buyers.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

