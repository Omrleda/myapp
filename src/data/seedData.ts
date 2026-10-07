/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CourseClass, Enrollment, QuizQuestion, User } from '../types';

export const TEACHER_USER: User = {
  uid: 'teacher_omar',
  name: 'Prof. Omar Harrison',
  email: 'o.harrison@university.edu',
  role: 'teacher',
  studentID: null,
};

export const INITIAL_STUDENTS: User[] = [
  {
    uid: 'student_alex',
    name: 'Alex Johnson',
    email: 'alex.j@student.edu',
    role: 'student',
    studentID: 'MP2-2024-8841',
  },
  {
    uid: 'student_maya',
    name: 'Maya Lin',
    email: 'maya.l@student.edu',
    role: 'student',
    studentID: 'MP2-2024-8842',
  },
  {
    uid: 'student_carlos',
    name: 'Carlos Mendez',
    email: 'carlos.m@student.edu',
    role: 'student',
    studentID: 'MP2-2024-8843',
  },
  {
    uid: 'student_sarah',
    name: 'Sarah Connor',
    email: 'sarah.c@student.edu',
    role: 'student',
    studentID: 'MP2-2024-8844',
  },
  {
    uid: 'student_jordan',
    name: 'Jordan Bell (Unenrolled Guest)',
    email: 'jordan.b@student.edu',
    role: 'student',
    studentID: 'MP2-2024-9999', // Not enrolled in CS302
  },
];

export const INITIAL_CLASSES: CourseClass[] = [
  {
    classID: 'CS302_MOBILE2',
    name: 'Mobile Programming - Level 2',
    code: 'CS 302',
    teacherID: 'teacher_omar',
    joinCode: 'FLUTTER2026',
    semester: 'Fall 2026',
    room: 'Mobile Dev Lab 204',
    description: 'Advanced Flutter architectures, Dart concurrency, Riverpod state patterns, and hardware sensors.',
  },
  {
    classID: 'CS401_DISTRIBUTED',
    name: 'Distributed Cloud Architecture',
    code: 'CS 401',
    teacherID: 'teacher_omar',
    joinCode: 'CLOUD401',
    semester: 'Fall 2026',
    room: 'Amphitheater 3',
    description: 'Serverless microservices, Firebase Cloud Functions, and high-concurrency event brokers.',
  },
];

// Enrollments formatted strictly as {classID}_{studentID}
export const INITIAL_ENROLLMENTS: Enrollment[] = [
  {
    enrollmentID: 'CS302_MOBILE2_MP2-2024-8841',
    classID: 'CS302_MOBILE2',
    studentID: 'MP2-2024-8841',
    enrolledAt: '2026-09-01T09:00:00Z',
  },
  {
    enrollmentID: 'CS302_MOBILE2_MP2-2024-8842',
    classID: 'CS302_MOBILE2',
    studentID: 'MP2-2024-8842',
    enrolledAt: '2026-09-01T09:05:00Z',
  },
  {
    enrollmentID: 'CS302_MOBILE2_MP2-2024-8843',
    classID: 'CS302_MOBILE2',
    studentID: 'MP2-2024-8843',
    enrolledAt: '2026-09-01T09:10:00Z',
  },
  {
    enrollmentID: 'CS302_MOBILE2_MP2-2024-8844',
    classID: 'CS302_MOBILE2',
    studentID: 'MP2-2024-8844',
    enrolledAt: '2026-09-01T09:15:00Z',
  },
  // Jordan Bell (MP2-2024-9999) is intentionally excluded to demonstrate Check 3 Rejection!
];

// Campus Anchor Coordinates (University Tech Hall)
export const DEFAULT_ANCHOR_GPS = {
  latitude: 37.774929,
  longitude: -122.419416,
  name: 'Mobile Dev Lab 204 (Tech Building B)',
};

export interface CampusLocationPreset {
  id: string;
  name: string;
  offsetMeters: number;
  bearing: number;
  inBounds: boolean; // Assuming standard 50m radius
  description: string;
}

