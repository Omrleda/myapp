/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppStore, AppViewMode } from '../store/appStore';
import { Smartphone, MonitorSmartphone, ShieldCheck, RefreshCw, Flame } from 'lucide-react';

export const TopNav: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    activeSession,
    timeRemainingSeconds,
    resetAllSessionsAndRecords,
    selectedClass,
  } = useAppStore();

  const navLinks: { id: AppViewMode; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dual',
      label: 'Dual Device Runtime',
      icon: <MonitorSmartphone className="w-4 h-4" />,
    },
    {
      id: 'firebase',
      label: 'Firebase Actions',
      icon: <Flame className="w-4 h-4 text-amber-400 fill-current" />,
    },
    {
      id: 'flutter',
      label: 'Flutter Project',
      icon: <Smartphone className="w-4 h-4 text-sky-400" />,
    },
    {
      id: 'teacher',
      label: 'Teacher Console',
      icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'student',
      label: 'Student Mobile',
      icon: <Smartphone className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: 'specs',
      label: 'Specs & Rules',
      icon: <ShieldCheck className="w-4 h-4 text-slate-400" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand title, single line */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-bold text-white text-base">
            CT
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
              ClassTrack
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-medium border border-slate-700">
                Flutter &middot; Firebase
              </span>
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation views */}
        <nav className="hidden md:flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
          {navLinks.map((tab) => {
            const isActive = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Active Status & Reset Action */}
        <div className="flex items-center gap-3 shrink-0">
          {activeSession ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-700/50 text-emerald-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold">{activeSession.sessionID}</span>
              <span className="text-slate-400">&middot;</span>
              <span className="font-bold text-emerald-200 tabular-nums">
                {timeRemainingSeconds}s left
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 text-xs text-slate-400 font-mono">
              <span>{selectedClass.code}</span>
              <span>&middot;</span>
              <span>No Active Session</span>
            </div>
          )}

          <button
            onClick={resetAllSessionsAndRecords}
            title="Reset simulation sessions and attendance records"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset State</span>
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 bg-slate-900/90 border-t border-slate-800/60 overflow-x-auto">
        {navLinks.map((tab) => {
          const isActive = viewMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
