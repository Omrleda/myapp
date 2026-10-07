/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { FirebaseActionLog, FirebaseActionType } from '../../types/firebaseLogs';
import {
  Flame,
  ShieldCheck,
  ShieldAlert,
  Database,
  Radio,
  Cpu,
  Lock,
  ArrowRight,
  Play,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Layers,
  Code2,
} from 'lucide-react';

export const FirebaseActionInspector: React.FC = () => {
  const {
    firebaseLogs,
    clearFirebaseLogs,
    simulateDirectClientWrite,
    launchSession,
    submitAttendance,
    activeSession,
    currentStudent,
    studentSimulatedLat,
    studentSimulatedLng,
    sessions,
    records,
    classes,
    enrollments,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'stream' | 'collections' | 'code'>('stream');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<FirebaseActionLog | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('attendance_sessions');

  const filteredLogs = firebaseLogs.filter((log) => {
    if (filterType === 'ALL') return true;
    return log.type === filterType;
  });

  const getBadgeStyle = (type: FirebaseActionType) => {
    switch (type) {
      case 'AUTH_VERIFY':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'FUNCTION_CALL':
        return 'bg-sky-950 text-sky-300 border-sky-800';
      case 'FIRESTORE_READ':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'FIRESTORE_WRITE':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'SECURITY_RULE_EVAL':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'SNAPSHOT_LISTENER':
        return 'bg-amber-950 text-amber-300 border-amber-800';
    }
  };

  const getCollectionDocs = () => {
    switch (selectedCollection) {
      case 'attendance_sessions':
        return sessions;
      case 'attendance_records':
        return records;
      case 'classes':
        return classes;
      case 'enrollments':
        return enrollments;
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Firebase Hero Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-current" />
              Firebase Backend Suite in Action
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Live Operations &amp; Security Inspector
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Real-Time Firebase Actions &amp; Cloud Functions Engine
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Observe every Firebase operation in real-time: Auth JWT verification, HTTPS Callable Cloud Functions, atomic Firestore reads, server-authoritative writes, and security rule enforcement.
          </p>
        </div>

        {/* View mode toggle tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('stream')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'stream'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Action Stream ({firebaseLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'collections'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Firestore Documents</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Flutter SDK Code</span>
          </button>
        </div>
      </div>

      {/* Interactive Action Trigger Lab */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-amber-400 fill-current" />
            Trigger Live Firebase Actions
          </div>
          <span className="text-[11px] text-slate-400">
            Click any action below to trigger live Firebase events
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Action 1: Start Session */}
          <button
            onClick={() => launchSession('punch_in', 50)}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/80 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-1">
              <span>1. Launch Session</span>
              <Database className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] font-mono text-slate-300">
              firestore.collection('attendance_sessions').add()
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Writes session doc &amp; broadcasts snapshot to students
            </p>
          </button>

          {/* Action 2: Call verifyAndPunchIn */}
          <button
            onClick={() => submitAttendance(studentSimulatedLat, studentSimulatedLng)}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/80 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-sky-400 mb-1">
              <span>2. Cloud Function Punch-In</span>
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] font-mono text-slate-300">
              functions.httpsCallable('verifyAndPunchIn')
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Executes Haversine proximity &amp; 120s server checks
            </p>
          </button>

          {/* Action 3: Simulate Direct Client Write (Rules Block) */}
          <button
            onClick={simulateDirectClientWrite}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/80 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-rose-400 mb-1">
              <span>3. Test Security Rules</span>
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] font-mono text-slate-300">
              client.collection('attendance_records').add()
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Simulates student tamper: blocked by firestore.rules
            </p>
          </button>

          {/* Action 4: Mode 2 Quiz Submission */}
          <button
            onClick={() => submitAttendance(studentSimulatedLat, studentSimulatedLng, [1, 1, 1, 0, 1])}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/80 text-left transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-purple-400 mb-1">
              <span>4. Submit Quiz Mode</span>
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] font-mono text-slate-300">
              functions.httpsCallable('submitQuiz')
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Evaluates 5 MCQs and marks presence
            </p>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'stream' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Stream Log Column (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {['ALL', 'FUNCTION_CALL', 'FIRESTORE_WRITE', 'SECURITY_RULE_EVAL', 'SNAPSHOT_LISTENER'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] transition-colors whitespace-nowrap ${
                      filterType === f
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <button
                onClick={clearFirebaseLogs}
                title="Clear log"
                className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of Logs */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No logs recorded for filter '{filterType}'. Trigger an action above!
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 border-amber-500 shadow-md'
                          : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getBadgeStyle(
                              log.type
                            )}`}
                          >
                            {log.type}
                          </span>
                          <span className="font-mono text-slate-200 font-bold text-[11px] truncate">
                            {log.actionName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
                          {log.status === 'SUCCESS' && (
                            <span className="text-emerald-400 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              OK
                            </span>
                          )}
                          {log.status === 'BLOCKED' && (
                            <span className="text-rose-400 flex items-center gap-0.5 font-bold">
                              <ShieldAlert className="w-3 h-3" />
                              BLOCKED
                            </span>
                          )}
                          {log.status === 'ERROR' && (
                            <span className="text-rose-400 flex items-center gap-0.5 font-bold">
                              <XCircle className="w-3 h-3" />
                              ERR
                            </span>
                          )}
                          <span className="text-slate-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">{log.details}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Log Detail Inspector (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" />
                Firebase Transaction Inspector
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {selectedLog ? selectedLog.target : 'Select a log'}
              </span>
            </div>

            {selectedLog ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-mono text-[10px]">OPERATION</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${getBadgeStyle(
                        selectedLog.type
                      )}`}
                    >
                      {selectedLog.type}
                    </span>
                  </div>
                  <div className="font-mono text-white font-bold">{selectedLog.actionName}</div>
                  <div className="text-[11px] text-slate-400">{selectedLog.target}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-mono text-[10px] block">OUTCOME</span>
                  <p className="text-slate-200 text-[11px] leading-relaxed">{selectedLog.details}</p>
                </div>

                {selectedLog.payload && (
                  <div className="space-y-1">
                    <span className="text-slate-400 font-mono text-[10px] block uppercase">
                      Document / Request Payload (JSON)
                    </span>
                    <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-300 overflow-x-auto max-h-[220px]">
                      {JSON.stringify(selectedLog.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Select any log on the left to inspect its parameters, execution trace, and payload.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Live Firestore Collections Viewer */}
      {activeTab === 'collections' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 overflow-x-auto">
            {['attendance_sessions', 'attendance_records', 'classes', 'enrollments'].map((col) => (
              <button
                key={col}
                onClick={() => setSelectedCollection(col)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                  selectedCollection === col
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>collection('{col}')</span>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Live Firestore Documents ({getCollectionDocs().length} docs found)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto">
              {getCollectionDocs().map((doc: any, idx: number) => {
                const docId =
                  doc.sessionID || doc.recordID || doc.classID || doc.enrollmentID || `doc-${idx}`;
                return (
                  <div
                    key={docId}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800">
                      <span className="font-mono text-amber-400 font-bold">{docId}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {selectedCollection}
                      </span>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-slate-900/80 text-[10px] font-mono text-slate-200 overflow-x-auto max-h-[160px]">
                      {JSON.stringify(doc, null, 2)}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Flutter SDK Code for Actions */}
      {activeTab === 'code' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="text-xs text-slate-400 leading-relaxed">
            Here is how each action shown above is written in Flutter using the official Firebase plugins:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calling Cloud Function in Flutter */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Action: Calling Cloud Function (Flutter)
              </span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-sky-300 overflow-x-auto leading-relaxed">
{`// Flutter client calls Cloud Function
final functions = FirebaseFunctions.instance;
final callable = functions.httpsCallable('verifyAndPunchIn');

final result = await callable.call({
  'sessionID': session.sessionID,
  'latitude': position.latitude,
  'longitude': position.longitude,
});

print('Status: \${result.data['status']}');`}
              </pre>
            </div>

            {/* Subscribing to Real-time Firestore Stream */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Action: Real-Time Snapshot Stream (Flutter)
              </span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto leading-relaxed">
{`// Teacher App listens to student pings live
FirebaseFirestore.instance
    .collection('attendance_records')
    .where('sessionID', isEqualTo: activeSessionID)
    .snapshots()
    .listen((snapshot) {
      for (var doc in snapshot.docs) {
        updateRadarBlip(doc.data());
      }
    });`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
