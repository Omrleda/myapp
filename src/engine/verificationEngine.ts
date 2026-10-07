/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AttendanceRecord,
  AttendanceSession,
  CheckStep,
  Enrollment,
  User,
  VerificationResult,
} from '../types';
import { calculateHaversineDistance } from './haversine';
import { MOBILE_PROGRAMMING_QUIZ_QUESTIONS } from '../data/seedData';

export interface VerificationRequest {
  sessionID: string;
  studentID: string; // Academic Student ID (e.g. MP2-2024-8841)
  studentUser: User;
  latitude: number;
  longitude: number;
  answers?: number[]; // Mode 2: Array of selected option indices (0-3) for questions 1-5
  simulatedServerTimestamp?: number; // Optional mock time for testing expired windows
}

/**
 * Authoritative Server-Side Cloud Function Simulator.
 * Strictly implements the 5-Step Decision Logic Execution Matrix
 * defined in Section 3 of the ClassTrack System Architecture.
 */
export function executeVerificationEngine(
  request: VerificationRequest,
  session: AttendanceSession | undefined,
  enrollments: Enrollment[],
  existingRecords: AttendanceRecord[]
): VerificationResult {
  const serverTimestamp = request.simulatedServerTimestamp ?? Date.now();
  const checks: CheckStep[] = [];

  // --------------------------------------------------------------------------
  // Check 1: Session Exists & Status == 'active'
  // --------------------------------------------------------------------------
  if (!session) {
    checks.push({
      step: 1,
      name: 'Session Existence & State',
      passed: false,
      message: 'REJECT: Session ID does not exist in attendance_sessions.',
    });
    return {
      success: false,
      status: 'rejected',
      message: 'Session not found.',
      checks,
      serverTimestamp,
      timeRemainingSeconds: 0,
    };
  }

  if (session.status !== 'active') {
    checks.push({
      step: 1,
      name: 'Session Existence & State',
      passed: false,
      message: `REJECT: Session ${session.sessionID} is '${session.status}', not 'active'.`,
      data: { sessionStatus: session.status },
    });
    return {
      success: false,
      status: 'rejected',
      message: 'Attendance window is closed by instructor.',
      checks,
      serverTimestamp,
      timeRemainingSeconds: 0,
    };
  }

  checks.push({
    step: 1,
    name: 'Session Existence & State',
    passed: true,
    message: `PASSED: Session ${session.sessionID} is currently active.`,
    data: { mode: session.mode, classID: session.classID },
  });

  // --------------------------------------------------------------------------
  // Check 2: Server Time <= expiryTime (strict 2 min window)
  // --------------------------------------------------------------------------
  const timeRemainingMs = session.expiryTime - serverTimestamp;
  const timeRemainingSeconds = Math.max(0, Math.round(timeRemainingMs / 1000));

  if (serverTimestamp > session.expiryTime) {
    checks.push({
      step: 2,
      name: 'Temporal 120s Window Validity',
      passed: false,
      message: `REJECT: Submission timestamp (${serverTimestamp}) exceeded expiryTime (${session.expiryTime}) by ${Math.abs(Math.round((serverTimestamp - session.expiryTime) / 1000))}s.`,
      data: {
        serverTimestamp,
        expiryTime: session.expiryTime,
        diffMs: serverTimestamp - session.expiryTime,
      },
    });
    return {
      success: false,
      status: 'rejected',
      message: 'Submission rejected: 2-minute attendance window has expired.',
      checks,
      serverTimestamp,
      timeRemainingSeconds: 0,
    };
  }

  checks.push({
    step: 2,
    name: 'Temporal 120s Window Validity',
    passed: true,
    message: `PASSED: Verified within response window (${timeRemainingSeconds}s remaining).`,
    data: { timeRemainingSeconds },
  });

  // --------------------------------------------------------------------------
  // Check 3: Student Enrolled in Session's Class?
  // Formatted as {classID}_{studentID}
  // --------------------------------------------------------------------------
  const expectedEnrollmentID = `${session.classID}_${request.studentID}`;
  const isEnrolled = enrollments.some(
    (e) =>
      e.enrollmentID === expectedEnrollmentID ||
      (e.classID === session.classID && e.studentID === request.studentID)
  );

  if (!isEnrolled) {
    checks.push({
      step: 3,
      name: 'Course Enrollment Verification',
      passed: false,
      message: `REJECT: Student ID '${request.studentID}' is not enrolled in class '${session.classID}'. Expected doc: ${expectedEnrollmentID}.`,
      data: { studentID: request.studentID, classID: session.classID },
    });
    return {
      success: false,
      status: 'rejected',
      message: 'Verification rejected: Student is not registered in this course roster.',
      checks,
      serverTimestamp,
      timeRemainingSeconds,
    };
  }

  checks.push({
    step: 3,
    name: 'Course Enrollment Verification',
    passed: true,
    message: `PASSED: Verified enrollment doc '${expectedEnrollmentID}'.`,
  });

  // --------------------------------------------------------------------------
  // Check 4: Record {sessionID}_{studentID} Exists? (Idempotency guarantee)
  // --------------------------------------------------------------------------
  const compositeRecordID = `${session.sessionID}_${request.studentID}`;
  const alreadySubmitted = existingRecords.some(
    (r) => r.recordID === compositeRecordID || (r.sessionID === session.sessionID && r.studentID === request.studentID)
  );

  if (alreadySubmitted) {
    checks.push({
      step: 4,
      name: 'Idempotency & Duplicate Submission Check',
      passed: false,
      message: `REJECT: Attendance record '${compositeRecordID}' already exists. Submissions are strictly idempotent.`,
      data: { compositeRecordID },
    });
    return {
      success: false,
      status: 'rejected',
      message: 'Submission rejected: Attendance has already been recorded for this session.',
      checks,
      serverTimestamp,
      timeRemainingSeconds,
    };
  }

  checks.push({
    step: 4,
    name: 'Idempotency & Duplicate Submission Check',
    passed: true,
    message: `PASSED: No prior record found for key '${compositeRecordID}'.`,
  });

  // --------------------------------------------------------------------------
  // Check 5: Haversine(Student, Teacher) <= Radius?
  // --------------------------------------------------------------------------
  const haversineResult = calculateHaversineDistance(
    session.latitude,
    session.longitude,
    request.latitude,
    request.longitude
  );

  const mathDetails = {
    lat1: session.latitude,
    lon1: session.longitude,
    lat2: request.latitude,
    lon2: request.longitude,
    dLat: haversineResult.dLat,
    dLon: haversineResult.dLon,
    a: haversineResult.a,
    c: haversineResult.c,
    distanceMeters: haversineResult.distanceMeters,
    allowedRadiusMeters: session.radius,
  };

  const isWithinRadius = haversineResult.distanceMeters <= session.radius;

  if (!isWithinRadius) {
    // Per Section 3: If Haversine > Radius, server creates record with status = 'rejected'
    const rejectedRecord: AttendanceRecord = {
      recordID: compositeRecordID,
      sessionID: session.sessionID,
      studentID: request.studentID,
      timestamp: serverTimestamp,
      latitude: request.latitude,
      longitude: request.longitude,
      distance: haversineResult.distanceMeters,
      status: 'rejected',
      rejectionReason: `Physical distance (${haversineResult.distanceMeters.toFixed(1)}m) exceeded geofenced perimeter (≤ ${session.radius}m).`,
    };

    checks.push({
      step: 5,
      name: 'Physical Proximity Radius (Haversine)',
      passed: false,
      message: `REJECT: Computed distance is ${haversineResult.distanceMeters.toFixed(1)}m, exceeding allowed radius of ${session.radius.toFixed(1)}m.`,
      data: {
        distance: haversineResult.distanceMeters,
        radius: session.radius,
        deltaMeters: Math.round(haversineResult.distanceMeters - session.radius),
      },
    });

    return {
      success: false,
      status: 'rejected',
      message: `Proxy attempt prevented: Location is ${haversineResult.distanceMeters.toFixed(1)}m away, outside permitted radius (${session.radius}m).`,
      record: rejectedRecord,
      checks,
      mathDetails,
      serverTimestamp,
      timeRemainingSeconds,
    };
  }

  checks.push({
    step: 5,
    name: 'Physical Proximity Radius (Haversine)',
    passed: true,
    message: `PASSED: Physical proximity verified (${haversineResult.distanceMeters.toFixed(1)}m ≤ ${session.radius}m).`,
    data: {
      distance: haversineResult.distanceMeters,
      radius: session.radius,
    },
  });

  // --------------------------------------------------------------------------
  // Session Mode Resolution
  // --------------------------------------------------------------------------
  if (session.mode === 'punch_in') {
    // Mode 1: Punch-In
    const record: AttendanceRecord = {
      recordID: compositeRecordID,
      sessionID: session.sessionID,
      studentID: request.studentID,
      timestamp: serverTimestamp,
      latitude: request.latitude,
      longitude: request.longitude,
      distance: haversineResult.distanceMeters,
      status: 'present',
    };

    return {
      success: true,
      status: 'present',
      message: `Attendance verified! Marked PRESENT (${haversineResult.distanceMeters.toFixed(1)}m from instructor podium).`,
      record,
      checks,
      mathDetails,
      serverTimestamp,
      timeRemainingSeconds,
    };
  } else {
    // Mode 2: Quiz - Evaluate 5 In-App Questions
    const answers = request.answers ?? [];
    let score = 0;
    MOBILE_PROGRAMMING_QUIZ_QUESTIONS.forEach((q, index) => {
      if (answers[index] === q.correctIndex) {
        score += 1;
      }
    });

    const record: AttendanceRecord = {
      recordID: compositeRecordID,
      sessionID: session.sessionID,
      studentID: request.studentID,
      timestamp: serverTimestamp,
      latitude: request.latitude,
      longitude: request.longitude,
      distance: haversineResult.distanceMeters,
      status: 'present',
      quizScore: score,
      quizAnswers: answers,
    };

    return {
      success: true,
      status: 'present',
      message: `Quiz completed! Score: ${score}/5. Attendance verified PRESENT (${haversineResult.distanceMeters.toFixed(1)}m away).`,
      record,
      checks,
      mathDetails,
      serverTimestamp,
      timeRemainingSeconds,
    };
  }
}
