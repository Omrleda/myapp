/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppStore } from '../../store/appStore';
import { Radio, Clock, ShieldAlert, Award, MapPin } from 'lucide-react';

export const ActiveSessionAlert: React.FC = () => {
  const {
    activeSession,
    timeRemainingSeconds,
    isSessionExpired,
    selectedClass,
  } = useAppStore();

  if (!activeSession) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-2">
          <Clock className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
          No Active Attendance Window
        </h4>
        <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
          The instructor has not opened an attendance session yet. When launched, a 120-second window will appear here automatically.
        </p>
      </div>
    );
  }

  const isLowTime = timeRemainingSeconds <= 30;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isLowTime
          ? 'bg-rose-950/40 border-rose-600/70 text-white shadow-lg shadow-rose-950/30'
          : 'bg-emerald-950/40 border-emerald-600/70 text-white shadow-lg shadow-emerald-950/30'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isLowTime
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {activeSession.mode === 'punch_in' ? (
              <Radio className="w-5 h-5 animate-pulse" />
            ) : (
              <Award className="w-5 h-5 animate-pulse" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-tight">
                {activeSession.sessionID}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                {activeSession.mode === 'punch_in' ? 'Mode 1: Punch-In' : 'Mode 2: Live Quiz'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Allowed Radius: <strong className="text-white">&le; {activeSession.radius}m</strong> &middot;{' '}
              {selectedClass.code}
            </p>
          </div>
        </div>

        {/* Big countdown badge */}
        <div className="text-right shrink-0">
          <div
            className={`text-2xl font-extrabold font-mono tabular-nums leading-none ${
              isLowTime ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {timeRemainingSeconds}s
          </div>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">WINDOW TIME</span>
        </div>
      </div>
    </div>
  );
};
