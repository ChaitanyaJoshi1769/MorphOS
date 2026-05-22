"use client";

export default function AgentMetrics() {
  return (
    <div className="card-base p-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">
        Agent Metrics
      </h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-slate-600 dark:text-slate-400">Success Rate</span>
            <span className="text-sm font-semibold">94%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: "94%" }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-slate-600 dark:text-slate-400">Avg Latency</span>
            <span className="text-sm font-semibold">142ms</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: "58%" }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-slate-600 dark:text-slate-400">Tasks Completed</span>
            <span className="text-sm font-semibold">427</span>
          </div>
        </div>
      </div>
    </div>
  );
}
