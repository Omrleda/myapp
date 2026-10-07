/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FlutterSourceFile {
  path: string;
  category: 'core' | 'data' | 'providers' | 'presentation' | 'config';
  description: string;
  content: string;
}

export const FLUTTER_PROJECT_FILES: FlutterSourceFile[] = [
  // --------------------------------------------------------------------------
  // pubspec.yaml
  // --------------------------------------------------------------------------
  {
    path: 'pubspec.yaml',
    category: 'config',
    description: 'Flutter project dependencies & asset configuration',
    content: `name: classtrack
description: ClassTrack - Anti-Proxy Attendance & Verification Suite (Mobile Programming Level 2)
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.3.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # Firebase Suite
  firebase_core: ^3.1.0
  firebase_auth: ^5.1.0
  cloud_firestore: ^5.0.1
  cloud_functions: ^5.0.0

  # Hardware Geolocation (Action-triggered)
  geolocator: ^12.0.0
  permission_handler: ^11.3.1

  # State Management & Reactive Streams
  provider: ^6.1.2

  # UI, Icons & Math
  cupertino_icons: ^1.0.8
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true
`,
  },

  // --------------------------------------------------------------------------
  // lib/main.dart
  // --------------------------------------------------------------------------
  {
    path: 'lib/main.dart',
    category: 'core',
    description: 'Flutter application entry point with Provider scope & Firebase initialization',
    content: `import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/session_provider.dart';
import 'providers/quiz_provider.dart';
import 'presentation/auth/login_screen.dart';
import 'presentation/teacher/teacher_dashboard.dart';
import 'presentation/student/student_dashboard.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Initialize Firebase (replace with DefaultFirebaseOptions.currentPlatform)
  await Firebase.initializeApp();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => SessionProvider()),
        ChangeNotifierProvider(create: (_) => QuizProvider()),
      ],
      child: const ClassTrackApp(),
    ),
  );
}

class ClassTrackApp extends StatelessWidget {
  const ClassTrackApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ClassTrack',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF10B981), // Emerald 500
          brightness: Brightness.dark,
          surface: const Color(0xFF0F172A),  // Slate 900
        ),
        scaffoldBackgroundColor: const Color(0xFF020617), // Slate 950
      ),
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (!auth.isAuthenticated) {
            return const LoginScreen();
          }
          if (auth.currentUser?.role == 'teacher') {
            return const TeacherDashboard();
          }
          return const StudentDashboard();
        },
      ),
    );
  }
}
`,
  },

  // --------------------------------------------------------------------------
  // lib/core/services/location_service.dart
  // --------------------------------------------------------------------------
  {
    path: 'lib/core/services/location_service.dart',
    category: 'core',
    description: 'Action-triggered Geolocator wrapper (preserves battery, no background polling)',
    content: `import 'package:geolocator/geolocator.dart';

class LocationService {
  /// Captures GPS coordinates strictly when user taps 'Punch In' or 'Submit Quiz'.
  /// Never executes in the background. Uses LocationAccuracy.high.
  static Future<Position> captureAuthoritativePosition() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('GPS Location services are disabled. Please enable GPS.');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Location permission denied by user.');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permissions are permanently denied. Enable in System Settings.');
    }

    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
      timeLimit: const Duration(seconds: 7),
    );
  }
}
`,
  },

  // --------------------------------------------------------------------------
  // lib/core/services/timer_service.dart
  // --------------------------------------------------------------------------
  {
    path: 'lib/core/services/timer_service.dart',
    category: 'core',
    description: 'Synchronous sub-2-minute client countdown ticker',
    content: `import 'dart:async';

class TimerService {
  Timer? _timer;

  /// Starts a 1-second synchronous ticker countdown against expiryTime
  void startCountdown({
    required DateTime expiryTime,
    required void Function(int remainingSeconds) onTick,
    required void Function() onExpired,
  }) {
    _timer?.cancel();
    
    void check() {
      final now = DateTime.now();
      final diff = expiryTime.difference(now).inSeconds;
      if (diff <= 0) {
        _timer?.cancel();
        onTick(0);
        onExpired();
      } else {
        onTick(diff);
      }
    }

    check();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => check());
  }

  void cancel() {
    _timer?.cancel();
    _timer = null;
  }
}
`,
  },

  // --------------------------------------------------------------------------
  // lib/core/utils/haversine.dart
  // --------------------------------------------------------------------------
  {
    path: 'lib/core/utils/haversine.dart',
    category: 'core',
    description: 'Haversine distance formula implementation in Dart',
    content: `import 'dart:math';

class HaversineUtil {
  static const double earthRadiusMeters = 6371000.0;

  static double toRadians(double degrees) => degrees * (pi / 180.0);

  /// Computes distance in meters between two GPS coordinates using the Haversine formula
  static double computeDistance({
    required double lat1,
    required double lon1,
    required double lat2,
    required double lon2,
  }) {
    final double phi1 = toRadians(lat1);
    final double phi2 = toRadians(lat2);
    final double dLat = toRadians(lat2 - lat1);
    final double dLon = toRadians(lon2 - lon1);

    final double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(phi1) * cos(phi2) * sin(dLon / 2) * sin(dLon / 2);

    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));

    return earthRadiusMeters * c;
  }
}
`,
  },

  // --------------------------------------------------------------------------
  // lib/data/models/user_model.dart
  // --------------------------------------------------------------------------
  {
    path: 'lib/data/models/user_model.dart',
    category: 'data',
    description: 'User model matching users collection schema',
    content: `class UserModel {
  final String uid;
  final String name;
  final String email;
  final String role; // 'teacher' or 'student'
  final String? studentID; // null if teacher

  UserModel({
    required this.uid,
    required this.name,
    required this.email,
    required this.role,
    this.studentID,
  });

  factory UserModel.fromMap(String uid, Map<String, dynamic> data) {
    return UserModel(
      uid: uid,
      name: data['name'] ?? '',
      email: data['email'] ?? '',
      role: data['role'] ?? 'student',
      studentID: data['studentID'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'name': name,
      'email': email,
      'role': role,
      'studentID': studentID,
    };
  }
}
`,
  },

  // --------------------------------------------------------------------------
  // lib/data/models/session_model.dart
  // --------------------------------------------------------------------------
  {
    path: 'lib/data/models/session_model.dart',
    category: 'data',
    description: 'AttendanceSession model matching attendance_sessions collection',
    content: `import 'package:cloud_firestore/cloud_firestore.dart';

class SessionModel {
  final String sessionID;
  final String classID;
  final String teacherID;
  final String mode; // 'punch_in' or 'quiz'
  final double latitude;
  final double longitude;
  final double radius; // e.g. 50.0 meters
  final DateTime startTime;
  final DateTime expiryTime; // startTime + 120s
  final String status; // 'active' or 'closed'

  SessionModel({
    required this.sessionID,
    required this.classID,
    required this.teacherID,
    required this.mode,
    required this.latitude,
    required this.longitude,
    required this.radius,
    required this.startTime,
    required this.expiryTime,
    required this.status,
  });

  bool get isActive => status == 'active' && DateTime.now().isBefore(expiryTime);

  factory SessionModel.fromSnapshot(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data()!;
    return SessionModel(
      sessionID: doc.id,
      classID: data['classID'] ?? '',
      teacherID: data['teacherID'] ?? '',
      mode: data['mode'] ?? 'punch_in',
      latitude: (data['latitude'] as num).toDouble(),
      longitude: (data['longitude'] as num).toDouble(),
      radius: (data['radius'] as num).toDouble(),
      startTime: (data['startTime'] as Timestamp).toDate(),
      expiryTime: (data['expiryTime'] as Timestamp).toDate(),
      status: data['status'] ?? 'closed',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'classID': classID,
      'teacherID': teacherID,
      'mode': mode,
      'latitude': latitude,
      'longitude': longitude,
      'radius': radius,
      'startTime': Timestamp.fromDate(startTime),
      'expiryTime': Timestamp.fromDate(expiryTime),
      'status': status,
    };
  }
}
`,
  },

  // --------------------------------------------------------------------------
  // lib/data/models/record_model.dart
  // --------------------------------------------------------------------------
  {
    path: 'lib/data/models/record_model.dart',
    category: 'data',
    description: 'AttendanceRecord model matching attendance_records collection',
    content: `import 'package:cloud_firestore/cloud_firestore.dart';

class RecordModel {
  final String recordID; // {sessionID}_{studentID}
  final String sessionID;
  final String studentID;
  final DateTime timestamp;
  final double latitude;
  final double longitude;
  final double distance;
  final String status; // 'present', 'rejected', 'absent'
  final int? quizScore; // 0 to 5 for Mode 2
  final String? rejectionReason;

  RecordModel({
    required this.recordID,
    required this.sessionID,
    required this.studentID,
    required this.timestamp,
    required this.latitude,
    required this.longitude,
    required this.distance,
    required this.status,
    this.quizScore,
    this.rejectionReason,
  });

  factory RecordModel.fromSnapshot(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data()!;
    return RecordModel(
      recordID: doc.id,
      sessionID: data['sessionID'] ?? '',
      studentID: data['studentID'] ?? '',
      timestamp: (data['timestamp'] as Timestamp).toDate(),
      latitude: (data['latitude'] as num).toDouble(),
      longitude: (data['longitude'] as num).toDouble(),
      distance: (data['distance'] as num).toDouble(),
      status: data['status'] ?? 'absent',
      quizScore: data['quizScore'],
      rejectionReason: data['rejectionReason'],
    );
  }
}
`,
  },

  // --------------------------------------------------------------------------
  // lib/data/repositories/attendance_repository.dart
  // --------------------------------------------------------------------------
  {
    path: 'lib/data/repositories/attendance_repository.dart',
    category: 'data',
    description: 'Calls Cloud Functions verifyAndPunchIn and submitQuiz',
    content: `import 'package:cloud_functions/cloud_functions.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/session_model.dart';
import '../models/record_model.dart';

class AttendanceRepository {
  final FirebaseFunctions _functions = FirebaseFunctions.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Stream active attendance session for student's class
  Stream<SessionModel?> streamActiveSession(String classID) {
    return _firestore
        .collection('attendance_sessions')
        .where('classID', isEqualTo: classID)
        .where('status', isEqualTo: 'active')
        .limit(1)
        .snapshots()
        .map((snap) {
      if (snap.docs.isEmpty) return null;
      return SessionModel.fromSnapshot(snap.docs.first);
    });
  }

  /// Authoritative server call: Mode 1 Punch-In
  Future<Map<String, dynamic>> verifyAndPunchIn({
    required String sessionID,
    required double latitude,
    required double longitude,
  }) async {
    final callable = _functions.httpsCallable('verifyAndPunchIn');
    final response = await callable.call<Map<String, dynamic>>({
      'sessionID': sessionID,
      'latitude': latitude,
      'longitude': longitude,
    });
    return response.data;
  }

  /// Authoritative server call: Mode 2 Quiz Submission
  Future<Map<String, dynamic>> submitQuiz({
    required String sessionID,
    required double latitude,
    required double longitude,
    required List<int> answers,
  }) async {
    final callable = _functions.httpsCallable('submitQuiz');
    final response = await callable.call<Map<String, dynamic>>({
      'sessionID': sessionID,
      'latitude': latitude,
      'longitude': longitude,
      'answers': answers,
    });
    return response.data;
  }

  /// Instructor: Stream live student attendance records for a session
  Stream<List<RecordModel>> streamSessionRecords(String sessionID) {
    return _firestore
        .collection('attendance_records')
        .where('sessionID', isEqualTo: sessionID)
        .snapshots()
        .map((snap) => snap.docs.map((d) => RecordModel.fromSnapshot(d)).toList());
  }

  /// Instructor: Launch new 120-second session
  Future<String> launchSession({
    required String classID,
    required String teacherID,
    required String mode,
    required double latitude,
    required double longitude,
    required double radius,
  }) async {
    final now = DateTime.now();
    final expiry = now.add(const Duration(seconds: 120));

    final docRef = await _firestore.collection('attendance_sessions').add({
      'classID': classID,
      'teacherID': teacherID,
      'mode': mode,
      'latitude': latitude,
      'longitude': longitude,
      'radius': radius,
      'startTime': Timestamp.fromDate(now),
      'expiryTime': Timestamp.fromDate(expiry),
      'status': 'active',
    });

    return docRef.id;
  }

  /// Instructor: Close active session
  Future<void> closeSession(String sessionID) async {
    await _firestore
        .collection('attendance_sessions')
        .doc(sessionID)
        .update({'status': 'closed'});
  }
}
`,
  },

  // --------------------------------------------------------------------------
  // lib/presentation/student/punch_in_screen.dart
  // --------------------------------------------------------------------------
  {
    path: 'lib/presentation/student/punch_in_screen.dart',
    category: 'presentation',
    description: 'Flutter Student Punch-In screen with action GPS capture & countdown',
    content: `import 'package:flutter/material.dart';
import '../../core/services/location_service.dart';
import '../../core/utils/haversine.dart';
import '../../data/models/session_model.dart';
import '../../data/repositories/attendance_repository.dart';

class PunchInScreen extends StatefulWidget {
  final SessionModel session;

  const PunchInScreen({super.key, required this.session});

  @override
  State<PunchInScreen> createState() => _PunchInScreenState();
}

class _PunchInScreenState extends State<PunchInScreen> {
  final AttendanceRepository _repo = AttendanceRepository();
  bool _isLoading = false;
  String? _resultMessage;
  bool? _isSuccess;
  double? _computedDistance;

  Future<void> _handlePunchIn() async {
    setState(() {
      _isLoading = true;
      _resultMessage = null;
    });

    try {
      // 1. Action-triggered high-accuracy position
      final position = await LocationService.captureAuthoritativePosition();

      // 2. Client-side sanity check
      final clientDistance = HaversineUtil.computeDistance(
        lat1: widget.session.latitude,
        lon1: widget.session.longitude,
        lat2: position.latitude,
        lon2: position.longitude,
      );

      // 3. Authoritative Cloud Function Verification
      final result = await _repo.verifyAndPunchIn(
        sessionID: widget.session.sessionID,
        latitude: position.latitude,
        longitude: position.longitude,
      );

      final status = result['status'];
      final isPresent = status == 'present';

      setState(() {
        _isSuccess = isPresent;
        _computedDistance = clientDistance;
        _resultMessage = isPresent
            ? 'Attendance Verified! Marked PRESENT (\${clientDistance.toStringAsFixed(1)}m from instructor).'
            : 'Rejected: Physical distance (\${clientDistance.toStringAsFixed(1)}m) exceeded allowed radius (\${widget.session.radius}m).';
      });
    } catch (e) {
      setState(() {
        _isSuccess = false;
        _resultMessage = 'Error: \${e.toString()}';
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Location Punch-In'),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              color: const Color(0xFF0F172A),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFF1E293B)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Text(
                      widget.session.sessionID,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Color(0xFF10B981),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Max Permitted Radius: \${widget.session.radius.toStringAsFixed(0)} meters',
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
            const Spacer(),
            if (_resultMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _isSuccess == true
                      ? const Color(0xFF064E3B)
                      : const Color(0xFF4C0519),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _isSuccess == true
                        ? const Color(0xFF10B981)
                        : const Color(0xFFF43F5E),
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      _isSuccess == true
                          ? Icons.check_circle_rounded
                          : Icons.cancel_rounded,
                      color: _isSuccess == true
                          ? const Color(0xFF34D399)
                          : const Color(0xFFFB7185),
                      size: 40,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _resultMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _handlePunchIn,
              icon: _isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.navigation_rounded),
              label: Text(_isLoading ? 'Verifying with Server...' : 'Punch In Now'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
`,
  },

  // --------------------------------------------------------------------------
  // lib/presentation/teacher/teacher_dashboard.dart
  // --------------------------------------------------------------------------
  {
    path: 'lib/presentation/teacher/teacher_dashboard.dart',
    category: 'presentation',
    description: 'Flutter Teacher Dashboard with session controls & live roster',
    content: `import 'package:flutter/material.dart';
import '../../data/repositories/attendance_repository.dart';
import '../../data/models/session_model.dart';
import '../../data/models/record_model.dart';

class TeacherDashboard extends StatefulWidget {
  const TeacherDashboard({super.key});

  @override
  State<TeacherDashboard> createState() => _TeacherDashboardState();
}

class _TeacherDashboardState extends State<TeacherDashboard> {
  final AttendanceRepository _repo = AttendanceRepository();
  String? _activeSessionID;
  bool _isLaunching = false;

  void _launchSession() async {
    setState(() => _isLaunching = true);
    try {
      final sessionID = await _repo.launchSession(
        classID: 'CS302_MOBILE2',
        teacherID: 'teacher_omar',
        mode: 'punch_in',
        latitude: 37.774929,
        longitude: -122.419416,
        radius: 50.0,
      );
      setState(() => _activeSessionID = sessionID);
    } finally {
      setState(() => _isLaunching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Instructor Session Console'),
        backgroundColor: const Color(0xFF0F172A),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              color: const Color(0xFF0F172A),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'CS 302: Mobile Programming - Level 2',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    const Text('Room: CS Lab 204  •  Fall 2026', style: TextStyle(color: Colors.white54, fontSize: 12)),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _isLaunching ? null : _launchSession,
                      icon: const Icon(Icons.play_arrow_rounded),
                      label: const Text('Start 2-Minute Attendance Window'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Live Student Pings', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            Expanded(
              child: _activeSessionID == null
                  ? const Center(child: Text('No active session. Tap start to begin.', style: TextStyle(color: Colors.white38)))
                  : StreamBuilder<List<RecordModel>>(
                      stream: _repo.streamSessionRecords(_activeSessionID!),
                      builder: (context, snapshot) {
                        final records = snapshot.data ?? [];
                        if (records.isEmpty) {
                          return const Center(child: Text('Waiting for student submissions...', style: TextStyle(color: Colors.white38)));
                        }
                        return ListView.separated(
                          itemCount: records.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final r = records[index];
                            final isPresent = r.status == 'present';
                            return ListTile(
                              tileColor: const Color(0xFF0F172A),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              leading: Icon(
                                isPresent ? Icons.check_circle : Icons.cancel,
                                color: isPresent ? Colors.green : Colors.red,
                              ),
                              title: Text(r.studentID, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text('Distance: \${r.distance.toStringAsFixed(1)}m'),
                              trailing: Chip(
                                label: Text(r.status.toUpperCase()),
                                backgroundColor: isPresent ? Colors.green.withOpacity(0.2) : Colors.red.withOpacity(0.2),
                              ),
                            );
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
`,
  },

  // --------------------------------------------------------------------------
  // functions/index.js
  // --------------------------------------------------------------------------
  {
    path: 'functions/index.js',
    category: 'config',
    description: 'Authoritative Firebase Cloud Functions verification backend',
    content: `const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.verifyAndPunchIn = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const { sessionID, latitude, longitude } = data;
  const studentUID = context.auth.uid;
  const now = Date.now();

  // Check 1: Session Active
  const sessionDoc = await db.collection('attendance_sessions').doc(sessionID).get();
  if (!sessionDoc.exists || sessionDoc.data().status !== 'active') {
    throw new functions.https.HttpsError('failed-precondition', 'Session is closed');
  }
  const session = sessionDoc.data();

  // Check 2: Expiry Window (120s)
  if (now > session.expiryTime.toMillis()) {
    throw new functions.https.HttpsError('deadline-exceeded', 'Window expired (>120s)');
  }

  // Check 3: Enrollment
  const userDoc = await db.collection('users').doc(studentUID).get();
  const studentID = userDoc.data().studentID;
  const enrollDoc = await db.collection('enrollments').doc(\`\${session.classID}_\${studentID}\`).get();
  if (!enrollDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Not enrolled');
  }

  // Check 4: Idempotency
  const recordID = \`\${sessionID}_\${studentID}\`;
  const existing = await db.collection('attendance_records').doc(recordID).get();
  if (existing.exists) {
    throw new functions.https.HttpsError('already-exists', 'Already submitted');
  }

  // Check 5: Distance
  const distance = haversineMeters(session.latitude, session.longitude, latitude, longitude);
  const isPresent = distance <= session.radius;

  const record = {
    recordID,
    sessionID,
    studentID,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    latitude,
    longitude,
    distance,
    status: isPresent ? 'present' : 'rejected',
    rejectionReason: isPresent ? null : \`Distance \${distance.toFixed(1)}m > \${session.radius}m\`
  };

  await db.collection('attendance_records').doc(recordID).set(record);
  return { status: record.status, distance };
});
`,
  },

  // --------------------------------------------------------------------------
  // README.md
  // --------------------------------------------------------------------------
  {
    path: 'README.md',
    category: 'config',
    description: 'Step-by-step instructions to compile and run on Android / iOS',
    content: `# ClassTrack Flutter Mobile App
Course: Mobile Programming - Level 2
Target: Flutter, Dart, Firebase Suite

## How to Run This Project on Your Phone / Emulator

1. Prerequisites:
   - Install Flutter SDK (>= 3.3.0)
   - Install Android Studio or Xcode
   - Firebase CLI (\`npm install -g firebase-tools\`)

2. Setup:
   \`\`\`bash
   flutter pub get
   flutter run
   \`\`\`

3. Configure Firebase:
   Run \`flutterfire configure\` to generate \`firebase_options.dart\` for your Firebase project.

4. Deploy Cloud Functions & Security Rules:
   \`\`\`bash
   firebase deploy --only functions,firestore:rules
   \`\`\`
`,
  },
];