export const CAMPUS_LOCATION_PRESETS: CampusLocationPreset[] = [
  {
    id: 'front_row',
    name: 'Front Row (Lab Desk 04)',
    offsetMeters: 6.5,
    bearing: 30,
    inBounds: true,
    description: 'Inside classroom, 6.5m from instructor podium.',
  },
  {
    id: 'middle_row',
    name: 'Middle Row (Lab Desk 18)',
    offsetMeters: 21.0,
    bearing: 135,
    inBounds: true,
    description: 'Inside classroom, 21m center room seating.',
  },
  {
    id: 'back_corner',
    name: 'Back Corner (Door Exit)',
    offsetMeters: 41.5,
    bearing: 210,
    inBounds: true,
    description: 'Near rear door, 41.5m away (still ≤ 50m radius).',
  },
  {
    id: 'outside_hallway',
    name: 'Hallway / Vending Area',
    offsetMeters: 78.0,
    bearing: 315,
    inBounds: false,
    description: 'Outside the room in corridor (78m > 50m radius -> REJECTED).',
  },
  {
    id: 'campus_canteen',
    name: 'Campus Canteen & Lawn',
    offsetMeters: 310.0,
    bearing: 90,
    inBounds: false,
    description: '310m away at student union food court (Proxy Attempt!).',
  },
  {
    id: 'dormitory',
    name: 'Student Dormitory Residence',
    offsetMeters: 1240.0,
    bearing: 45,
    inBounds: false,
    description: '1.24km away in residential quad (Remote Proxy Attempt!).',
  },
];

// 5-Question Mobile Programming - Level 2 Question Bank
export const MOBILE_PROGRAMMING_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'In Flutter State lifecycle, which method is guaranteed to run exactly once when the State object is inserted into the tree?',
    codeSnippet: 'class _DetailState extends State<DetailScreen> {\n  @override\n  void ?????() {\n    super.?????();\n  }\n}',
    options: ['didChangeDependencies()', 'initState()', 'build()', 'didUpdateWidget()'],
    correctIndex: 1,
    explanation: 'initState() is called once when the State object is created and inserted into the widget tree.',
  },
  {
    id: 2,
    question: 'How do Dart Isolates achieve thread isolation and memory safety during heavy background computations?',
    codeSnippet: 'await Isolate.spawn(heavyTask, messagePort);',
    options: [
      'They share mutable heap memory via synchronized mutexes',
      'They have separate event loops and private memory heaps communicating via message ports',
      'They run inside the primary UI Thread via async/await microtasks',
      'They compile to Web Workers with shared ArrayBuffers',
    ],
    correctIndex: 1,
    explanation: 'Every Dart isolate possesses its own private heap memory and event loop, sharing zero memory; communication happens strictly via message passing.',
  },
  {
    id: 3,
    question: 'Which method on BuildContext performs an O(1) lookup for an ancestor InheritedWidget while registering the calling widget for rebuilds on change?',
    codeSnippet: 'final theme = context.?????????<ThemeData>();',
    options: [
      'findAncestorWidgetOfExactType<T>()',
      'dependOnInheritedWidgetOfExactType<T>()',
      'findRenderObject()',
      'visitAncestorElements()',
    ],
    correctIndex: 1,
    explanation: 'dependOnInheritedWidgetOfExactType registers the widget as a subscriber to the inherited widget, triggering rebuilds when the inherited widget changes.',
  },
  {
    id: 4,
    question: 'Why should GPS location requests in ClassTrack be triggered strictly on student action rather than background polling?',
    codeSnippet: '// Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);',
    options: [
      'Operating systems enforce strict background battery limits and client-side background polling does not eliminate spoofing',
      'Firebase Firestore rejects background geolocation payloads',
      'Dart async runtimes crash when sensors are polled during screen idle',
      'Mobile devices cannot obtain GPS locks without active touch focus',
    ],
    correctIndex: 0,
    explanation: 'Action-triggered capture preserves mobile battery, complies with iOS/Android foreground location permission policies, and pairs with the 120s server-validated window.',
  },
  {
    id: 5,
    question: 'What mechanism in Flutter allows isolating a subtree so that painting its descendants does not trigger repainting of the parent render objects?',
    codeSnippet: 'RepaintBoundary(\n  child: CustomLiveRadarPainter(),\n)',
    options: ['ClipRect', 'RepaintBoundary', 'Offstage', 'BackdropFilter'],
    correctIndex: 1,
    explanation: 'RepaintBoundary inserts a separate display list layer in the render tree, preventing repaint propagation between the child and parent.',
  },
];
