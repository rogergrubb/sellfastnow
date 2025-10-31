import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Users, 
  MousePointer, 
  Eye, 
  TrendingUp, 
  Monitor, 
  Smartphone, 
  Tablet,
  Clock,
  Globe,
  Activity
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { UserJourneyViewer } from "@/components/analytics/UserJourneyViewer";
import { HeatmapViewer } from "@/components/analytics/HeatmapViewer";

interface AnalyticsSummary {
  eventCounts: Array<{ event_type: string; event_name: string; count: number }>;
  pageViews: Array<{ page_path: string; views: number; unique_visitors: number }>;
  deviceBreakdown: Array<{ device_type: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
  hourlyActivity: Array<{ hour: number; count: number }>;
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [selectedPage, setSelectedPage] = useState<string>("");

  // Build query params
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case "24h":
        start.setHours(start.getHours() - 24);
        break;
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }
    
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch analytics summary
  const { data: analytics, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/tracking/summary", startDate, endDate, selectedPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedPage && { pagePath: selectedPage }),
      });
      
      const response = await fetch(`/api/tracking/summary?${params}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate totals
  const totalEvents = analytics?.eventCounts.reduce((sum, item) => sum + Number(item.count), 0) || 0;
  const totalPageViews = analytics?.pageViews.reduce((sum, item) => sum + Number(item.views), 0) || 0;
  const totalUniqueVisitors = analytics?.pageViews.reduce((sum, item) => sum + Number(item.unique_visitors), 0) || 0;
  const totalClicks = analytics?.eventCounts
    .filter(item => item.event_type === 'click')
    .reduce((sum, item) => sum + Number(item.count), 0) || 0;

  // Device breakdown
  const desktopCount = analytics?.deviceBreakdown.find(d => d.device_type === 'desktop')?.count || 0;
  const mobileCount = analytics?.deviceBreakdown.find(d => d.device_type === 'mobile')?.count || 0;
  const tabletCount = analytics?.deviceBreakdown.find(d => d.device_type === 'tablet')?.count || 0;
  const totalDevices = Number(desktopCount) + Number(mobileCount) + Number(tabletCount);

  // Peak hour
  const peakHour = analytics?.hourlyActivity.reduce((max, item) => 
    Number(item.count) > Number(max.count) ? item : max
  , { hour: 0, count: 0 });

  return (
    <>
      <Helmet>
        <title>Analytics Dashboard - SellFast.Now</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track user behavior, engagement, and A/B test results
            </p>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">All tracked interactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPageViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalUniqueVisitors.toLocaleString()} unique visitors
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Button and link clicks</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {peakHour?.hour ? `${peakHour.hour}:00` : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {peakHour?.count ? `${peakHour.count} events` : 'No data'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="pages">Pages</TabsTrigger>
                <TabsTrigger value="devices">Devices</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="journey">User Journey</TabsTrigger>
                <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Device Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Device Breakdown</CardTitle>
                    <CardDescription>Traffic by device type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Monitor className="h-5 w-5 mr-3 text-blue-600" />
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Desktop</span>
                            <span className="text-sm text-gray-600">
                              {totalDevices > 0 ? Math.round((Number(desktopCount) / totalDevices) * 100) : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${totalDevices > 0 ? (Number(desktopCount) / totalDevices) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        <span className="ml-4 text-sm font-bold">{Number(desktopCount).toLocaleString()}</span>
                      </div>

                      <div className="flex items-center">
                        <Smartphone className="h-5 w-5 mr-3 text-green-600" />
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Mobile</span>
                            <span className="text-sm text-gray-600">
                              {totalDevices > 0 ? Math.round((Number(mobileCount) / totalDevices) * 100) : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${totalDevices > 0 ? (Number(mobileCount) / totalDevices) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        <span className="ml-4 text-sm font-bold">{Number(mobileCount).toLocaleString()}</span>
                      </div>

                      <div className="flex items-center">
                        <Tablet className="h-5 w-5 mr-3 text-purple-600" />
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Tablet</span>
                            <span className="text-sm text-gray-600">
                              {totalDevices > 0 ? Math.round((Number(tabletCount) / totalDevices) * 100) : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${totalDevices > 0 ? (Number(tabletCount) / totalDevices) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        <span className="ml-4 text-sm font-bold">{Number(tabletCount).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Browser Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Browser Distribution</CardTitle>
                    <CardDescription>Top browsers used by visitors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics?.browserBreakdown.slice(0, 5).map((browser, index) => {
                        const total = analytics.browserBreakdown.reduce((sum, b) => sum + Number(b.count), 0);
                        const percentage = total > 0 ? (Number(browser.count) / total) * 100 : 0;
                        
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                              <Globe className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="text-sm font-medium">{browser.browser}</span>
                              <div className="ml-4 flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                                <div 
                                  className="bg-orange-600 h-2 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">{Math.round(percentage)}%</span>
                              <span className="text-sm font-bold min-w-[60px] text-right">
                                {Number(browser.count).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pages Tab */}
              <TabsContent value="pages" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Pages</CardTitle>
                    <CardDescription>Most visited pages on your site</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.pageViews.slice(0, 10).map((page, index) => (
                        <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                          <div className="flex-1">
                            <div className="font-medium text-sm mb-1">{page.page_path}</div>
                            <div className="text-xs text-gray-600">
                              {Number(page.unique_visitors).toLocaleString()} unique visitors
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{Number(page.views).toLocaleString()}</div>
                            <div className="text-xs text-gray-600">views</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Devices Tab */}
              <TabsContent value="devices" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Desktop
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{Number(desktopCount).toLocaleString()}</div>
                      <p className="text-sm text-gray-600 mt-2">
                        {totalDevices > 0 ? Math.round((Number(desktopCount) / totalDevices) * 100) : 0}% of traffic
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Mobile
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{Number(mobileCount).toLocaleString()}</div>
                      <p className="text-sm text-gray-600 mt-2">
                        {totalDevices > 0 ? Math.round((Number(mobileCount) / totalDevices) * 100) : 0}% of traffic
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tablet className="h-5 w-5" />
                        Tablet
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{Number(tabletCount).toLocaleString()}</div>
                      <p className="text-sm text-gray-600 mt-2">
                        {totalDevices > 0 ? Math.round((Number(tabletCount) / totalDevices) * 100) : 0}% of traffic
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Hourly Activity</CardTitle>
                    <CardDescription>Event distribution by hour of day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics?.hourlyActivity.map((hour) => {
                        const maxCount = Math.max(...(analytics?.hourlyActivity.map(h => Number(h.count)) || [1]));
                        const width = maxCount > 0 ? (Number(hour.count) / maxCount) * 100 : 0;
                        
                        return (
                          <div key={hour.hour} className="flex items-center gap-3">
                            <span className="text-sm font-medium w-16">
                              {String(hour.hour).padStart(2, '0')}:00
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                              <div 
                                className="bg-gradient-to-r from-orange-500 to-orange-600 h-6 rounded-full flex items-center justify-end pr-2" 
                                style={{ width: `${width}%` }}
                              >
                                {width > 15 && (
                                  <span className="text-xs font-medium text-white">
                                    {Number(hour.count).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            {width <= 15 && (
                              <span className="text-sm font-medium w-16">
                                {Number(hour.count).toLocaleString()}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Events */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Events</CardTitle>
                    <CardDescription>Most common user interactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics?.eventCounts.slice(0, 10).map((event, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{event.event_name}</div>
                            <div className="text-xs text-gray-600">{event.event_type}</div>
                          </div>
                          <div className="text-lg font-bold">{Number(event.count).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* User Journey Tab */}
              <TabsContent value="journey" className="space-y-6">
                <UserJourneyViewer />
              </TabsContent>

              {/* Heatmap Tab */}
              <TabsContent value="heatmap" className="space-y-6">
                <HeatmapViewer />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </>
  );
}

