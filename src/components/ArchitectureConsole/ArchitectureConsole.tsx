/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import {
  Layers,
  Database,
  Code2,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Smartphone,
  CheckCircle2,
  XCircle,
  Copy,
  Terminal,
} from 'lucide-react';

export const ArchitectureConsole: React.FC = () => {
  const { activeSession, records, enrollments, classes, selectedClass } = useAppStore();
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'code' | 'rules' | 'sandbox'>('architecture');
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User profile permissions
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Classes: Instructors manage, enrolled students read
    match /classes/{classId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.teacherID == request.auth.uid;
      allow update, delete: if resource.data.teacherID == request.auth.uid;
    }

    // Sessions: Only owning teacher can open/close sessions
    match /attendance_sessions/{sessionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.teacherID == request.auth.uid;
      allow update: if resource.data.teacherID == request.auth.uid;
    }

    // Attendance Records: Server-authoritative via Cloud Functions
    match /attendance_records/{recordId} {
      allow read: if request.auth != null;
      // Direct client write disabled to prevent radius spoofing
      allow write: if false; 
    }
  }
}`;

  const cloudFunctionCode = `import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Haversine distance calculator
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const verifyAndPunchIn = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');
  
  const { sessionID, latitude, longitude } = data;
  const studentUID = context.auth.uid;
  const serverTime = Date.now();

  // 1. Session Exists & Status == 'active'
  const sessionSnap = await db.collection('attendance_sessions').doc(sessionID).get();
  if (!sessionSnap.exists || sessionSnap.data()?.status !== 'active') {
    throw new functions.https.HttpsError('failed-precondition', 'Session is closed or inactive.');
  }
  const session = sessionSnap.data()!;

  // 2. Server Time <= expiryTime (strict 120s limit)
  if (serverTime > session.expiryTime) {
    throw new functions.https.HttpsError('deadline-exceeded', 'Response window expired (>120s).');
  }

  // 3. Student Enrolled in Session's Class ({classID}_{studentID})
  const userDoc = await db.collection('users').doc(studentUID).get();
  const academicID = userDoc.data()?.studentID;
  const enrollmentDoc = await db.collection('enrollments').doc(\`\${session.classID}_\${academicID}\`).get();
  if (!enrollmentDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Student not enrolled in class.');
  }

  // 4. Record {sessionID}_{studentID} Exists? (Idempotency)
  const recordID = \`\${sessionID}_\${academicID}\`;
  const existingRecord = await db.collection('attendance_records').doc(recordID).get();
  if (existingRecord.exists) {
    throw new functions.https.HttpsError('already-exists', 'Attendance already recorded.');
  }

  // 5. Haversine(Student, Teacher) <= Radius
  const distance = haversineMeters(session.latitude, session.longitude, latitude, longitude);
  const isWithinRadius = distance <= session.radius;

  // Authoritative write by Cloud Functions (client write is blocked by rules)
  const record = {
    recordID,
    sessionID,
    studentID: academicID,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    latitude,
    longitude,
    distance,
    status: isWithinRadius ? 'present' : 'rejected',
    rejectionReason: isWithinRadius ? null : \`Distance \${distance.toFixed(1)}m > allowed \${session.radius}m\`
  };

  await db.collection('attendance_records').doc(recordID).set(record);
  return { success: isWithinRadius, distance, status: record.status };
});`;

  const flutterLocationService = `import 'package:geolocator/geolocator.dart';

class LocationService {
  /// Triggered STRICTLY on student action ('Punch In' or 'Submit Quiz').
  /// Never polled in the background to preserve mobile battery and honor OS policies.
  static Future<Position> captureAuthoritativePosition() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw LocationServiceDisabledException();
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Location permission denied');
      }
    }

    // High accuracy GPS fix for classroom radius verification
    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
      timeLimit: const Duration(seconds: 5),
    );
  }
}`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <span className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            ClassTrack Architecture & Specification Engine
          </span>
          <h2 className="text-base font-bold text-white mt-0.5">
            Course: Mobile Programming - Level 2 | Target: Flutter, Dart & Firebase Suite
          </h2>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {[
            { id: 'architecture', label: '3-Tier Architecture', icon: Layers },
            { id: 'schema', label: 'Firestore Schemas', icon: Database },
            { id: 'code', label: 'Flutter & Cloud Functions', icon: Code2 },
            { id: 'rules', label: 'Firestore Security Rules', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: 3-Tier Architecture Interactive Visualizer */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Presentation Tier */}
            <div
              onClick={() => setSelectedTier(1)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                selectedTier === 1
                  ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-950/50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-sky-400 font-bold uppercase">
                  Tier 1: Presentation
                </span>
                <Smartphone className="w-4 h-4 text-sky-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Flutter & Dart Client</h3>
              <p className="text-xs text-slate-400 mt-1">
                Teacher App (Radar & Session timer) & Student App (Action GPS & 5-Q Quiz).
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div>&bull; Action-triggered GPS capture</div>
                <div>&bull; Synchronous 120s Countdown Ticker</div>
                <div>&bull; Snapshot Query listeners</div>
              </div>
            </div>

            {/* Application / Logic Tier */}
            <div
              onClick={() => setSelectedTier(2)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                selectedTier === 2
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  Tier 2: Logic / Engine
                </span>
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Firebase Suite & Functions</h3>
              <p className="text-xs text-slate-400 mt-1">
                Authoritative verification engine: Haversine distance, 120s window check, & quiz scoring.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div>&bull; verifyAndPunchIn() callable function</div>
                <div>&bull; submitQuiz() evaluation engine</div>
                <div>&bull; Haversine Formula (R = 6,371,000m)</div>
              </div>
            </div>

            {/* Data Tier */}
            <div
              onClick={() => setSelectedTier(3)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                selectedTier === 3
                  ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/50'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                  Tier 3: Persistence
                </span>
                <Database className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Cloud Firestore</h3>
              <p className="text-xs text-slate-400 mt-1">
                Authoritative document storage with composite keys & zero direct client write to records.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div>&bull; [users], [classes], [enrollments]</div>
                <div>&bull; [attendance_sessions]</div>
                <div>&bull; [attendance_records] (Idempotent)</div>
              </div>
            </div>
          </div>

          {/* Decision Logic Execution Flow Diagram */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Authoritative Verification Engine (5-Check Decision Matrix)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CHECK 1</span>
                <span className="text-white font-bold block mt-0.5">Session Active</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Exists & status == 'active'</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CHECK 2</span>
                <span className="text-white font-bold block mt-0.5">Time &le; Expiry</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Strict sub-2-minute (120s) limit</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CHECK 3</span>
                <span className="text-white font-bold block mt-0.5">Enrolled Student</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Doc: &#123;classID&#125;_&#123;studentID&#125;</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CHECK 4</span>
                <span className="text-white font-bold block mt-0.5">Idempotency</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Key: &#123;sessionID&#125;_&#123;studentID&#125;</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CHECK 5</span>
                <span className="text-white font-bold block mt-0.5">Haversine Proximity</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Calculated d &le; allowed radius</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Firestore Document Schemas */}
      {activeTab === 'schema' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* attendance_sessions Schema */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 font-mono">
                  Collection: attendance_sessions
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Doc ID: {activeSession?.sessionID || 'ATT-2026-0922-001'}</span>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 overflow-x-auto">
{JSON.stringify(
  activeSession || {
    sessionID: 'ATT-2026-0922-001',
    classID: 'CS302_MOBILE2',
    teacherID: 'teacher_omar',
    mode: 'punch_in',
    latitude: 37.774929,
    longitude: -122.419416,
    radius: 50.0,
    startTime: 1774320000000,
    expiryTime: 1774320120000,
    status: 'active',
  },
  null,
  2
)}
              </pre>
            </div>

            {/* attendance_records Schema */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-sky-400 font-mono">
                  Collection: attendance_records
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Doc ID: &#123;sessionID&#125;_&#123;studentID&#125;
                </span>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 overflow-x-auto">
{JSON.stringify(
  records[0] || {
    recordID: 'ATT-2026-0922-001_MP2-2024-8841',
    sessionID: 'ATT-2026-0922-001',
    studentID: 'MP2-2024-8841',
    timestamp: 1774320042000,
    latitude: 37.774972,
    longitude: -122.419385,
    distance: 6.5,
    status: 'present',
    quizScore: null,
  },
  null,
  2
)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Code View */}
      {activeTab === 'code' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Authoritative Cloud Function: verifyAndPunchIn.ts</span>
            <button
              onClick={() => copyToClipboard(cloudFunctionCode, 'cloud')}
              className="flex items-center gap-1 text-slate-300 hover:text-white"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedKey === 'cloud' ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-[380px]">
            {cloudFunctionCode}
          </pre>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span className="font-mono">Flutter Geolocator Client Service: LocationService.dart</span>
            <button
              onClick={() => copyToClipboard(flutterLocationService, 'flutter')}
              className="flex items-center gap-1 text-slate-300 hover:text-white"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedKey === 'flutter' ? 'Copied!' : 'Copy Dart'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-sky-300 overflow-x-auto max-h-[220px]">
            {flutterLocationService}
          </pre>
        </div>
      )}

      {/* Tab 4: Security Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Security Baseline: firestore.rules</span>
            <button
              onClick={() => copyToClipboard(firestoreRulesCode, 'rules')}
              className="flex items-center gap-1 text-slate-300 hover:text-white"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedKey === 'rules' ? 'Copied!' : 'Copy Rules'}</span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              <strong>Crucial Security Rule:</strong> match /attendance_records/&#123;recordId&#125; &#123; allow write: if false; &#125; prevents students from spoofing coordinates directly via client Firestore SDK. All writes occur strictly through Cloud Functions.
            </span>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto max-h-[380px]">
            {firestoreRulesCode}
          </pre>
        </div>
      )}
    </div>
  );
};
