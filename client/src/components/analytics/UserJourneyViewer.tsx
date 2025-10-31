import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MousePointer, Eye, FileText, Clock } from "lucide-react";

interface JourneyEvent {
  timestamp: string;
  event_type: string;
  event_name: string;
  page_path: string;
  element_text: string | null;
  metadata: any;
}

export function UserJourneyViewer() {
  const [identifier, setIdentifier] = useState("");
  const [identifierType, setIdentifierType] = useState<"email" | "ip" | "session">("email");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: journeyData, isLoading, refetch } = useQuery<{ journey: JourneyEvent[] }>({
    queryKey: ["/api/tracking/journey", searchQuery, identifierType],
    queryFn: async () => {
      if (!searchQuery) return { journey: [] };
      
      const response = await fetch(`/api/tracking/journey/${encodeURIComponent(searchQuery)}?type=${identifierType}`);
      if (!response.ok) throw new Error("Failed to fetch journey");
      return response.json();
    },
    enabled: !!searchQuery,
  });

  const handleSearch = () => {
    setSearchQuery(identifier);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'click':
        return <MousePointer className="h-4 w-4 text-green-600" />;
      case 'form_submit':
        return <FileText className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getRelativeTime = (timestamp: string, previousTimestamp?: string) => {
    if (!previousTimestamp) return null;
    
    const current = new Date(timestamp).getTime();
    const previous = new Date(previousTimestamp).getTime();
    const diff = current - previous;
    
    if (diff < 1000) return `${diff}ms`;
    if (diff < 60000) return `${Math.round(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.round(diff / 60000)}m`;
    return `${Math.round(diff / 3600000)}h`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Journey Tracker</CardTitle>
        <CardDescription>
          Track a specific user's path through your site by email, IP, or session ID
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search Form */}
        <div className="flex gap-3 mb-6">
          <Select value={identifierType} onValueChange={(value: any) => setIdentifierType(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="ip">IP Address</SelectItem>
              <SelectItem value="session">Session ID</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            type="text"
            placeholder={`Enter ${identifierType}...`}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          
          <Button onClick={handleSearch} disabled={!identifier}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Journey Timeline */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : journeyData && journeyData.journey.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Found {journeyData.journey.length} events
            </div>
            
            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 pl-6 space-y-6">
              {journeyData.journey.map((event, index) => (
                <div key={index} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[29px] top-1 bg-white dark:bg-gray-900 p-1">
                    {getEventIcon(event.event_type)}
                  </div>
                  
                  {/* Event card */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-sm">{event.event_name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {event.page_path}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {formatTimestamp(event.timestamp)}
                        </div>
                        {index > 0 && (
                          <div className="text-xs text-orange-600 font-medium">
                            +{getRelativeTime(event.timestamp, journeyData.journey[index - 1].timestamp)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {event.element_text && (
                      <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                        <span className="font-medium">Element:</span> {event.element_text}
                      </div>
                    )}
                    
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        <details>
                          <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
                            Metadata
                          </summary>
                          <pre className="mt-2 bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : searchQuery ? (
          <div className="text-center py-12 text-gray-500">
            No events found for this {identifierType}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Enter a {identifierType} to view their journey
          </div>
        )}
      </CardContent>
    </Card>
  );
}

