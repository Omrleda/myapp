/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'teacher' | 'student';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  studentID: string | null;
  avatarUrl?: string;
}

export interface CourseClass {
  classID: string;
  name: string;
  code: string;
  teacherID: string;
  joinCode: string;
  semester: string;
  room: string;
  description: string;
}

export interface Enrollment {
  enrollmentID: string; // Formatted as {classID}_{studentID}
  classID: string;
  studentID: string; // references users.studentID or uid
  enrolledAt: string;
}

export type SessionMode = 'punch_in' | 'quiz';
export type SessionStatus = 'active' | 'closed';

export interface AttendanceSession {
  sessionID: string; // e.g. ATT-2026-0922-001
  classID: string;
  teacherID: string;
  mode: SessionMode;
  latitude: number;
  longitude: number;
  radius: number; // Allowed geo-radius in meters (e.g. 50.0)
  startTime: number; // Milliseconds timestamp
  expiryTime: number; // Milliseconds timestamp: strictly startTime + 120,000 (120s)
  status: SessionStatus;
  notes?: string;
}

export type AttendanceStatus = 'present' | 'rejected' | 'absent';

export interface AttendanceRecord {
  recordID: string; // Composite key: {sessionID}_{studentID} (guarantees idempotency)
  sessionID: string;
  studentID: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  distance: number; // Calculated distance to teacher in meters via Haversine
  status: AttendanceStatus;
  rejectionReason?: string;
  quizScore?: number | null; // Mode 2: out of 5
  quizAnswers?: number[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CheckStep {
  step: number;
  name: string;
  passed: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface VerificationResult {
  success: boolean;
  status: AttendanceStatus;
  message: string;
  record?: AttendanceRecord;
  checks: CheckStep[];
  mathDetails?: {
    lat1: number;
    lon1: number;
    lat2: number;
    lon2: number;
    dLat: number;
    dLon: number;
    a: number;
    c: number;
    distanceMeters: number;
    allowedRadiusMeters: number;
  };
  serverTimestamp: number;
  timeRemainingSeconds: number;
}
