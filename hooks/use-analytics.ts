import { useState, useEffect, useCallback } from "react";
import { MetricType } from "@prisma/client";

type AnalyticsType = "dashboard" | "code-quality" | "ai-usage" | "productivity" | "project-metrics";

interface UseAnalyticsOptions {
  type: AnalyticsType;
  playgroundId?: string;
  metricType?: MetricType;
  autoFetch?: boolean;
}

export function useAnalytics(options: UseAnalyticsOptions) {
  const { type, playgroundId, metricType, autoFetch = true } = options;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if ((type === "code-quality" || type === "project-metrics") && !playgroundId) {
      setError("Playground ID is required for this analytics type");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let url = `/api/analytics?type=${type}`;
      
      if (playgroundId) {
        url += `&playgroundId=${playgroundId}`;
      }
      
      if (metricType) {
        url += `&metricType=${metricType}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch analytics data");
    } finally {
      setIsLoading(false);
    }
  }, [type, playgroundId, metricType]);

  const trackAnalytics = useCallback(async (trackType: string, trackData: any) => {
    try {
      const response = await fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: trackType,
          data: trackData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to track analytics: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error("Error tracking analytics:", err);
      throw err;
    }
  }, []);

  // Track code quality metrics
  const trackCodeQuality = useCallback(
    async (data: {
      playgroundId: string;
      fileId?: string;
      linesOfCode?: number;
      complexity?: number;
      duplications?: number;
      bugs?: number;
      vulnerabilities?: number;
      codeSmells?: number;
    }) => {
      return trackAnalytics("code-quality", data);
    },
    [trackAnalytics]
  );

  // Track AI usage metrics
  const trackAIUsage = useCallback(
    async (data: {
      playgroundId: string;
      suggestionType: string;
      accepted: boolean;
    }) => {
      return trackAnalytics("ai-usage", data);
    },
    [trackAnalytics]
  );

  // Track user productivity
  const trackUserProductivity = useCallback(
    async (data: {
      playgroundId: string;
      activityType: string;
      duration: number;
    }) => {
      return trackAnalytics("productivity", data);
    },
    [trackAnalytics]
  );

  // Track project metrics
  const trackProjectMetric = useCallback(
    async (data: {
      playgroundId: string;
      metricType: MetricType;
      metricName: string;
      metricValue: number;
    }) => {
      return trackAnalytics("project-metric", data);
    },
    [trackAnalytics]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, autoFetch]);

  return {
    data,
    isLoading,
    error,
    fetchAnalytics,
    trackCodeQuality,
    trackAIUsage,
    trackUserProductivity,
    trackProjectMetric,
  };
}