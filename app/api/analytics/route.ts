import { NextRequest, NextResponse } from "next/server";
import { MetricType } from "@prisma/client";
import { currentUser } from "@/features/auth/actions";
import { AnalyticsService } from "@/lib/analytics-service";

/**
 * GET /api/analytics
 * Get analytics data for the current user.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const playgroundId = url.searchParams.get("playgroundId");

    let data;

    switch (type) {
      case "dashboard":
        data = await AnalyticsService.getDashboardMetrics(user.id);
        break;
      case "code-quality":
        if (!playgroundId) {
          return NextResponse.json(
            { error: "Playground ID is required" },
            { status: 400 }
          );
        }
        data = await AnalyticsService.getCodeQualityMetrics(playgroundId);
        break;
      case "ai-usage":
        data = await AnalyticsService.getAIUsageMetrics(user.id);
        break;
      case "productivity":
        data = await AnalyticsService.getUserProductivityMetrics(user.id);
        break;
      case "project-metrics": {
        if (!playgroundId) {
          return NextResponse.json(
            { error: "Playground ID is required" },
            { status: 400 }
          );
        }
        const metricType = url.searchParams.get("metricType") as
          | MetricType
          | undefined;
        data = await AnalyticsService.getProjectMetrics(
          playgroundId,
          metricType
        );
        break;
      }
      default:
        data = await AnalyticsService.getDashboardMetrics(user.id);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics
 * Track analytics data.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Type and data are required" },
        { status: 400 }
      );
    }

    switch (type) {
      case "code-quality":
        await AnalyticsService.trackCodeQuality({
          ...data,
          playgroundId: data.playgroundId,
        });
        break;
      case "ai-usage":
        await AnalyticsService.trackAIUsage({
          ...data,
          userId: user.id,
          playgroundId: data.playgroundId,
        });
        break;
      case "productivity":
        await AnalyticsService.trackUserProductivity({
          ...data,
          userId: user.id,
          playgroundId: data.playgroundId,
        });
        break;
      case "project-metric":
        await AnalyticsService.trackProjectMetric({
          ...data,
          playgroundId: data.playgroundId,
        });
        break;
      default:
        return NextResponse.json(
          { error: "Invalid analytics type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking analytics:", error);
    return NextResponse.json(
      { error: "Failed to track analytics data" },
      { status: 500 }
    );
  }
}
