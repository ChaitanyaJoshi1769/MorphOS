"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import OverviewCard from "@/components/dashboard/overview-card";
import RuntimeStatus from "@/components/dashboard/runtime-status";
import RecentMutations from "@/components/dashboard/recent-mutations";
import AgentMetrics from "@/components/dashboard/agent-metrics";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
            MorphOS Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            AI-native adaptive software platform
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <OverviewCard
            title="Active Applications"
            value="12"
            change="+2"
            icon="📱"
          />
          <OverviewCard
            title="Total Mutations"
            value="1,247"
            change="+89"
            icon="⚙️"
          />
          <OverviewCard
            title="Agents Active"
            value="8"
            change="+1"
            icon="🤖"
          />
          <OverviewCard
            title="Avg Latency"
            value="142ms"
            change="-12%"
            icon="⚡"
          />
        </div>

        {/* Runtime & Mutations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RuntimeStatus />
          </div>
          <div>
            <AgentMetrics />
          </div>
        </div>

        {/* Recent Activity */}
        <RecentMutations />
      </div>
    </DashboardLayout>
  );
}
