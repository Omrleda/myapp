/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FirebaseActionType =
  | 'AUTH_VERIFY'
  | 'FUNCTION_CALL'
  | 'FIRESTORE_READ'
  | 'FIRESTORE_WRITE'
  | 'SECURITY_RULE_EVAL'
  | 'SNAPSHOT_LISTENER';

export interface FirebaseActionLog {
  id: string;
  timestamp: number;
  type: FirebaseActionType;
  actionName: string;
  target: string; // e.g. "attendance_sessions", "verifyAndPunchIn", "firestore.rules"
  status: 'SUCCESS' | 'BLOCKED' | 'ERROR';
  details: string;
  payload?: Record<string, unknown>;
  latencyMs?: number;
}
