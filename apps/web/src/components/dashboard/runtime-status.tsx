"use client";

export default function RuntimeStatus() {
  return (
    <div className="card-base p-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">
        Runtime Status
      </h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-slate-600 dark:text-slate-400">Core Engine</span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">Active</span>
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-slate-600 dark:text-slate-400">Agent System</span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">Ready</span>
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-slate-600 dark:text-slate-400">Mutation Engine</span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">Operational</span>
          </span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-slate-600 dark:text-slate-400">Personalization</span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-sm font-medium">Learning</span>
          </span>
        </div>
      </div>
    </div>
  );
}
