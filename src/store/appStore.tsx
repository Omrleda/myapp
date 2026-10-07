/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  AttendanceRecord,
  AttendanceSession,
  CourseClass,
  Enrollment,
  User,
  VerificationResult,
} from '../types';
import {
  CAMPUS_LOCATION_PRESETS,
  DEFAULT_ANCHOR_GPS,
  INITIAL_CLASSES,
  INITIAL_ENROLLMENTS,
  INITIAL_STUDENTS,
  TEACHER_USER,
} from '../data/seedData';
import { executeVerificationEngine, VerificationRequest } from '../engine/verificationEngine';
import { offsetCoordinates } from '../engine/haversine';
import { FirebaseActionLog } from '../types/firebaseLogs';

export type AppViewMode = 'dual' | 'teacher' | 'student' | 'specs' | 'flutter' | 'firebase';

interface AppContextType {
  // Current view mode
  viewMode: AppViewMode;
  setViewMode: (mode: AppViewMode) => void;

  // Users & Selection
  teacher: User;
  students: User[];
  currentStudent: User;
  setCurrentStudent: (user: User) => void;

  // Classes & Enrollments
  classes: CourseClass[];
  selectedClass: CourseClass;
  setSelectedClass: (c: CourseClass) => void;
  enrollments: Enrollment[];

  // Attendance Sessions
  sessions: AttendanceSession[];
  activeSession: AttendanceSession | null;
  timeRemainingSeconds: number;
  isSessionExpired: boolean;

  // Records
  records: AttendanceRecord[];

  // Session Management Actions
  launchSession: (mode: 'punch_in' | 'quiz', radius: number, lat?: number, lng?: number) => AttendanceSession;
  closeSession: (sessionID?: string) => void;
  resetAllSessionsAndRecords: () => void;

  // Verification Action
  submitAttendance: (
    lat: number,
    lng: number,
    answers?: number[],
    simulatedServerTimestamp?: number
  ) => VerificationResult;

  // Last Verification Result for receipt display
  lastVerificationResult: VerificationResult | null;
  clearLastVerificationResult: () => void;

  // Student GPS Simulation settings
  studentSelectedPresetId: string;
  setStudentSelectedPresetId: (id: string) => void;
  studentSimulatedLat: number;
  studentSimulatedLng: number;
  setCustomStudentCoordinates: (lat: number, lng: number) => void;
  useRealGps: boolean;
  setUseRealGps: (val: boolean) => void;
  acquireRealGpsCoordinates: () => Promise<{ lat: number; lng: number } | null>;

  // System statistics
  systemStats: {
    totalEnrolled: number;
    presentCount: number;
    rejectedCount: number;
    pendingCount: number;
    attendanceRatePercent: number;
  };

