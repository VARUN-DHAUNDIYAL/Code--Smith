import { Suspense } from "react";
import { Metadata } from "next";
import { currentUser } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { AnalyticsDashboard } from "@/features/analytics/components/analytics-dashboard";
import { AnalyticsLoading } from "@/features/analytics/components/analytics-loading";

export const metadata: Metadata = {
  title: "Analytics Dashboard",
  description: "View your coding analytics and metrics",
};

export default async function AnalyticsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Analytics Dashboard"
        text="Track your coding metrics and productivity"
      />
      <div className="grid gap-8">
        <Suspense fallback={<AnalyticsLoading />}>
          <AnalyticsDashboard userId={user.id} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}