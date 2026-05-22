"use client";

export default function RecentMutations() {
  return (
    <div className="card-base p-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">
        Recent Mutations
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400">Type</th>
              <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400">Application</th>
              <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400">Status</th>
              <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400">Time</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              <td className="py-3 px-4">UI Layout</td>
              <td className="py-3 px-4">Email Client</td>
              <td className="py-3 px-4"><span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">Active</span></td>
              <td className="py-3 px-4 text-slate-600 dark:text-slate-400">2 min ago</td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              <td className="py-3 px-4">Workflow Transform</td>
              <td className="py-3 px-4">CRM System</td>
              <td className="py-3 px-4"><span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">Verified</span></td>
              <td className="py-3 px-4 text-slate-600 dark:text-slate-400">5 min ago</td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              <td className="py-3 px-4">Middleware Injection</td>
              <td className="py-3 px-4">Analytics Dashboard</td>
              <td className="py-3 px-4"><span className="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded text-xs">Testing</span></td>
              <td className="py-3 px-4 text-slate-600 dark:text-slate-400">12 min ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