  // Firebase Live Action Logs
  firebaseLogs: FirebaseActionLog[];
  simulateDirectClientWrite: () => void;
  clearFirebaseLogs: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  SESSIONS: 'classtrack_sessions_v1',
  RECORDS: 'classtrack_records_v1',
  SELECTED_STUDENT: 'classtrack_current_student_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewMode] = useState<AppViewMode>('dual');
  const [classes] = useState<CourseClass[]>(INITIAL_CLASSES);
  const [selectedClass, setSelectedClass] = useState<CourseClass>(INITIAL_CLASSES[0]);
  const [enrollments] = useState<Enrollment[]>(INITIAL_ENROLLMENTS);
  const [students] = useState<User[]>(INITIAL_STUDENTS);
  const [currentStudent, setCurrentStudent] = useState<User>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_STUDENT);
    if (saved) {
      const found = INITIAL_STUDENTS.find((s) => s.uid === saved);
      if (found) return found;
    }
    return INITIAL_STUDENTS[0]; // Alex Johnson
  });

  // Sessions state
  const [sessions, setSessions] = useState<AttendanceSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Records state
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [lastVerificationResult, setLastVerificationResult] = useState<VerificationResult | null>(null);

  // Student GPS preset simulation
  const [studentSelectedPresetId, setStudentSelectedPresetId] = useState<string>('front_row');
  const [useRealGps, setUseRealGps] = useState<boolean>(false);
  const [realGpsCoords, setRealGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Find active session for selected class or latest active
  const activeSession = useMemo(() => {
    return sessions.find(
      (s) => s.classID === selectedClass.classID && s.status === 'active'
    ) || sessions.find((s) => s.status === 'active') || null;
  }, [sessions, selectedClass]);

  // Real-time Countdown Timer (sub-2-minute / 120s ticker)
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!activeSession) {
      setTimeRemainingSeconds(0);
      setIsSessionExpired(false);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diffMs = activeSession.expiryTime - now;
      const seconds = Math.max(0, Math.ceil(diffMs / 1000));
      setTimeRemainingSeconds(seconds);

      if (seconds <= 0 && activeSession.status === 'active') {
        setIsSessionExpired(true);
        // Automatically close expired session state
        setSessions((prev) =>
          prev.map((s) =>
            s.sessionID === activeSession.sessionID ? { ...s, status: 'closed' } : s
          )
        );
      } else {
        setIsSessionExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Persist sessions and records
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_STUDENT, currentStudent.uid);
  }, [currentStudent]);

  // Calculate student coordinates based on preset or anchor
  const { studentSimulatedLat, studentSimulatedLng } = useMemo(() => {
    if (useRealGps && realGpsCoords) {
      return {
        studentSimulatedLat: realGpsCoords.lat,
        studentSimulatedLng: realGpsCoords.lng,
      };
    }

    const anchorLat = activeSession ? activeSession.latitude : DEFAULT_ANCHOR_GPS.latitude;
    const anchorLng = activeSession ? activeSession.longitude : DEFAULT_ANCHOR_GPS.longitude;

    const preset = CAMPUS_LOCATION_PRESETS.find((p) => p.id === studentSelectedPresetId) || CAMPUS_LOCATION_PRESETS[0];
    const coords = offsetCoordinates(anchorLat, anchorLng, preset.offsetMeters, preset.bearing);

    return {
      studentSimulatedLat: coords.latitude,
      studentSimulatedLng: coords.longitude,
    };
  }, [useRealGps, realGpsCoords, activeSession, studentSelectedPresetId]);

  const setCustomStudentCoordinates = useCallback((lat: number, lng: number) => {
    setRealGpsCoords({ lat, lng });
    setUseRealGps(true);
  }, []);

  const acquireRealGpsCoordinates = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    if (!navigator.geolocation) {
      return null;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setRealGpsCoords(coords);
          setUseRealGps(true);
          resolve(coords);
        },
        () => {
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  }, []);

  // Firebase Action Logs State
  const [firebaseLogs, setFirebaseLogs] = useState<FirebaseActionLog[]>([
    {
      id: 'init-1',
      timestamp: Date.now() - 3600000,
      type: 'AUTH_VERIFY',
      actionName: 'FirebaseAuth.verifyIdToken()',
      target: 'Firebase Auth',
      status: 'SUCCESS',
      details: 'User authenticated with verified JWT claims (role: "teacher", email: "o.harrison@university.edu")',
    },
    {
      id: 'init-2',
      timestamp: Date.now() - 3590000,
      type: 'SNAPSHOT_LISTENER',
      actionName: 'Firestore.collection("classes").onSnapshot()',
      target: 'Firestore Stream',
      status: 'SUCCESS',
      details: 'Active listener mounted on classes collection for live course synchronization',
    },
  ]);

  const addFirebaseLog = useCallback((log: Omit<FirebaseActionLog, 'id' | 'timestamp'>) => {
    const newEntry: FirebaseActionLog = {
      ...log,
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    setFirebaseLogs((prev) => [newEntry, ...prev.slice(0, 49)]); // keep last 50 logs
  }, []);

  const clearFirebaseLogs = useCallback(() => {
    setFirebaseLogs([]);
  }, []);

  // Launch a new session strictly enforcing startTime + 120,000ms (120s)
  const launchSession = useCallback(
    (mode: 'punch_in' | 'quiz', radius: number, lat?: number, lng?: number): AttendanceSession => {
      const now = Date.now();
      const sessionCount = sessions.length + 1;
      const pad = String(sessionCount).padStart(3, '0');
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const sessionID = `ATT-${dateStr}-${pad}`;

      const newSession: AttendanceSession = {
        sessionID,
        classID: selectedClass.classID,
        teacherID: TEACHER_USER.uid,
        mode,
        latitude: lat ?? DEFAULT_ANCHOR_GPS.latitude,
        longitude: lng ?? DEFAULT_ANCHOR_GPS.longitude,
        radius: radius || 50.0,
        startTime: now,
        expiryTime: now + 120000, // Strictly 120s per specification
        status: 'active',
      };

      // Close any active session first, then add new session
      setSessions((prev) => [
        newSession,
        ...prev.map((s) => (s.status === 'active' ? { ...s, status: 'closed' as const } : s)),
      ]);

      setLastVerificationResult(null);

      // Log Firebase Firestore write action
      addFirebaseLog({
        type: 'FIRESTORE_WRITE',
        actionName: 'Firestore.collection("attendance_sessions").doc(sessionID).set()',
        target: `attendance_sessions/${sessionID}`,
        status: 'SUCCESS',
        details: `Created active attendance session document with radius=${radius}m and 120s expiry`,
        payload: {
          sessionID,
          classID: selectedClass.classID,
          teacherID: TEACHER_USER.uid,
          mode,
          radius,
          startTime: new Date(now).toISOString(),
          expiryTime: new Date(now + 120000).toISOString(),
          status: 'active',
        },
      });

      // Log real-time snapshot broadcast
      addFirebaseLog({
        type: 'SNAPSHOT_LISTENER',
        actionName: 'Firestore.collection("attendance_sessions").where("status", "==", "active").snapshots()',
        target: 'Real-time Snapshot Stream',
        status: 'SUCCESS',
        details: `Dispatched snapshot delta to enrolled student devices for class '${selectedClass.classID}'`,
      });

      return newSession;
    },
    [sessions.length, selectedClass.classID, addFirebaseLog]
  );

  const closeSession = useCallback((sessionID?: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (!sessionID && s.status === 'active') {
          return { ...s, status: 'closed' };
        }
        if (sessionID && s.sessionID === sessionID) {
          return { ...s, status: 'closed' };
        }
        return s;
      })
    );
  }, []);

  const resetAllSessionsAndRecords = useCallback(() => {
    setSessions([]);
    setRecords([]);
    setLastVerificationResult(null);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
  }, []);

  // Authoritative Cloud Functions Engine execution
  const submitAttendance = useCallback(
    (
      lat: number,
      lng: number,
      answers?: number[],
      simulatedServerTimestamp?: number
    ): VerificationResult => {
      const sessionID = activeSession ? activeSession.sessionID : '';
      const studentID = currentStudent.studentID || currentStudent.uid;

      // 1. Log Firebase Auth Token Verification
      addFirebaseLog({
        type: 'AUTH_VERIFY',
        actionName: 'FirebaseFunctions.context.auth.verify()',
        target: 'Firebase Auth Tokens',
        status: 'SUCCESS',
        details: `Decoded bearer token for student '${currentStudent.name}' (uid: ${currentStudent.uid}, studentID: ${studentID})`,
      });

      // 2. Log Cloud Function Invocation
      const fnName = answers ? 'submitQuiz' : 'verifyAndPunchIn';
      addFirebaseLog({
        type: 'FUNCTION_CALL',
        actionName: `FirebaseFunctions.httpsCallable("${fnName}")`,
        target: `Cloud Function: ${fnName}`,
        status: 'SUCCESS',
        details: `Client dispatched GPS coordinates (lat: ${lat.toFixed(6)}, lng: ${lng.toFixed(6)}) to server`,
        payload: {
          sessionID,
          studentID,
          latitude: lat,
          longitude: lng,
          answersCount: answers?.length,
        },
      });

      // 3. Log Firestore Read of Session & Enrollment
      addFirebaseLog({
        type: 'FIRESTORE_READ',
        actionName: 'Firestore.collection("attendance_sessions").doc(sessionID).get()',
        target: `attendance_sessions/${sessionID}`,
        status: activeSession ? 'SUCCESS' : 'ERROR',
        details: activeSession
          ? `Read session doc; status: '${activeSession.status}', radius: ${activeSession.radius}m`
          : 'Document does not exist in attendance_sessions collection',
      });

      const req: VerificationRequest = {
        sessionID,
        studentID,
        studentUser: currentStudent,
        latitude: lat,
        longitude: lng,
        answers,
        simulatedServerTimestamp,
      };

      const result = executeVerificationEngine(
        req,
        activeSession || undefined,
        enrollments,
        records
      );

      setLastVerificationResult(result);

      // If a record was generated (whether 'present' or 'rejected' per Section 3), persist it!
      if (result.record) {
        setRecords((prev) => [result.record!, ...prev]);

        // 4. Log Authoritative Admin Firestore Write
        addFirebaseLog({
          type: 'FIRESTORE_WRITE',
          actionName: 'FirebaseAdmin.firestore().collection("attendance_records").doc().set()',
          target: `attendance_records/${result.record.recordID}`,
          status: result.status === 'present' ? 'SUCCESS' : 'BLOCKED',
          details: `Authoritative write executed with status='${result.status}' (distance: ${result.record.distance.toFixed(1)}m)`,
          payload: {
            recordID: result.record.recordID,
            status: result.record.status,
            distanceMeters: result.record.distance,
            quizScore: result.record.quizScore,
            timestamp: new Date(result.record.timestamp).toISOString(),
          },
        });

        // 5. Log Real-time Snapshot Update for Instructor Radar
        addFirebaseLog({
          type: 'SNAPSHOT_LISTENER',
          actionName: 'Firestore.collection("attendance_records").where("sessionID", "==", sessionID).snapshots()',
          target: 'Instructor Radar Listener',
          status: 'SUCCESS',
          details: `Pushed new record for '${currentStudent.name}' to live instructor geofence stream`,
        });
      } else {
        addFirebaseLog({
          type: 'FUNCTION_CALL',
          actionName: `CloudFunction [${fnName}] Execution Failed`,
          target: 'Cloud Functions Runtime',
          status: 'ERROR',
          details: result.message,
        });
      }

      return result;
    },
    [activeSession, currentStudent, enrollments, records, addFirebaseLog]
  );

  // Simulates a student attempting to write directly to Firestore bypassing Cloud Functions
  const simulateDirectClientWrite = useCallback(() => {
    addFirebaseLog({
      type: 'SECURITY_RULE_EVAL',
      actionName: 'ClientSDK: Firestore.collection("attendance_records").add()',
      target: 'firestore.rules: /attendance_records/{recordId}',
      status: 'BLOCKED',
      details: 'FirebaseError: PERMISSION_DENIED: Missing or insufficient permissions. Client writes rejected by rule "allow write: if false;". Anti-proxy tamper protection verified!',
      payload: {
        attemptedBy: currentStudent.uid,
        rulePath: 'match /attendance_records/{recordId} { allow write: if false; }',
        reason: 'Direct client writes disabled to prevent radius spoofing',
      },
    });
  }, [addFirebaseLog, currentStudent.uid]);

  const clearLastVerificationResult = useCallback(() => {
    setLastVerificationResult(null);
  }, []);

  // Real-time system statistics for current session
  const systemStats = useMemo(() => {
    const classEnrollments = enrollments.filter((e) => e.classID === selectedClass.classID);
    const totalEnrolled = classEnrollments.length;

    if (!activeSession) {
      return {
        totalEnrolled,
        presentCount: 0,
        rejectedCount: 0,
        pendingCount: totalEnrolled,
        attendanceRatePercent: 0,
      };
    }

    const sessionRecords = records.filter((r) => r.sessionID === activeSession.sessionID);
    const presentCount = sessionRecords.filter((r) => r.status === 'present').length;
    const rejectedCount = sessionRecords.filter((r) => r.status === 'rejected').length;
    const pendingCount = Math.max(0, totalEnrolled - presentCount);
    const attendanceRatePercent =
      totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

    return {
      totalEnrolled,
      presentCount,
      rejectedCount,
      pendingCount,
      attendanceRatePercent,
    };
  }, [enrollments, selectedClass.classID, activeSession, records]);

  return (
    <AppContext.Provider
      value={{
        viewMode,
        setViewMode,
        teacher: TEACHER_USER,
        students,
        currentStudent,
        setCurrentStudent,
        classes,
        selectedClass,
        setSelectedClass,
        enrollments,
        sessions,
        activeSession,
        timeRemainingSeconds,
        isSessionExpired,
        records,
        launchSession,
        closeSession,
        resetAllSessionsAndRecords,
        submitAttendance,
        lastVerificationResult,
        clearLastVerificationResult,
        studentSelectedPresetId,
        setStudentSelectedPresetId,
        studentSimulatedLat,
        studentSimulatedLng,
        setCustomStudentCoordinates,
        useRealGps,
        setUseRealGps,
        acquireRealGpsCoordinates,
        systemStats,
        firebaseLogs,
        simulateDirectClientWrite,
        clearFirebaseLogs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
