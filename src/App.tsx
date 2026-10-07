/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useAppStore } from './store/appStore';
import { TopNav } from './components/TopNav';
import { DualDeviceView } from './components/DualDeviceView';
import { TeacherView } from './components/TeacherApp/TeacherView';
import { StudentView } from './components/StudentApp/StudentView';
import { ArchitectureConsole } from './components/ArchitectureConsole/ArchitectureConsole';
import { FlutterStudioView } from './components/FlutterStudio/FlutterStudioView';
import { FirebaseActionInspector } from './components/FirebaseInspector/FirebaseActionInspector';
import { VerificationReceiptModal } from './components/StudentApp/VerificationReceiptModal';
import { ShieldCheck, BookOpen, Layers, Cpu } from 'lucide-react';

const AppContent: React.FC = () => {
  const { viewMode, setViewMode } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Bar adhering to Top Bar Contract */}
      <TopNav />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Contextual Sub-Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-900 gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Course: CS 302 Mobile Programming - Level 2</span>
            <span>&middot;</span>
            <span>Stack: Flutter, Dart, Firebase Suite (Auth, Firestore, Cloud Functions)</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              Anti-Proxy Geofence: Active
            </span>
          </div>
        </div>

        {/* View Switcher Output */}
        {viewMode === 'dual' && <DualDeviceView />}
        {viewMode === 'firebase' && <FirebaseActionInspector />}
        {viewMode === 'flutter' && <FlutterStudioView />}
        {viewMode === 'teacher' && <TeacherView />}
        {viewMode === 'student' && <StudentView />}
        {viewMode === 'specs' && <ArchitectureConsole />}
      </main>

      {/* Verification Receipt Modal */}
      <VerificationReceiptModal />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-400">ClassTrack &copy; 2026</span> &mdash;
            System Architecture &amp; System Design Specification for Anti-Proxy Attendance.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setViewMode('specs')}
              className="hover:text-white transition-colors underline"
            >
              Firestore Security Rules &amp; Schemas
            </button>
            <span>&middot;</span>
            <button
              onClick={() => setViewMode('dual')}
              className="hover:text-white transition-colors underline"
            >
              Interactive Dual Simulator
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
