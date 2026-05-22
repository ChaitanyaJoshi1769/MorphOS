"use client";

interface OverviewCardProps {
  title: string;
  value: string;
  change: string;
  icon: string;
}

export default function OverviewCard({
  title,
  value,
  change,
  icon,
}: OverviewCardProps) {
  const isPositive = !change.startsWith("-");

  return (
    <div className="card-base p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">
            {value}
          </p>
          <p
            className={`text-sm mt-2 ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {change} from last week
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
