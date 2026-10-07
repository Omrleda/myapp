/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppStore } from '../../store/appStore';
import { SessionLauncher } from './SessionLauncher';
import { LiveRadarMonitor } from './LiveRadarMonitor';
import { LiveAttendanceRoster } from './LiveAttendanceRoster';
import { Radio, Users, Sparkles, BookOpen } from 'lucide-react';

export const TeacherView: React.FC = () => {
  const { teacher, selectedClass, classes, setSelectedClass, activeSession } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Instructor Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center text-lg">
            OH
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{teacher.name}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                Course Faculty
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {teacher.email} &middot; Mobile Programming & Distributed Systems
            </p>
          </div>
        </div>

        {/* Course quick switch */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <select
            value={selectedClass.classID}
            onChange={(e) => {
              const found = classes.find((c) => c.classID === e.target.value);
              if (found) setSelectedClass(found);
            }}
            className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            {classes.map((cls) => (
              <option key={cls.classID} value={cls.classID}>
                {cls.code}: {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Teacher Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Launcher & Control (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <SessionLauncher />
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              Authoritative Anti-Proxy Protocol
            </h4>
            <p>
              Students must be within the geofenced radius (<strong className="text-white">&le; {activeSession?.radius || 50}m</strong>) and punch in within the strictly enforced <strong className="text-white">120-second window</strong>.
            </p>
            <p>
              All mathematical distance evaluations are executed server-side via Firebase Cloud Functions using the Haversine formula to eliminate client GPS spoofing.
            </p>
          </div>
        </div>

        {/* Center / Right Column: Live Radar & Attendance Roster (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  Live Geofence Proximity Radar
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time spatial visualization of student GPS pings relative to podium
                </p>
              </div>
            </div>
            <LiveRadarMonitor />
          </div>

          <LiveAttendanceRoster />
        </div>
      </div>
    </div>
  );
};
