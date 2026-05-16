import { db } from "./db";
import { MetricType } from "@prisma/client";

/**
 * Analytics Service for tracking and analyzing user activities
 */
export class AnalyticsService {
  /**
   * Track code quality metrics for a playground
   */
  static async trackCodeQuality({
    playgroundId,
    fileId,
    linesOfCode,
    complexity,
    duplications,
    bugs,
    vulnerabilities,
    codeSmells,
  }: {
    playgroundId: string;
    fileId?: string;
    linesOfCode?: number;
    complexity?: number;
    duplications?: number;
    bugs?: number;
    vulnerabilities?: number;
    codeSmells?: number;
  }) {
    try {
      await db.codeQualityMetrics.create({
        data: {
          playgroundId,
          fileId,
          linesOfCode,
          complexity,
          duplications,
          bugs,
          vulnerabilities,
          codeSmells,
        },
      });

      // Also update the project metrics with a summary
      if (linesOfCode) {
        await this.trackProjectMetric({
          playgroundId,
          metricType: MetricType.CODE_QUALITY,
          metricName: "linesOfCode",
          metricValue: linesOfCode,
        });
      }

      if (bugs) {
        await this.trackProjectMetric({
          playgroundId,
          metricType: MetricType.CODE_QUALITY,
          metricName: "bugs",
          metricValue: bugs,
        });
      }
    } catch (error) {
      console.error("Error tracking code quality metrics:", error);
    }
  }

  /**
   * Track AI usage metrics
   */
  static async trackAIUsage({
    userId,
    playgroundId,
    suggestionType,
    accepted,
  }: {
    userId: string;
    playgroundId: string;
    suggestionType: string;
    accepted: boolean;
  }) {
    try {
      await db.aIUsageMetrics.create({
        data: {
          userId,
          playgroundId,
          suggestionType,
          accepted,
        },
      });

      // Update project metrics with AI usage summary
      await this.trackProjectMetric({
        playgroundId,
        metricType: MetricType.AI_USAGE,
        metricName: accepted ? "acceptedSuggestions" : "rejectedSuggestions",
        metricValue: 1,
      });
    } catch (error) {
      console.error("Error tracking AI usage metrics:", error);
    }
  }

  /**
   * Track user productivity
   */
  static async trackUserProductivity({
    userId,
    playgroundId,
    activityType,
    duration,
  }: {
    userId: string;
    playgroundId: string;
    activityType: string;
    duration: number;
  }) {
    try {
      await db.userProductivity.create({
        data: {
          userId,
          playgroundId,
          activityType,
          duration,
        },
      });
    } catch (error) {
      console.error("Error tracking user productivity:", error);
    }
  }

  /**
   * Track project metrics
   */
  static async trackProjectMetric({
    playgroundId,
    metricType,
    metricName,
    metricValue,
  }: {
    playgroundId: string;
    metricType: MetricType;
    metricName: string;
    metricValue: number;
  }) {
    try {
      await db.projectMetrics.create({
        data: {
          playgroundId,
          metricType,
          metricName,
          metricValue,
        },
      });
    } catch (error) {
      console.error("Error tracking project metrics:", error);
    }
  }

  /**
   * Get code quality metrics for a playground
   */
  static async getCodeQualityMetrics(playgroundId: string) {
    try {
      return await db.codeQualityMetrics.findMany({
        where: { playgroundId },
        orderBy: { timestamp: "desc" },
        take: 10,
      });
    } catch (error) {
      console.error("Error getting code quality metrics:", error);
      return [];
    }
  }

  /**
   * Get AI usage metrics for a user
   */
  static async getAIUsageMetrics(userId: string) {
    try {
      return await db.aIUsageMetrics.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
        take: 100,
      });
    } catch (error) {
      console.error("Error getting AI usage metrics:", error);
      return [];
    }
  }

  /**
   * Get user productivity metrics
   */
  static async getUserProductivityMetrics(userId: string) {
    try {
      return await db.userProductivity.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
        take: 100,
      });
    } catch (error) {
      console.error("Error getting user productivity metrics:", error);
      return [];
    }
  }

  /**
   * Get project metrics
   */
  static async getProjectMetrics(playgroundId: string, metricType?: MetricType) {
    try {
      return await db.projectMetrics.findMany({
        where: {
          playgroundId,
          ...(metricType ? { metricType } : {}),
        },
        orderBy: { timestamp: "desc" },
        take: 100,
      });
    } catch (error) {
      console.error("Error getting project metrics:", error);
      return [];
    }
  }

  /**
   * Get aggregated metrics for dashboard
   */
  static async getDashboardMetrics(userId: string) {
    try {
      // Get user's playgrounds
      const playgrounds = await db.playground.findMany({
        where: { userId },
        select: { id: true },
      });

      const playgroundIds = playgrounds.map((p) => p.id);

      // Get total lines of code
      const totalLinesOfCode = await db.codeQualityMetrics.aggregate({
        where: {
          playgroundId: { in: playgroundIds },
        },
        _sum: {
          linesOfCode: true,
        },
      });

      // Get total AI suggestions
      const totalAISuggestions = await db.aIUsageMetrics.count({
        where: {
          playgroundId: { in: playgroundIds },
        },
      });

      // Get accepted AI suggestions
      const acceptedAISuggestions = await db.aIUsageMetrics.count({
        where: {
          playgroundId: { in: playgroundIds },
          accepted: true,
        },
      });

      // Get total productivity time
      const totalProductivityTime = await db.userProductivity.aggregate({
        where: {
          playgroundId: { in: playgroundIds },
        },
        _sum: {
          duration: true,
        },
      });

      return {
        totalLinesOfCode: totalLinesOfCode._sum.linesOfCode || 0,
        totalAISuggestions,
        acceptedAISuggestions,
        acceptanceRate: totalAISuggestions > 0 ? acceptedAISuggestions / totalAISuggestions : 0,
        totalProductivityTime: totalProductivityTime._sum.duration || 0,
      };
    } catch (error) {
      console.error("Error getting dashboard metrics:", error);
      return {
        totalLinesOfCode: 0,
        totalAISuggestions: 0,
        acceptedAISuggestions: 0,
        acceptanceRate: 0,
        totalProductivityTime: 0,
      };
    }
  }
}