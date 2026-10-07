/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { calculateHaversineDistance } from '../../engine/haversine';
import { MapPin, Navigation, UserCheck, ShieldAlert } from 'lucide-react';

export const LiveRadarMonitor: React.FC = () => {
  const {
    activeSession,
    records,
    students,
    studentSimulatedLat,
    studentSimulatedLng,
    currentStudent,
  } = useAppStore();

  const teacherLat = activeSession ? activeSession.latitude : 37.774929;
  const teacherLng = activeSession ? activeSession.longitude : -122.419416;
  const allowedRadius = activeSession ? activeSession.radius : 50;

  // Radar scale: outer ring corresponds to Math.max(100, allowedRadius * 1.6) meters
  const maxDisplayMeters = Math.max(100, allowedRadius * 1.5);

  // Compute student markers
  const studentMarkers = useMemo(() => {
    return students.map((student) => {
      // Find if student has submitted a record for this session
      const record = activeSession
        ? records.find(
            (r) =>
              r.sessionID === activeSession.sessionID &&
              (r.studentID === student.studentID || r.studentID === student.uid)
          )
        : null;

      let lat = studentSimulatedLat;
      let lng = studentSimulatedLng;
      let distance = 0;
      let status: 'present' | 'rejected' | 'absent' | 'pending' = 'pending';

      if (record) {
        lat = record.latitude;
        lng = record.longitude;
        distance = record.distance;
        status = record.status;
      } else if (student.uid === currentStudent.uid) {
        // Current simulated position
        const calc = calculateHaversineDistance(teacherLat, teacherLng, studentSimulatedLat, studentSimulatedLng);
        distance = calc.distanceMeters;
      }

      // Convert distance and rough angle into normalized X/Y (-1 to 1) for radar circle
      // Approximate bearing from teacher to student
      const dLat = lat - teacherLat;
      const dLng = lng - teacherLng;
      const angle = Math.atan2(dLng, dLat); // radians from North

      // Scaled radius (0 at center, 1 at maxDisplayMeters)
      const normalizedR = Math.min(0.92, (distance / maxDisplayMeters) * 0.85);
      const xPercent = 50 + normalizedR * 50 * Math.sin(angle);
      const yPercent = 50 - normalizedR * 50 * Math.cos(angle);

      return {
        student,
        record,
        distance,
        status,
        xPercent,
        yPercent,
        isCurrent: student.uid === currentStudent.uid,
      };
    });
  }, [
    students,
    records,
    activeSession,
    teacherLat,
    teacherLng,
    studentSimulatedLat,
    studentSimulatedLng,
    currentStudent.uid,
    maxDisplayMeters,
  ]);

  // Radius ring normalized scale
  const allowedRadiusPercent = (allowedRadius / maxDisplayMeters) * 85;

  return (
    <div className="relative w-full aspect-square max-w-[380px] mx-auto bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-hidden flex items-center justify-center shadow-xl">
      {/* Background grid markings */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

      {/* Outer Distance Ring */}
      <div className="absolute w-[85%] h-[85%] rounded-full border border-slate-800/80 pointer-events-none" />
      <span className="absolute top-3 text-[10px] font-mono text-slate-500 tabular-nums">
        {Math.round(maxDisplayMeters)}m
      </span>

      {/* Mid Distance Ring (50%) */}
      <div className="absolute w-[50%] h-[50%] rounded-full border border-slate-800/60 pointer-events-none" />

      {/* Allowed Geofence Radius Boundary (Zone strictly ≤ radius) */}
      <div
        className="absolute rounded-full border-2 border-emerald-500/50 bg-emerald-500/5 transition-all duration-500 pointer-events-none flex items-center justify-center"
        style={{
          width: `${allowedRadiusPercent * 2}%`,
          height: `${allowedRadiusPercent * 2}%`,
        }}
      >
        <span className="absolute -top-3 text-[10px] font-mono font-semibold text-emerald-400 bg-slate-950/90 px-1.5 py-0.5 rounded border border-emerald-500/30">
          Geofence: &le; {allowedRadius}m
        </span>
      </div>

      {/* Active Radar Sweep Line */}
      {activeSession && (
        <div className="absolute w-full h-full pointer-events-none animate-radar-sweep">
          <div className="w-1/2 h-1/2 absolute top-0 right-0 bg-gradient-to-bl from-emerald-500/20 via-emerald-500/5 to-transparent rounded-tr-full origin-bottom-left" />
          <div className="w-1/2 h-[1px] absolute top-1/2 right-0 bg-gradient-to-r from-emerald-400 to-transparent origin-left" />
        </div>
      )}

      {/* Radar Crosshairs */}
      <div className="absolute w-full h-[1px] bg-slate-800/60 pointer-events-none" />
      <div className="absolute h-full w-[1px] bg-slate-800/60 pointer-events-none" />

      {/* Center: Teacher Instructor Podium Anchor */}
      <div className="absolute z-20 flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50 border-2 border-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
          </div>
          {activeSession && (
            <div className="absolute -inset-2 rounded-full border border-emerald-400/50 animate-ping pointer-events-none" />
          )}
        </div>
        <span className="text-[10px] font-semibold text-white bg-slate-900/90 px-1.5 py-0.5 rounded shadow mt-1 border border-slate-700 whitespace-nowrap">
          Instructor Podium
        </span>
      </div>

      {/* Dynamic Student Blips */}
      {studentMarkers.map((marker) => {
        const { student, distance, status, xPercent, yPercent, isCurrent } = marker;

        let badgeBg = 'bg-slate-700 text-slate-300 border-slate-600';
        let dotBg = 'bg-slate-400';

        if (status === 'present') {
          badgeBg = 'bg-emerald-950/90 text-emerald-300 border-emerald-600';
          dotBg = 'bg-emerald-400';
        } else if (status === 'rejected') {
          badgeBg = 'bg-rose-950/90 text-rose-300 border-rose-600';
          dotBg = 'bg-rose-500';
        } else if (isCurrent) {
          badgeBg = 'bg-sky-950/90 text-sky-300 border-sky-600';
          dotBg = 'bg-sky-400';
        }

        return (
          <div
            key={student.uid}
            className="absolute z-30 flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group cursor-pointer"
            style={{
              left: `${xPercent}%`,
              top: `${yPercent}%`,
            }}
          >
            {/* Blip Dot */}
            <div className="relative flex items-center justify-center">
              <div
                className={`w-3.5 h-3.5 rounded-full ${dotBg} border-2 border-slate-950 shadow-md flex items-center justify-center`}
              >
                {status === 'present' ? (
                  <UserCheck className="w-2 h-2 text-slate-950" />
                ) : status === 'rejected' ? (
                  <ShieldAlert className="w-2 h-2 text-white" />
                ) : (
                  <div className="w-1 h-1 rounded-full bg-white" />
                )}
              </div>
              {status === 'present' && (
                <div className="absolute -inset-1 rounded-full border border-emerald-400/40 animate-pulse pointer-events-none" />
              )}
            </div>

            {/* Label badge */}
            <div
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shadow-md mt-1 whitespace-nowrap flex items-center gap-1 ${badgeBg}`}
            >
              <span className="font-semibold">{student.name.split(' ')[0]}</span>
              <span>&middot;</span>
              <span className="tabular-nums">{distance.toFixed(1)}m</span>
            </div>
          </div>
        );
      })}

      {/* Cardinal Directions */}
      <span className="absolute top-1 text-[9px] font-mono text-slate-600">N</span>
      <span className="absolute bottom-1 text-[9px] font-mono text-slate-600">S</span>
      <span className="absolute left-1 text-[9px] font-mono text-slate-600">W</span>
      <span className="absolute right-1 text-[9px] font-mono text-slate-600">E</span>

      {/* Legend Footer */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-slate-400 bg-slate-900/90 px-2 py-1 rounded-md border border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Present</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Rejected (&gt;{allowedRadius}m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>Active Device</span>
        </div>
      </div>
    </div>
  );
};
