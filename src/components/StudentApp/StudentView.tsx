/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { ActiveSessionAlert } from './ActiveSessionAlert';
import { LocationPunchInScreen } from './LocationPunchInScreen';
import { QuizScreen } from './QuizScreen';
import { VerificationReceiptModal } from './VerificationReceiptModal';
import { User, BookOpen, Clock, ShieldCheck, MapPin, Award } from 'lucide-react';

export const StudentView: React.FC = () => {
  const {
    currentStudent,
    setCurrentStudent,
    students,
    selectedClass,
    activeSession,
    timeRemainingSeconds,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'action' | 'profile'>('action');

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Flutter Mobile Device Frame */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Mobile Top App Bar (Material 3 style) */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-600/20 border border-sky-500/40 text-sky-400 font-bold flex items-center justify-center text-sm">
              {currentStudent.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{currentStudent.name}</span>
                {currentStudent.studentID === 'MP2-2024-9999' && (
                  <span className="text-[9px] font-mono px-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Guest
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {currentStudent.studentID || 'Unenrolled'} &middot; {selectedClass.code}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-mono text-slate-400">Online</span>
          </div>
        </div>

        {/* Mobile Screen Body */}
        <div className="p-4 space-y-4">
          {/* Active Session Synchronized Banner */}
          <ActiveSessionAlert />

          {/* Conditional Action Content */}
          {activeSession ? (
            activeSession.mode === 'quiz' ? (
              <div className="space-y-4">
                <QuizScreen />
                <LocationPunchInScreen />
              </div>
            ) : (
              <LocationPunchInScreen />
            )
          ) : (
            /* Standby Classroom Information */
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-sky-400" />
                Current Course Roster
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="text-xs font-semibold text-white">{selectedClass.name}</div>
                <div className="text-[11px] text-slate-400">
                  Room: {selectedClass.room} &middot; Term: {selectedClass.semester}
                </div>
                <div className="text-[10px] font-mono text-emerald-400">
                  Join Code: {selectedClass.joinCode}
                </div>
              </div>

              <div className="text-xs text-slate-400 leading-relaxed pt-1">
                Your instructor will broadcast an attendance session during class. When broadcast, tap the Punch-In button within 120 seconds while remaining in the classroom.
              </div>
            </div>
          )}

          {/* Student Profile & Quick Switcher */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block font-mono">SIMULATION SWITCHER</span>
              <span className="text-white font-semibold">{currentStudent.name}</span>
            </div>
            <select
              value={currentStudent.uid}
              onChange={(e) => {
                const found = students.find((s) => s.uid === e.target.value);
                if (found) setCurrentStudent(found);
              }}
              className="bg-slate-950 border border-slate-700 text-[11px] text-slate-300 rounded-lg px-2 py-1 focus:outline-none"
            >
              {students.map((st) => (
                <option key={st.uid} value={st.uid}>
                  {st.name} ({st.studentID})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottom Flutter-style Tab Bar */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-around text-xs">
          <button
            onClick={() => setActiveTab('action')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'action' ? 'text-sky-400 font-bold' : 'text-slate-500'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px]">Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'profile' ? 'text-sky-400 font-bold' : 'text-slate-500'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[10px]">Profile</span>
          </button>
        </div>
      </div>

      {/* Verification Receipt Modal */}
      <VerificationReceiptModal />
    </div>
  );
};
