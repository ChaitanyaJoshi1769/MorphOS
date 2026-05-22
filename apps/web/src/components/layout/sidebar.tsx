"use client";

import Link from "next/link";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const sidebarItems = [
  { label: "Dashboard", href: "/", icon: "📊" },
  { label: "Applications", href: "/applications", icon: "📱" },
  { label: "Primitives", href: "/primitives", icon: "🧩" },
  { label: "Mutations", href: "/mutations", icon: "⚙️" },
  { label: "Agents", href: "/agents", icon: "🤖" },
  { label: "Personalization", href: "/personalization", icon: "👤" },
  { label: "Runtime Explorer", href: "/runtime", icon: "🔍" },
  { label: "Marketplace", href: "/marketplace", icon: "🏪" },
];

const adminItems = [
  { label: "Policies", href: "/admin/policies", icon: "🔐" },
  { label: "Audit Log", href: "/admin/audit", icon: "📋" },
  { label: "Settings", href: "/admin/settings", icon: "⚙️" },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="hidden sm:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } sm:translate-x-0 fixed sm:relative w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 z-50 overflow-y-auto flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            MorphOS
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Adaptive Software Platform
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-slate-200 dark:border-slate-700" />

          {/* Admin Section */}
          <div>
            <p className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
              Administration
            </p>
            <div className="space-y-1">
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors text-sm"
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Status: <span className="text-green-600">Connected</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
