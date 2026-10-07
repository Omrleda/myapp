/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppStore } from '../../store/appStore';
import { Download, CheckCircle2, XCircle, Clock, Award } from 'lucide-react';

export const LiveAttendanceRoster: React.FC = () => {
  const {
    selectedClass,
    enrollments,
    students,
    activeSession,
    records,
    systemStats,
  } = useAppStore();

  // Find enrolled students for selected class
  const classEnrollments = enrollments.filter((e) => e.classID === selectedClass.classID);

  const rosterWithStatus = classEnrollments.map((enr) => {
    const studentUser = students.find((s) => s.studentID === enr.studentID);
    const record = activeSession
      ? records.find(
          (r) =>
            r.sessionID === activeSession.sessionID &&
            (r.studentID === enr.studentID || (studentUser && r.studentID === studentUser.uid))
        )
      : null;

    return {
      studentID: enr.studentID,
      name: studentUser ? studentUser.name : 'Unknown Student',
      email: studentUser ? studentUser.email : 'n/a',
      status: record ? record.status : ('pending' as const),
      distance: record ? record.distance : null,
      timestamp: record ? record.timestamp : null,
      quizScore: record ? record.quizScore : null,
      rejectionReason: record?.rejectionReason,
      recordID: record?.recordID,
    };
  });

  // Also include any rejected proxy attempts from non-enrolled students or out of bounds
  const rogueRecords = records.filter(
    (r) =>
      activeSession &&
      r.sessionID === activeSession.sessionID &&
      !classEnrollments.some((e) => e.studentID === r.studentID)
  );

  const handleExportCSV = () => {
    if (!activeSession) return;
    const header = 'SessionID,StudentID,Name,Status,DistanceMeters,QuizScore,TimestampISO\n';
    const rows = rosterWithStatus
      .map((item) => {
        const timeIso = item.timestamp ? new Date(item.timestamp).toISOString() : '';
        return `"${activeSession.sessionID}","${item.studentID}","${item.name}","${item.status}","${item.distance ?? ''}","${item.quizScore ?? ''}","${timeIso}"`;
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ClassTrack_${activeSession.sessionID}_Attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Live Attendance Roster
          </h3>
          <p className="text-xs text-slate-400">
            {selectedClass.name} &middot; {classEnrollments.length} Enrolled
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!activeSession || rosterWithStatus.filter((r) => r.status === 'present').length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
          <span className="block text-[10px] text-slate-500 font-mono uppercase">Enrolled</span>
          <span className="text-base font-bold text-white font-mono tabular-nums">
            {systemStats.totalEnrolled}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
          <span className="block text-[10px] text-emerald-500 font-mono uppercase">Present</span>
          <span className="text-base font-bold text-emerald-400 font-mono tabular-nums">
            {systemStats.presentCount}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
          <span className="block text-[10px] text-rose-500 font-mono uppercase">Rejected</span>
          <span className="text-base font-bold text-rose-400 font-mono tabular-nums">
            {systemStats.rejectedCount}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
          <span className="block text-[10px] text-sky-500 font-mono uppercase">Rate</span>
          <span className="text-base font-bold text-sky-400 font-mono tabular-nums">
            {systemStats.attendanceRatePercent}%
          </span>
        </div>
      </div>

      {/* Roster Table / List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {rosterWithStatus.map((item) => (
          <div
            key={item.studentID}
            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
              item.status === 'present'
                ? 'bg-emerald-950/30 border-emerald-800/60 text-white'
                : item.status === 'rejected'
                ? 'bg-rose-950/30 border-rose-800/60 text-white'
                : 'bg-slate-950 border-slate-800/80 text-slate-300'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate">{item.name}</span>
                <span className="text-[10px] font-mono text-slate-400">{item.studentID}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                {item.distance !== null && (
                  <span>
                    Distance: <strong className="text-slate-200">{item.distance.toFixed(1)}m</strong>
                  </span>
                )}
                {item.quizScore !== null && item.quizScore !== undefined && (
                  <span className="flex items-center gap-1 text-sky-400">
                    <Award className="w-3 h-3" />
                    Quiz: {item.quizScore}/5
                  </span>
                )}
                {item.rejectionReason && (
                  <span className="text-rose-400 truncate max-w-[200px]" title={item.rejectionReason}>
                    {item.rejectionReason}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {item.status === 'present' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="w-3 h-3" />
                  PRESENT
                </span>
              )}
              {item.status === 'rejected' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  <XCircle className="w-3 h-3" />
                  REJECTED
                </span>
              )}
              {item.status === 'pending' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono bg-slate-800 text-slate-400">
                  <Clock className="w-3 h-3" />
                  PENDING
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Rogue / Unenrolled attempts */}
        {rogueRecords.map((r) => (
          <div
            key={r.recordID}
            className="p-3 rounded-xl border bg-amber-950/30 border-amber-800/60 text-white flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300">Unenrolled Student Attempt</span>
                <span className="text-[10px] font-mono text-slate-400">{r.studentID}</span>
              </div>
              <div className="text-[11px] text-amber-200 mt-0.5">
                {r.rejectionReason || 'Blocked by enrollment validation'}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
              BLOCKED
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
