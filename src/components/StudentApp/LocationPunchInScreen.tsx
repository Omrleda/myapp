/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { CAMPUS_LOCATION_PRESETS } from '../../data/seedData';
import { calculateHaversineDistance } from '../../engine/haversine';
import { MapPin, Navigation, User, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const LocationPunchInScreen: React.FC = () => {
  const {
    activeSession,
    currentStudent,
    setCurrentStudent,
    students,
    studentSelectedPresetId,
    setStudentSelectedPresetId,
    studentSimulatedLat,
    studentSimulatedLng,
    useRealGps,
    setUseRealGps,
    acquireRealGpsCoordinates,
    submitAttendance,
  } = useAppStore();

  const [loading, setLoading] = useState(false);

  const teacherLat = activeSession ? activeSession.latitude : 37.774929;
  const teacherLng = activeSession ? activeSession.longitude : -122.419416;
  const allowedRadius = activeSession ? activeSession.radius : 50;

  // Real-time client estimate
  const estimate = calculateHaversineDistance(
    teacherLat,
    teacherLng,
    studentSimulatedLat,
    studentSimulatedLng
  );

  const isEstimatedInBounds = estimate.distanceMeters <= allowedRadius;

  const handlePunchIn = () => {
    setLoading(true);
    submitAttendance(studentSimulatedLat, studentSimulatedLng);
    setLoading(false);
  };

  const handleToggleRealGps = async () => {
    if (!useRealGps) {
      const coords = await acquireRealGpsCoordinates();
      if (!coords) {
        alert('Could not acquire real GPS position. Keeping campus preset.');
      }
    } else {
      setUseRealGps(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Student Identity Switcher */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-sky-400" />
            Active Student Identity
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Test Role Switcher</span>
        </label>
        <select
          value={currentStudent.uid}
          onChange={(e) => {
            const found = students.find((s) => s.uid === e.target.value);
            if (found) setCurrentStudent(found);
          }}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
        >
          {students.map((st) => (
            <option key={st.uid} value={st.uid}>
              {st.name} ({st.studentID || 'No ID'}) {st.studentID === 'MP2-2024-9999' ? '⚠️ Not Enrolled' : '✓ Enrolled'}
            </option>
          ))}
        </select>
        {currentStudent.studentID === 'MP2-2024-9999' && (
          <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Unenrolled student profile (Will trigger Check 3 Rejection)
          </p>
        )}
      </div>

      {/* GPS Location Testbench Presets */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            Physical Proximity Simulator
          </span>
          <button
            type="button"
            onClick={handleToggleRealGps}
            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
              useRealGps
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {useRealGps ? 'Using Real GPS' : 'Use Real GPS'}
          </button>
        </div>

        {!useRealGps && (
          <div className="grid grid-cols-2 gap-2">
            {CAMPUS_LOCATION_PRESETS.map((preset) => {
              const isSelected = studentSelectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setStudentSelectedPresetId(preset.id)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    isSelected
                      ? preset.inBounds
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                        : 'bg-rose-950/40 border-rose-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-200 truncate">
                      {preset.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1 rounded ${
                        preset.inBounds
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : 'bg-rose-900/60 text-rose-300'
                      }`}
                    >
                      {preset.offsetMeters}m
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Real-Time Distance readout */}
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-slate-400 text-[10px] block">ESTIMATED CLIENT DISTANCE</span>
            <span
              className={`text-sm font-bold tabular-nums ${
                isEstimatedInBounds ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {estimate.distanceMeters.toFixed(1)} meters
            </span>
          </div>

          <div className="text-right">
            <span className="text-slate-400 text-[10px] block">PERMITTED RADIUS</span>
            <span className="text-sm font-bold text-slate-200 tabular-nums">
              &le; {allowedRadius}m
            </span>
          </div>
        </div>
      </div>

      {/* Primary Punch-In CTA Button */}
      <button
        type="button"
        onClick={handlePunchIn}
        disabled={!activeSession || loading}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 active:scale-[0.99] disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Navigation className="w-4 h-4 fill-current" />
        {loading ? 'Verifying with Authoritative Engine...' : 'Punch In Attendance Now'}
      </button>
    </div>
  );
};
