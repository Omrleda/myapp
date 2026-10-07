/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppStore } from '../store/appStore';
import { TeacherView } from './TeacherApp/TeacherView';
import { StudentView } from './StudentApp/StudentView';
import { calculateHaversineDistance } from '../engine/haversine';
import {
  Smartphone,
  Radio,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Flame,
} from 'lucide-react';

export const DualDeviceView: React.FC = () => {
  const {
    activeSession,
    timeRemainingSeconds,
    currentStudent,
    setCurrentStudent,
    students,
    studentSimulatedLat,
    studentSimulatedLng,
    studentSelectedPresetId,
    setStudentSelectedPresetId,
    launchSession,
    submitAttendance,
    firebaseLogs,
    setViewMode,
  } = useAppStore();

  const teacherLat = activeSession ? activeSession.latitude : 37.774929;
  const teacherLng = activeSession ? activeSession.longitude : -122.419416;
  const allowedRadius = activeSession ? activeSession.radius : 50;

  const currentDistanceCalc = calculateHaversineDistance(
    teacherLat,
    teacherLng,
    studentSimulatedLat,
    studentSimulatedLng
  );

  const isInBounds = currentDistanceCalc.distanceMeters <= allowedRadius;

  // Preset quick triggers for testing
  const handleQuickTestValid = () => {
    // Select enrolled student Alex Johnson, set preset to front row (6.5m), ensure session is open
    const alex = students.find((s) => s.uid === 'student_alex');
    if (alex) setCurrentStudent(alex);
    setStudentSelectedPresetId('front_row');
    if (!activeSession) {
      launchSession('punch_in', 50);
    }
  };

  const handleQuickTestOutOfRadius = () => {
    // Set preset to corridor (78m) or canteen (310m)
    setStudentSelectedPresetId('outside_hallway');
    if (!activeSession) {
      launchSession('punch_in', 50);
    }
  };

  const handleQuickTestUnenrolled = () => {
    const jordan = students.find((s) => s.studentID === 'MP2-2024-9999');
    if (jordan) setCurrentStudent(jordan);
    setStudentSelectedPresetId('front_row');
    if (!activeSession) {
      launchSession('punch_in', 50);
    }
  };

  const handleQuickTestExpired = () => {
    if (!activeSession) {
      const sess = launchSession('punch_in', 50);
      // Simulate submission timestamp after expiry
      submitAttendance(studentSimulatedLat, studentSimulatedLng, undefined, sess.expiryTime + 5000);
    } else {
      submitAttendance(studentSimulatedLat, studentSimulatedLng, undefined, activeSession.expiryTime + 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Interactive Verification Testbench Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Anti-Proxy Verification Testbench
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            &mdash; Test edge-case scenarios against the 5-step decision matrix
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleQuickTestValid}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            1. Valid Proximity (&le;50m)
          </button>

          <button
            onClick={handleQuickTestOutOfRadius}
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-600/60 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            2. Proxy Out-of-Bounds (78m)
          </button>

          <button
            onClick={handleQuickTestUnenrolled}
            className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-600/60 text-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            3. Unenrolled Student
          </button>

          <button
            onClick={handleQuickTestExpired}
            className="px-2.5 py-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-600/60 text-purple-300 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            4. Expired Window (&gt;120s)
          </button>
        </div>
      </div>

      {/* Live Firebase Transaction Stream Strip */}
      {firebaseLogs.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="p-1 rounded bg-amber-500/20 text-amber-400 shrink-0">
              <Flame className="w-3.5 h-3.5 fill-current" />
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">
              Latest Firebase Event:
            </span>
            <span className="font-mono text-emerald-400 font-bold truncate text-[11px]">
              {firebaseLogs[0].actionName}
            </span>
            <span className="text-slate-400 truncate hidden md:inline text-[11px]">
              &mdash; {firebaseLogs[0].details}
            </span>
          </div>

          <button
            onClick={() => setViewMode('firebase')}
            className="text-[11px] font-mono font-semibold text-amber-400 hover:text-amber-300 underline shrink-0 whitespace-nowrap"
          >
            Open Firebase Action Inspector &rarr;
          </button>
        </div>
      )}

      {/* Side-by-Side Dual Simulator Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Teacher App Controller (7 cols) */}
        <div className="xl:col-span-7">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Instructor Station (Teacher App)
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              Session Controller & Radar
            </span>
          </div>
          <TeacherView />
        </div>

        {/* Right: Student Mobile Phone (5 cols) */}
        <div className="xl:col-span-5">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Student Mobile Client (Flutter Runtime)
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              Synchronous 120s Window
            </span>
          </div>
          <StudentView />
        </div>
      </div>
    </div>
  );
};
