"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/use-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock, Code, Zap } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useTheme } from "next-themes";
import { format, parseISO, subDays, startOfDay } from "date-fns";

interface ProductivityMetricsProps {
  userId: string;
}

export function ProductivityMetrics({ userId }: ProductivityMetricsProps) {
  const { theme } = useTheme();
  
  const {
    data: productivityData,
    isLoading,
    error,
  } = useAnalytics({
    type: "productivity",
  });

  // Process data for charts
  const timeSeriesData = processTimeSeriesData(productivityData);
  const activityTypeData = processActivityTypeData(productivityData);

  // Determine colors based on theme
  const textColor = theme === "dark" ? "#f8fafc" : "#0f172a";
  const gridColor = theme === "dark" ? "#334155" : "#e2e8f0";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Productivity Metrics</CardTitle>
          <CardDescription>
            Track your coding productivity and time management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-8">
              <Skeleton className="h-[300px] w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[100px] w-full" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-6 text-center">
              <div>
                <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
                <h3 className="text-lg font-medium">Error loading productivity data</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : !productivityData || productivityData.length === 0 ? (
            <div className="flex items-center justify-center p-6 text-center">
              <div>
                <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-lg font-medium">No productivity data available</h3>
                <p className="text-sm text-muted-foreground">
                  Start coding to generate productivity metrics
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Coding Activity Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke={textColor} 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke={textColor} 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value} min`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} minutes`, "Coding Time"]}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ 
                        backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                        color: textColor,
                        borderRadius: "6px",
                      }} 
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="duration" 
                      name="Coding Time" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.2} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-muted/40">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Total Coding Time</CardTitle>
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">
                      {Math.round(getTotalDuration(productivityData) / 60)} min
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total time spent coding
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/40">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Most Active Activity</CardTitle>
                      <Code className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">
                      {getMostActiveActivity(productivityData)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your most frequent activity
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/40">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Productivity Score</CardTitle>
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">
                      {calculateProductivityScore(productivityData)}/100
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Based on consistency and duration
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Activity Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {activityTypeData.map((activity, index) => (
                    <Card key={index} className="bg-muted/40">
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm">{activity.type}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold">{Math.round(activity.duration / 60)} min</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((activity.duration / getTotalDuration(productivityData)) * 100)}% of total time
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions to process data for charts
function processTimeSeriesData(data: any[] | null) {
  if (!data || data.length === 0) return [];
  
  // Create a map of dates to durations
  const dateMap = new Map();
  
  // Get the last 7 days
  const today = startOfDay(new Date());
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(today, i), 'MMM dd');
    dateMap.set(date, 0);
  }
  
  // Add durations from data
  data.forEach(item => {
    if (item.timestamp) {
      const date = format(parseISO(item.timestamp), 'MMM dd');
      if (dateMap.has(date)) {
        dateMap.set(date, dateMap.get(date) + (item.duration / 60)); // Convert seconds to minutes
      }
    }
  });
  
  // Convert map to array
  return Array.from(dateMap.entries()).map(([date, duration]) => ({
    date,
    duration: Math.round(duration as number),
  }));
}

function processActivityTypeData(data: any[] | null) {
  if (!data || data.length === 0) return [];
  
  const activityMap = new Map();
  
  data.forEach(item => {
    const type = item.activityType || "Other";
    activityMap.set(type, (activityMap.get(type) || 0) + item.duration);
  });
  
  return Array.from(activityMap.entries())
    .map(([type, duration]) => ({ type, duration }))
    .sort((a, b) => (b.duration as number) - (a.duration as number))
    .slice(0, 4); // Get top 4 activities
}

function getTotalDuration(data: any[] | null) {
  if (!data || data.length === 0) return 0;
  
  return data.reduce((total, item) => total + (item.duration || 0), 0);
}

function getMostActiveActivity(data: any[] | null) {
  if (!data || data.length === 0) return "N/A";
  
  const activityMap = new Map();
  
  data.forEach(item => {
    const type = item.activityType || "Other";
    activityMap.set(type, (activityMap.get(type) || 0) + item.duration);
  });
  
  let maxActivity = "";
  let maxDuration = 0;
  
  activityMap.forEach((duration, activity) => {
    if (duration > maxDuration) {
      maxDuration = duration;
      maxActivity = activity;
    }
  });
  
  return maxActivity;
}

function calculateProductivityScore(data: any[] | null) {
  if (!data || data.length === 0) return 0;
  
  // This is a simplified scoring algorithm
  // In a real implementation, this would be more sophisticated
  const totalDuration = getTotalDuration(data) / 60; // Convert to minutes
  const uniqueDays = new Set(data.map(item => 
    item.timestamp ? format(parseISO(item.timestamp), 'yyyy-MM-dd') : ''
  )).size;
  
  const durationScore = Math.min(totalDuration / 60 * 50, 50); // Max 50 points for duration
  const consistencyScore = Math.min(uniqueDays * 10, 50); // Max 50 points for consistency
  
  return Math.round(durationScore + consistencyScore);
}