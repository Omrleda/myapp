/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { SessionMode } from '../../types';
import { DEFAULT_ANCHOR_GPS } from '../../data/seedData';
import { Play, Square, MapPin, Radio, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const SessionLauncher: React.FC = () => {
  const {
    activeSession,
    selectedClass,
    classes,
    setSelectedClass,
    launchSession,
    closeSession,
    timeRemainingSeconds,
    isSessionExpired,
  } = useAppStore();

  const [mode, setMode] = useState<SessionMode>('punch_in');
  const [radius, setRadius] = useState<number>(50.0);
  const [anchorType, setAnchorType] = useState<'preset' | 'device'>('preset');
  const [customLat, setCustomLat] = useState<number>(DEFAULT_ANCHOR_GPS.latitude);
  const [customLng, setCustomLng] = useState<number>(DEFAULT_ANCHOR_GPS.longitude);
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleFetchDeviceGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomLat(pos.coords.latitude);
        setCustomLng(pos.coords.longitude);
        setAnchorType('device');
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleLaunch = () => {
    const lat = anchorType === 'preset' ? DEFAULT_ANCHOR_GPS.latitude : customLat;
    const lng = anchorType === 'preset' ? DEFAULT_ANCHOR_GPS.longitude : customLng;
    launchSession(mode, radius, lat, lng);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            Session Control & Launch
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure geo-perimeter and authoritative 120s timer
          </p>
        </div>

        {activeSession ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            LIVE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 font-mono">
            STANDBY
          </span>
        )}
      </div>

      {activeSession ? (
        /* Active Session Monitor Card */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-slate-500 uppercase">Active Session ID</div>
              <div className="text-base font-bold font-mono text-emerald-400">{activeSession.sessionID}</div>
              <div className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <span>Mode: <strong className="text-white">{activeSession.mode === 'punch_in' ? 'Location Punch-In' : '5-Question Live Quiz'}</strong></span>
                <span>&middot;</span>
                <span>Radius: <strong className="text-white">&le; {activeSession.radius}m</strong></span>
              </div>
            </div>

            {/* Circular Countdown Ring */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400 transition-all duration-500"
                  strokeDasharray={`${(timeRemainingSeconds / 120) * 100}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-sm font-extrabold font-mono text-white tabular-nums">
                  {timeRemainingSeconds}
                </span>
                <span className="block text-[8px] text-slate-400 -mt-1">SEC</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => closeSession(activeSession.sessionID)}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              End Attendance Window Early
            </button>
          </div>
        </div>
      ) : (
        /* Session Launcher Form */
        <div className="space-y-4">
          {/* Course Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Course / Class Module
            </label>
            <select
              value={selectedClass.classID}
              onChange={(e) => {
                const found = classes.find((c) => c.classID === e.target.value);
                if (found) setSelectedClass(found);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {classes.map((cls) => (
                <option key={cls.classID} value={cls.classID}>
                  {cls.code} - {cls.name} ({cls.room})
                </option>
              ))}
            </select>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Attendance Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('punch_in')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'punch_in'
                    ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Mode 1: Punch-In</span>
                  {mode === 'punch_in' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Instant GPS proximity verification (≤ allowed radius)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('quiz')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'quiz'
                    ? 'bg-sky-950/50 border-sky-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Mode 2: Live Quiz</span>
                  {mode === 'quiz' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  5 in-app Flutter MCQs + physical location verification
                </div>
              </button>
            </div>
          </div>

          {/* Geo-Radius Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Permitted Geo-Radius Perimeter
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                {radius} meters
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              {[25, 50, 100].map((rVal) => (
                <button
                  key={rVal}
                  type="button"
                  onClick={() => setRadius(rVal)}
                  className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all ${
                    radius === rVal
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {rVal}m
                </button>
              ))}
            </div>

            <input
              type="range"
              min={10}
              max={150}
              step={5}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
            />
          </div>

          {/* Instructor GPS Anchor */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-xs font-medium text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Instructor GPS Coordinates
              </span>
              <button
                type="button"
                onClick={handleFetchDeviceGps}
                disabled={gpsLoading}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium underline"
              >
                {gpsLoading ? 'Detecting GPS...' : 'Use Browser GPS'}
              </button>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              {anchorType === 'preset' ? (
                <span>Preset: {DEFAULT_ANCHOR_GPS.name} ({DEFAULT_ANCHOR_GPS.latitude.toFixed(6)}, {DEFAULT_ANCHOR_GPS.longitude.toFixed(6)})</span>
              ) : (
                <span className="text-emerald-400">Device Locked: {customLat.toFixed(6)}, {customLng.toFixed(6)}</span>
              )}
            </div>
          </div>

          {/* Launch CTA */}
          <button
            type="button"
            onClick={handleLaunch}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            Launch 2-Minute Attendance Window
          </button>
        </div>
      )}
    </div>
  );
};
