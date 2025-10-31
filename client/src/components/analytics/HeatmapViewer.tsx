import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Flame } from "lucide-react";

interface HeatmapClick {
  element_id: string | null;
  element_class: string | null;
  element_text: string | null;
  element_type: string | null;
  click_count: number;
}

export function HeatmapViewer() {
  const [pagePath, setPagePath] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: heatmapData, isLoading } = useQuery<{ clicks: HeatmapClick[] }>({
    queryKey: ["/api/tracking/heatmap", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return { clicks: [] };
      
      const response = await fetch(`/api/tracking/heatmap?pagePath=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Failed to fetch heatmap");
      return response.json();
    },
    enabled: !!searchQuery,
  });

  const handleSearch = () => {
    setSearchQuery(pagePath);
  };

  const maxClicks = heatmapData?.clicks.length 
    ? Math.max(...heatmapData.clicks.map(c => Number(c.click_count))) 
    : 1;

  const getHeatColor = (count: number) => {
    const intensity = count / maxClicks;
    
    if (intensity > 0.75) return 'bg-red-600 text-white';
    if (intensity > 0.5) return 'bg-orange-500 text-white';
    if (intensity > 0.25) return 'bg-yellow-500 text-gray-900';
    return 'bg-green-500 text-white';
  };

  const getHeatIntensity = (count: number) => {
    const intensity = count / maxClicks;
    
    if (intensity > 0.75) return '🔥🔥🔥';
    if (intensity > 0.5) return '🔥🔥';
    if (intensity > 0.25) return '🔥';
    return '✓';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-600" />
          Click Heatmap
        </CardTitle>
        <CardDescription>
          See which elements users click most on any page
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search Form */}
        <div className="flex gap-3 mb-6">
          <Input
            type="text"
            placeholder="Enter page path (e.g., /dashboard)"
            value={pagePath}
            onChange={(e) => setPagePath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          
          <Button onClick={handleSearch} disabled={!pagePath}>
            <Search className="h-4 w-4 mr-2" />
            Analyze
          </Button>
        </div>

        {/* Heatmap Data */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : heatmapData && heatmapData.clicks.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Found {heatmapData.clicks.length} clickable elements
            </div>
            
            {/* Heat Legend */}
            <div className="flex items-center gap-4 text-xs mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="font-medium">Heat Intensity:</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-500 rounded"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-600 rounded"></div>
                <span>Very High</span>
              </div>
            </div>
            
            {/* Click List */}
            <div className="space-y-2">
              {heatmapData.clicks.map((click, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg ${getHeatColor(Number(click.click_count))} transition-all hover:scale-[1.02]`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getHeatIntensity(Number(click.click_count))}</span>
                        <span className="font-medium">
                          {click.element_text || click.element_id || click.element_class || 'Unknown element'}
                        </span>
                      </div>
                      
                      <div className="text-sm opacity-90 space-y-1">
                        {click.element_type && (
                          <div>Type: <span className="font-mono">&lt;{click.element_type}&gt;</span></div>
                        )}
                        {click.element_id && (
                          <div>ID: <span className="font-mono">#{click.element_id}</span></div>
                        )}
                        {click.element_class && (
                          <div>Class: <span className="font-mono">.{click.element_class.split(' ')[0]}</span></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {Number(click.click_count).toLocaleString()}
                      </div>
                      <div className="text-sm opacity-90">clicks</div>
                    </div>
                  </div>
                  
                  {/* Progress bar showing relative intensity */}
                  <div className="mt-3 bg-white bg-opacity-20 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all" 
                      style={{ width: `${(Number(click.click_count) / maxClicks) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : searchQuery ? (
          <div className="text-center py-12 text-gray-500">
            No click data found for this page
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Enter a page path to view click heatmap
          </div>
        )}
      </CardContent>
    </Card>
  );
}

