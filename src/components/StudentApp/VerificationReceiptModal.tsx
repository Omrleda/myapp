/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppStore } from '../../store/appStore';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Compass,
  FileCheck,
  X,
  Award,
} from 'lucide-react';

export const VerificationReceiptModal: React.FC = () => {
  const { lastVerificationResult, clearLastVerificationResult, currentStudent, activeSession } =
    useAppStore();

  if (!lastVerificationResult) return null;

  const { success, status, message, checks, mathDetails, record, serverTimestamp } =
    lastVerificationResult;

  const isPresent = status === 'present';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Banner */}
        <div
          className={`p-6 text-center border-b ${
            isPresent
              ? 'bg-gradient-to-b from-emerald-950/80 to-slate-900 border-emerald-800/60'
              : 'bg-gradient-to-b from-rose-950/80 to-slate-900 border-rose-800/60'
          }`}
        >
          <div className="flex justify-end -mt-2 -mr-2">
            <button
              onClick={clearLastVerificationResult}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg ${
              isPresent
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                : 'bg-rose-500 text-white shadow-rose-500/30'
            }`}
          >
            {isPresent ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
          </div>

          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-2 ${
              isPresent
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {isPresent ? 'ATTENDANCE OFFICIALLY RECORDED' : 'SUBMISSION REJECTED'}
          </span>

          <h2 className="text-lg font-bold text-white">
            {isPresent ? 'Verified Physical Presence' : 'Anti-Proxy Security Enforcement'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">{message}</p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="block text-[10px] font-mono text-slate-500 uppercase">
                Student ID & Name
              </span>
              <span className="font-bold text-white mt-0.5 block truncate">
                {currentStudent.name}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {currentStudent.studentID || 'Unassigned'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="block text-[10px] font-mono text-slate-500 uppercase">
                Idempotency Key
              </span>
              <span className="font-mono text-sky-400 font-semibold mt-0.5 block truncate text-[11px]">
                {record?.recordID || `${activeSession?.sessionID}_${currentStudent.studentID}`}
              </span>
              <span className="text-[10px] text-slate-500">1 submission/student/session</span>
            </div>
          </div>

          {/* Quiz Score Badge if applicable */}
          {record?.quizScore !== undefined && record?.quizScore !== null && (
            <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-semibold text-white">5-Question Flutter Quiz</span>
              </div>
              <span className="text-sm font-mono font-bold text-sky-300 tabular-nums">
                Score: {record.quizScore} / 5
              </span>
            </div>
          )}

          {/* 5-Step Authoritative Decision Matrix Execution Trace */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              Decision Logic Execution Matrix (5 Checks)
            </h4>

            <div className="space-y-1.5 font-mono text-xs">
              {checks.map((chk) => (
                <div
                  key={chk.step}
                  className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
                    chk.passed
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {chk.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                  <div className="flex-1 text-[11px]">
                    <div className="font-semibold text-slate-100">
                      Check {chk.step}: {chk.name}
                    </div>
                    <div className="text-slate-300 mt-0.5">{chk.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mathematical Haversine Breakdown */}
          {mathDetails && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  Haversine Formula Distance Verification
                </span>
                <span className="font-mono text-[10px] text-slate-500">R = 6,371,000m</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                <div>
                  <span className="text-[10px] text-slate-500 block">&Delta;Lat (rad)</span>
                  <span className="text-slate-200">{mathDetails.dLat.toExponential(4)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">&Delta;Lon (rad)</span>
                  <span className="text-slate-200">{mathDetails.dLon.toExponential(4)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Intermediate a</span>
                  <span className="text-slate-200">{mathDetails.a.toExponential(4)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Angular c (rad)</span>
                  <span className="text-slate-200">{mathDetails.c.toExponential(4)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <span className="text-slate-400">Computed Physical Distance:</span>
                <span
                  className={`font-bold tabular-nums ${
                    mathDetails.distanceMeters <= mathDetails.allowedRadiusMeters
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {mathDetails.distanceMeters.toFixed(2)}m (Threshold: &le;{' '}
                  {mathDetails.allowedRadiusMeters}m)
                </span>
              </div>
            </div>
          )}

          {/* Server Timestamp info */}
          <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between px-1">
            <span>Authoritative Cloud Function: verifyAndPunchIn()</span>
            <span>{new Date(serverTimestamp).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={clearLastVerificationResult}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Dismiss Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
