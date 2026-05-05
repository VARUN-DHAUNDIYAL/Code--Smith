"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/use-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BrainCircuit, Check, X } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { useTheme } from "next-themes";

interface AIUsageMetricsProps {
  userId: string;
}

export function AIUsageMetrics({ userId }: AIUsageMetricsProps) {
  const { theme } = useTheme();
  
  const {
    data: aiUsageData,
    isLoading,
    error,
  } = useAnalytics({
    type: "ai-usage",
  });

  // Process data for charts
  const suggestionTypeData = processAIUsageByType(aiUsageData);
  const acceptanceData = processAIAcceptanceRate(aiUsageData);

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const ACCEPTANCE_COLORS = ['#10b981', '#ef4444'];

  // Determine text color based on theme
  const textColor = theme === "dark" ? "#f8fafc" : "#0f172a";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Usage Metrics</CardTitle>
          <CardDescription>
            Analyze how you're using AI suggestions in your coding workflow
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
                <h3 className="text-lg font-medium">Error loading AI usage data</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : !aiUsageData || aiUsageData.length === 0 ? (
            <div className="flex items-center justify-center p-6 text-center">
              <div>
                <BrainCircuit className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-lg font-medium">No AI usage data available</h3>
                <p className="text-sm text-muted-foreground">
                  Start using AI suggestions to generate usage metrics
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-center">AI Suggestions by Type</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={suggestionTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {suggestionTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} suggestions`, "Count"]}
                        contentStyle={{ 
                          backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                          color: textColor,
                          borderRadius: "6px",
                        }} 
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4 text-center">Acceptance Rate</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={acceptanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {acceptanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ACCEPTANCE_COLORS[index % ACCEPTANCE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} suggestions`, "Count"]}
                        contentStyle={{ 
                          backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                          color: textColor,
                          borderRadius: "6px",
                        }} 
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-muted/40">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Total Suggestions</CardTitle>
                      <BrainCircuit className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">{aiUsageData.length}</p>
                    <p className="text-xs text-muted-foreground">
                      AI-powered code suggestions
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/40">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Accepted</CardTitle>
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">
                      {aiUsageData.filter((item: any) => item.accepted).length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Suggestions you've accepted
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/40">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Rejected</CardTitle>
                      <X className="h-5 w-5 text-destructive" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">
                      {aiUsageData.filter((item: any) => !item.accepted).length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Suggestions you've rejected
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions to process data for charts
function processAIUsageByType(data: any[] | null) {
  if (!data || data.length === 0) return [];
  
  const typeCount: Record<string, number> = {};
  
  data.forEach(item => {
    const type = item.suggestionType || "Other";
    typeCount[type] = (typeCount[type] || 0) + 1;
  });
  
  return Object.entries(typeCount).map(([name, value]) => ({
    name,
    value,
  }));
}

function processAIAcceptanceRate(data: any[] | null) {
  if (!data || data.length === 0) return [];
  
  const accepted = data.filter(item => item.accepted).length;
  const rejected = data.length - accepted;
  
  return [
    { name: "Accepted", value: accepted },
    { name: "Rejected", value: rejected },
  ];
}
