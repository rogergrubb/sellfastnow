import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Loader2, Eye, MessageSquare, MousePointerClick, TrendingUp } from "lucide-react";

interface BoostAnalyticsDashboardProps {
  promotedListingId: string;
}

export function BoostAnalyticsDashboard({ promotedListingId }: BoostAnalyticsDashboardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["boost-analytics", promotedListingId],
    queryFn: async () => {
      const response = await fetch(`/api/boosts/analytics/${promotedListingId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading analytics.</div>;
  }

  const { boost, totals, dailyData } = data;

  const chartData = dailyData.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Impressions: d.impressions,
    Views: d.views,
    Clicks: d.clicks,
    Messages: d.messages,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Boost Performance</span>
          <span className={`text-sm font-medium ${boost.status === "active" ? "text-green-500" : "text-gray-500"}`}>
            {boost.status.charAt(0).toUpperCase() + boost.status.slice(1)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-100 rounded-lg">
            <Eye className="h-6 w-6 mx-auto text-gray-600" />
            <p className="text-2xl font-bold">{totals.impressions}</p>
            <p className="text-sm text-gray-600">Impressions</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <MousePointerClick className="h-6 w-6 mx-auto text-gray-600" />
            <p className="text-2xl font-bold">{totals.views}</p>
            <p className="text-sm text-gray-600">Views</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <TrendingUp className="h-6 w-6 mx-auto text-gray-600" />
            <p className="text-2xl font-bold">{((totals.views / totals.impressions) * 100).toFixed(1)}%</p>
            <p className="text-sm text-gray-600">View Rate</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <MessageSquare className="h-6 w-6 mx-auto text-gray-600" />
            <p className="text-2xl font-bold">{totals.messages}</p>
            <p className="text-sm text-gray-600">Messages</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Impressions" fill="#8884d8" />
              <Bar dataKey="Views" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

