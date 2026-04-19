# SACME — Smart Academic Course Management Engine
## Complete Application Documentation

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Database Schema](#5-database-schema)
6. [Backend API Reference](#6-backend-api-reference)
7. [Frontend Modules](#7-frontend-modules)
8. [Security Architecture](#8-security-architecture)
9. [Quiz Engine](#9-quiz-engine)
10. [Announcement System](#10-announcement-system)
11. [Real-Time Features](#11-real-time-features)
12. [Email System](#12-email-system)
13. [File Management](#13-file-management)
14. [Deployment Guide](#14-deployment-guide)
15. [Environment Configuration](#15-environment-configuration)

---

## 1. System Overview

**SACME** (Smart Academic Course Management Engine) is a full-stack, production-grade Learning Management System (LMS) designed for universities and academic institutions.

The platform supports a complete academic lifecycle — from institute onboarding, semester & course creation, and student enrollment, to live class management, secure quiz examinations, assignment submissions, attendance tracking, material distribution, and real-time communication between professors and students.

### Key Capabilities

| Capability | Description |
|---|---|
| Multi-Role Authentication | Secure login for Admin, Faculty Advisor, Professor, and Student roles |
| Course Management | Full course lifecycle: create, assign, monitor, archive |
| Attendance Tracking | Real-time attendance marking and analytics |
| Assignment Engine | Full assignment lifecycle with file upload, grading, and re-submission |
| Secure Quiz Exam Engine | Anti-cheat, fullscreen-locked, timed examinations |
| Material Library | File/link uploads organized by week/topic |
| Announcement System | Course-level broadcasts with email delivery |
| Notifications | Real-time system notifications via TopNav bell |
| Analytics | Student roster analytics, quiz statistics, attendance percentages |
| Network Visualization | Interactive course network map (React Flow) |

---

## 2. Technology Stack

### 2.1 Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | v22 | JavaScript runtime environment |
| **Express.js** | v5.2.1 | REST API web framework |
| **Prisma ORM** | v5.15.0 | Database schema definition and client |
| **SQLite** | via Prisma | Lightweight relational database |
| **Socket.IO** | v4.8.3 | Real-time bidirectional event communication |
| **JSON Web Tokens (JWT)** | v9.0.2 | Stateless authentication tokens |
| **bcrypt** | v6.0.0 | Password hashing and salting |
| **Nodemailer** | v8.0.4 | Email transport (OTP, Announcements) |
| **Multer** | v2.1.1 | Multipart file upload handling |
| **Sharp** | v0.34.5 | Image processing and avatar resizing |
| **csv-parser** | v3.2.0 | Bulk student CSV import |
| **express-rate-limit** | v8.3.2 | API rate limiting middleware |
| **node-cache** | v5.1.2 | In-memory caching layer |
| **archiver** | v7.0.1 | ZIP archive generation |
| **dotenv** | v17.3.1 | Environment variable management |
| **cors** | v2.8.6 | Cross-Origin Resource Sharing headers |

### 2.2 Frontend

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | v16.1.6 | Full-stack React framework (App Router) |
| **React** | v19.2.3 | UI component library |
| **TypeScript** | v5 | Type-safe JavaScript |
| **TailwindCSS** | v4 | Utility-first CSS styling |
| **Framer Motion** | v12.36.0 | Animations and page transitions |
| **Socket.IO Client** | v4.8.3 | Real-time socket connection |
| **Lucide React** | v0.577.0 | Icon library |
| **Recharts** | v3.8.1 | Data visualization and analytics charts |
| **React Flow (@xyflow/react)** | v12.10.2 | Interactive network map visualization |
| **next-themes** | v0.4.6 | Dark/Light mode theming system |
| **react-quill-new** | v3.8.3 | Rich text editor for messages |
| **DOMPurify** | v3.3.3 | HTML sanitization for rich content |
| **clsx** | v2.1.1 | Conditional class name utility |
| **tailwind-merge** | v3.5.0 | TailwindCSS class merge utility |
| **dagre** | v0.8.5 | Directed graph layout engine |
| **html-to-image** | v1.11.13 | Export canvas content as image |

### 2.3 DevOps & Tools

| Tool | Purpose |
|---|---|
| **Prisma Studio** | Database GUI and schema management |
| **ESLint** | Code quality linting |
| **Supertest** | Backend API testing |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        SACME Platform                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Next.js Frontend (Port 3000)            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │  │
│  │  │  Admin   │ │ Faculty  │ │Professor │ │Student │ │  │
│  │  │Dashboard │ │ Advisor  │ │Dashboard │ │  View  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │  │
│  └──────────────────────────┬───────────────────────────┘  │
│                             │  REST API + Socket.IO         │
│  ┌──────────────────────────▼───────────────────────────┐  │
│  │             Express.js Backend (Port 5000)           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │  │
│  │  │Auth MW   │ │ RBAC MW  │ │Rate Limit│             │  │
│  │  └──────────┘ └──────────┘ └──────────┘             │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │              Route Handlers                 │    │  │
│  │  │ /auth /courses /quiz /assignments /announce │    │  │
│  │  └──────────────────┬──────────────────────────┘    │  │
│  └─────────────────────┼────────────────────────────────┘  │
│                        │  Prisma ORM                        │
│  ┌─────────────────────▼─────────────────┐                 │
│  │        SQLite Database (dev.db)       │                  │
│  └───────────────────────────────────────┘                 │
│                                                             │
│  ┌───────────────────────────────────────┐                 │
│  │     Nodemailer  →  Gmail SMTP        │                  │
│  └───────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘


```
<img width="554" height="572" alt="image" src="https://github.com/user-attachments/assets/fb020e0f-3284-4886-8892-01e370054fb0" />


### Directory Structure

```
capstone/
├── sacme-backend/
│   ├── controllers/       # Business logic
│   ├── routes/            # Express route definitions
│   ├── middleware/        # Auth, Rate Limiting
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── dev.db         # SQLite database file
│   ├── public/            # Static uploads (avatars, materials)
│   └── server.js          # Entry point
│
├── sacme-frontend/
│   └── src/
│       ├── app/           # Next.js App Router pages
│       │   ├── (dashboard)/
│       │   │   ├── admin/
│       │   │   ├── professor/
│       │   │   ├── student/
│       │   │   └── faculty-advisor/
│       │   └── auth/      # Login, Activate, Forgot Password
│       ├── components/
│       │   ├── professor/ # Professor-specific modules
│       │   ├── student/   # Student-specific modules
│       │   ├── shared/    # ActivityTimeline, etc.
│       │   └── ui/        # Reusable UI components
│       └── lib/           # Auth helpers, utilities
```

---

## 4. User Roles & Permissions

SACME uses Role-Based Access Control (RBAC) enforced via JWT and middleware.

### Roles

| Role | Code | Description |
|---|---|---|
| **Main Administrator** | `MAIN_ADMIN` | Full system access. Manages institute setup, branches, semesters, professors, students. |
| **Faculty Advisor** | `FACULTY_ADVISOR` | Manages semester-level student cohorts, monitors academic progress. |
| **Professor** | `PROFESSOR` | Manages assigned courses: attendance, assignments, quizzes, materials, announcements. |
| **Student** | `STUDENT` | Views and interacts with enrolled courses, submits assignments, takes quizzes. |

### Permission Matrix

| Feature | MAIN_ADMIN | FACULTY_ADVISOR | PROFESSOR | STUDENT |
|---|:---:|:---:|:---:|:---:|
| Institute Setup | YES | NO | NO | NO |
| Create Semesters/Branches | YES | NO | NO | NO |
| Manage Professors | YES | NO | NO | NO |
| Import Students (CSV) | YES | YES | NO | NO |
| Assign Courses | YES | YES | NO | NO |
| Mark Attendance | NO | NO | YES | NO |
| Create Assignments | NO | NO | YES | NO |
| Create Quizzes | NO | NO | YES | NO |
| Upload Materials | NO | NO | YES | NO |
| Post Announcements | NO | NO | YES | NO |
| Submit Assignments | NO | NO | NO | YES |
| Take Quizzes | NO | NO | NO | YES |
| View Own Attendance | NO | NO | NO | YES |

---

## 5. Database Schema

SACME uses **SQLite** managed via **Prisma ORM**. The schema contains **37 models** across four domains.

### 5.1 Authentication & Identity

| Model | Description |
|---|---|
| `User` | Base auth record. Email, passwordHash, role, account_status, OTP fields, lockout |
| `Admin` | Extends User for MAIN_ADMIN |
| `FacultyAdvisor` | Extends User for faculty with department info |
| `Professor` | Extends User with instructorId, department, soft-delete |
| `Student` | Extends User with rollNo, branch, semester links |

```prisma
model User {
  id             String  @id @default(uuid())
  email          String  @unique
  passwordHash   String?
  role           String  // MAIN_ADMIN | FACULTY_ADVISOR | PROFESSOR | STUDENT
  account_status String  @default("NOT_REGISTERED")
  activationToken     String? @unique
  failedLoginAttempts Int     @default(0)
  lockoutUntil        DateTime?
  otpHash        String?
  otpExpiresAt   DateTime?
  passwordResetToken String? @unique
}
```

### 5.2 Academic Structure

| Model | Description |
|---|---|
| `Institute` | Top-level institution configuration |
| `AcademicYear` | e.g. 2025-26, active/archived |
| `Branch` | B.Tech, M.Tech, Dual with `totalSemesters` |
| `Semester` | Odd/Even, Autumn/Spring, status lifecycle |
| `Course` | Linked to semester; theory/lab types |
| `CourseAssignment` | Many-to-many: Professor to Course |
| `Enrollment` | Many-to-many: Student to Course (used for email targeting) |
| `SemesterFacultyMapping` | Faculty Advisor to Semester |

### 5.3 Learning & Assessment

| Model | Description |
|---|---|
| `Attendance` | Per-student, per-course, per-date attendance with lock support |
| `Assignment` | Full assignment metadata: type, deadline, resubmission, late policy |
| `AssignmentFile` | Multiple reference files per assignment |
| `Submission` | Student submission: file, grade, feedback, version |
| `SubmissionFile` | Multiple files per submission |
| `SubmissionMember` | Group submission members |
| `AssignmentQuery` | Student Q&A thread per assignment |
| `DeadlineHistory` | Audit trail for deadline changes |
| `CourseMaterial` | File or link materials grouped by week |
| `Grade` | Final assignment + exam mark per student per course |

### 5.4 Quiz Engine

| Model | Description |
|---|---|
| `QuestionBank` | MCQ/TRUE_FALSE questions with difficulty, marks, negative marks |
| `QuestionOption` | Answer options with isCorrect flag |
| `Quiz` | Quiz metadata: duration, status lifecycle, security level |
| `QuizQuestion` | Links Quiz to QuestionBank with order |
| `QuizSubmission` | Student attempt: score, violations, auto-submit flag |
| `QuizAnswer` | Per-question answer records with marks |
| `ViolationLog` | Anti-cheat events: TAB_SWITCH, FULLSCREEN_EXIT |
| `LeaderboardCache` | Post-exam ranked scores |
| `QuizAnalytics` | Aggregate stats: avg, highest, lowest score, pass/fail rate |
| `QuestionAnalytics` | Per-question difficulty index and attempt stats |

### 5.5 Communication

| Model | Description |
|---|---|
| `Announcement` | Course announcements: type, isPinned, sendEmail, scheduledAt |
| `Notification` | System bell notifications per user with linkUrl |
| `EmailLog` | Audit of sent emails |
| `Ticket` | Support ticket system (Admin managed) |
| `AuditLog` | System-wide security action log |

---

## 6. Backend API Reference

Base URL: `http://localhost:5000`

All protected routes require: `Authorization: Bearer <jwt_token>`

### 6.1 Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/login` | Public | Login with email + password |
| POST | `/logout` | Protected | Invalidate session |
| GET | `/me` | Protected | Get current user profile |
| POST | `/activate` | Public | Activate account with token |
| POST | `/forgot-password` | Public | Send OTP to email |
| POST | `/verify-otp` | Public | Verify OTP code |
| POST | `/reset-password` | Public | Set new password via token |
| PUT | `/change-password` | Protected | Change password (authenticated) |

### 6.2 Courses — `/api/courses`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | MAIN_ADMIN | Create course |
| GET | `/my-courses` | Protected | Get user's assigned courses |
| GET | `/:id` | Protected | Get single course detail |
| PUT | `/:id` | MAIN_ADMIN | Update course |
| DELETE | `/:id` | MAIN_ADMIN | Delete course |
| POST | `/assign-professor` | MAIN_ADMIN | Assign professor to course |

### 6.3 Assignments — `/api/assignments`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | PROFESSOR | Create assignment |
| GET | `/course/:courseId` | Protected | List course assignments |
| GET | `/:id` | Protected | Get assignment detail |
| PUT | `/:id` | PROFESSOR | Edit assignment |
| DELETE | `/:id` | PROFESSOR | Delete assignment |
| POST | `/:id/submit` | STUDENT | Submit assignment |
| GET | `/:id/submissions` | PROFESSOR | View all submissions |
| PUT | `/:id/grade/:submissionId` | PROFESSOR | Grade a submission |
| POST | `/:id/queries` | STUDENT | Post a query |
| GET | `/:id/queries` | Protected | View queries |
| PUT | `/queries/:qId/reply` | PROFESSOR | Reply to query |

### 6.4 Attendance — `/api/attendance`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/mark` | PROFESSOR | Mark attendance for a class |
| GET | `/course/:courseId` | PROFESSOR | Get course attendance records |
| GET | `/student/me` | STUDENT | Get my attendance summary |
| PUT | `/lock/:courseId/:date` | PROFESSOR | Lock attendance for a date |

### 6.5 Materials — `/api/materials`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/upload` | PROFESSOR | Upload file material |
| GET | `/course/:courseId` | Protected | List course materials |
| PUT | `/:id` | PROFESSOR | Edit material |
| DELETE | `/:id` | PROFESSOR | Delete material |

### 6.6 Quiz Engine — `/api/quiz`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/create` | PROFESSOR | Create quiz |
| GET | `/course/:courseId` | Protected | List quizzes for course |
| GET | `/:quizId` | Protected | Get quiz detail |
| POST | `/:quizId/questions/add` | PROFESSOR | Add question to quiz |
| PUT | `/change-status/:quizId` | PROFESSOR | Change quiz status |
| POST | `/start` | STUDENT | Start a quiz attempt |
| POST | `/save-answer` | STUDENT | Autosave an answer |
| POST | `/submit` | STUDENT | Submit completed quiz |
| GET | `/:quizId/leaderboard` | Protected | Get quiz leaderboard |
| GET | `/:quizId/analytics` | PROFESSOR | Quiz analytics |
| POST | `/mock` | PROFESSOR | Generate mock quiz dataset |

### 6.7 Announcements — `/api/announcements`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/create` | PROFESSOR | Create announcement (with optional email) |
| GET | `/course/:courseId` | Protected | Get all course announcements |
| DELETE | `/:id` | PROFESSOR | Delete announcement |
| PUT | `/:id/read` | STUDENT | Mark announcement as read |

### 6.8 Notifications — `/api/notifications`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/mine` | Protected | Get logged-in user's notifications |
| PUT | `/:id/read` | Protected | Mark notification as read |
| DELETE | `/:id` | Protected | Delete notification |

### 6.9 Profile — `/api/profile`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/me` | Protected | Get profile |
| PUT | `/update` | Protected | Update profile info |
| POST | `/avatar` | Protected | Upload profile avatar |
| GET | `/student/dashboard-stats` | STUDENT | Student dashboard stats |

---

## 7. Frontend Modules

### 7.1 Authentication Pages (`/auth`)

| Page | Description |
|---|---|
| `/auth/login` | Email + password with role detection |
| `/auth/activate` | First login, set password via token |
| `/auth/forgot-password` | OTP-based password recovery |
| `/auth/reset-password` | Final password reset confirmation |

### 7.2 Admin Dashboard (`/admin`)

| Tab | Description |
|---|---|
| Institute Setup | Configure institution name, logo, address |
| Academic Years | Create/manage academic year records |
| Branches | Create B.Tech, M.Tech, Dual branches |
| Semesters | Create odd/even semester configurations |
| Professors | Add, view, disable professor accounts |
| Students | Bulk CSV import, view roster, manage accounts |
| Courses | Create courses, assign professors |
| Tickets | View and manage support tickets |
| Audit Logs | System-wide security event logs |
| Network Map | Interactive visualization of the academic structure |

### 7.3 Professor Dashboard (`/professor/dashboard`)

Each tab is a fully self-contained module for a selected course:

| Tab | Component | Description |
|---|---|---|
| Overview | `ActivityTimeline` | Course activity feed |
| Attendance | `AttendanceModule` | Mark, lock, view attendance by date |
| Assignments | `AssignmentModule` + `AssignmentForm` | Create, publish, grade assignments |
| Materials | `MaterialModule` | Upload files/links by week/topic |
| Students | `StudentRosterModule` | View enrolled students with attendance % |
| Quizzes | `QuizCreatorModule` | Create quizzes, add questions, manage status, view analytics |
| Announcements | `ProfessorAnnouncementModule` | Post, pin, delete announcements with email toggle |

### 7.4 Student Dashboard (`/student/dashboard`)

| Tab | Component | Description |
|---|---|---|
| Overview | `ActivityTimeline` | Course activity feed |
| Attendance | `StudentAttendanceModule` | View personal attendance per course |
| Assignments | `StudentAssignmentModule` | View, download, submit assignments |
| Materials | `StudentMaterialModule` | Browse and download course materials |
| Examinations | `StudentQuizViewerModule` | Take timed, fullscreen-locked exams |
| Announcements | `StudentAnnouncementModule` | View course announcements with unread indicators |

### 7.5 Shared Components

| Component | Description |
|---|---|
| `TopNav` | Header with search, notifications bell, theme toggle, profile |
| `Sidebar` | Role-based navigation sidebar |
| `GlobalSearch` | Cross-module search (admin/professor) |
| `ActivityTimeline` | Shared course activity feed |
| `NetworkMap` | React Flow-based academic network visualization |
| `ThemeToggle` | Dark/light mode switcher |

---

## 8. Security Architecture

### 8.1 Authentication Flow

```
User submits Login (email + password)
    Backend verifies password via bcrypt
    Server issues signed JWT token
    Frontend stores token in localStorage
    All API requests send: Authorization: Bearer <token>
    Middleware decodes JWT + fetches user from database
    authorizeRoles() checks role against the required roles
```

### 8.2 JWT Configuration

- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret**: Stored in `.env` as `JWT_SECRET`
- **Payload**: `{ userId, role, iat, exp }`
- **Validation**: Every request verifies the user still exists and is ACTIVE

### 8.3 Password Security

- **Hashing**: bcrypt with secure salt rounds
- **First Login**: Account starts as `NOT_REGISTERED` with a unique activation token
- **OTP Flow**: 6-digit OTP for forgot password, time-limited, max 3 attempts
- **Rate Limiting**: Controlled via `express-rate-limit` per IP address
- **Account Lockout**: Progressive lockout after N failed login attempts

### 8.4 Quiz Anti-Cheat Engine

| Protection | Implementation |
|---|---|
| Fullscreen Lock | `requestFullscreen()` on exam start, monitored via `fullscreenchange` event |
| Tab Switch Detection | `visibilitychange` event listener |
| Violation Debounce | 2-second cooldown prevents rapid duplicate violations |
| Violation Limit | 3 violations trigger automatic quiz submission |
| Violation Banners | Dynamic UI warnings: Violation 1/3, 2/3, Final Warning |
| Auto-Submit Guard | `isSubmitted` ref prevents duplicate API submissions |
| Submission Modal | Custom styled modal replaces browser `confirm()` |

---

## 9. Quiz Engine

### 9.1 Quiz Lifecycle

```
DRAFT → READY → STARTED → ENDED
```

| Status | Meaning |
|---|---|
| `DRAFT` | Quiz being built; questions being added |
| `READY` | Finalized; visible to students but not started |
| `STARTED` | Live exam; students can attempt |
| `ENDED` | Submitted; leaderboard generated |

### 9.2 Quiz Configuration Options

| Option | Description |
|---|---|
| `duration` | Total exam time in minutes |
| `totalMarks` | Sum of all question marks |
| `securityLevel` | `HIGH` (fullscreen + tab monitoring) or `LOW` |
| `shuffleQuestions` | Randomize question order per student |
| `shuffleOptions` | Randomize MCQ options per student |
| `maxAttempts` | Number of allowed attempts (default: 1) |
| `allowLate` | Accept late submissions |

### 9.3 Question Types

| Type | Description |
|---|---|
| `MCQ` | Single correct answer from options |
| `MULTIPLE_CORRECT` | Multiple correct options |
| `TRUE_FALSE` | Binary true/false answer |

### 9.4 Leaderboard Generation

- Generated **once** when status changes to `ENDED`
- Protected by `leaderboardGenerated` boolean lock (no double execution)
- Cached in `LeaderboardCache` table with rank and time taken
- Emitted via Socket.IO to all connected clients in the quiz room

---

## 10. Announcement System

### 10.1 Announcement Types

| Type | Icon | Use Case |
|---|---|---|
| `GENERAL` | 📢 | Regular class information |
| `IMPORTANT` | 🚨 | Critical notices |
| `EXAM` | ⚠ | Exam schedules and alerts |
| `ASSIGNMENT` | 📝 | Assignment-related notices |
| `MATERIAL` | 📘 | New material uploads |

### 10.2 Creation Flow

```
Professor creates announcement
    Announcement stored in database
    System loops through Enrollment table for courseId
    Creates Notification records for each enrolled student
    TopNav bell badge count increments for each student
    If sendEmail=true: dispatches email via Nodemailer
    Students see announcement in Announcements tab
```

### 10.3 Features

- **Pinning**: Pin to top of feed with visual gold indicator
- **Email Delivery**: Optional per-announcement, targets enrolled students
- **Notification Bell**: Auto-driven via system Notification model
- **Unread Tracking**: Animated pulse dot on unread announcements
- **Scheduled Posts**: `scheduledAt` field supports future publish dates

---

## 11. Real-Time Features

### 11.1 Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `student_joined` | Server → Client | Student enters exam room |
| `student_status` | Server → Client | Live status update |
| `attendance_updated` | Server → Client | Attendance marked live |
| `leaderboard_update` | Server → Client | Quiz ended, scores ready |
| `submission_received` | Server → Client | Student submitted |

### 11.2 Socket Rooms

| Room | Format | Members |
|---|---|---|
| Quiz Room | `quiz_<quizId>` | Professor + all students in exam |
| Course Room | `<courseId>` | All course participants |

### 11.3 Notification Polling

- Polls `/api/notifications/mine` every 15 seconds when tab is visible
- Pauses automatically when `document.visibilityState` is not `visible`
- Unread count drives red badge on bell icon

---

## 12. Email System

Delivered via **Nodemailer** using Gmail SMTP.

### 12.1 Email Triggers

| Trigger | Recipients |
|---|---|
| Account activation | Single user (professor/student) |
| OTP for password reset | Single user |
| Announcement (sendEmail=true) | All enrolled students in course |

### 12.2 Email Configuration

Set in `.env`:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
```

> Use Gmail App Passwords (not your main Gmail password) for SMTP authentication.

---

## 13. File Management

### 13.1 Upload Paths

| File Type | Storage Path |
|---|---|
| Avatars (Student/Professor) | `/public/avatars/` |
| Assignment Attachments | `/public/assignments/` |
| Submission Files | `/public/submissions/` |
| Course Materials | `/public/materials/` |

### 13.2 Supported Formats

| Category | Formats |
|---|---|
| Documents | PDF, DOC, DOCX, PPT, PPTX |
| Archives | ZIP |
| Images | JPG, JPEG, PNG |
| Data | CSV (bulk student import) |

---

## 14. Deployment Guide

### 14.1 Prerequisites

- Node.js v18 or higher
- npm v9 or higher

### 14.2 Backend Setup

```bash
cd sacme-backend

# Install dependencies
npm install

# Configure environment
# Create .env with values from Section 15

# Push database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start server
node server.js
# Runs on http://localhost:5000
```

### 14.3 Frontend Setup

```bash
cd sacme-frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Runs on http://localhost:3000
```

### 14.4 First-Time Setup Flow

1. Start both backend and frontend
2. Go to `http://localhost:3000`
3. Login as **Main Admin** (seed or create first admin account)
4. Complete **Institute Setup** — name, address, logo
5. Create an **Academic Year**
6. Create **Branches** (e.g. B.Tech Computer Science)
7. Create **Semesters** — link to branch + academic year
8. Create **Courses** — assign to semesters
9. Register **Professors** and assign to courses
10. Bulk import **Students** via CSV
11. Professors can now log in and manage their courses

### 14.5 Database Backup (Before Any Schema Change)

```bash
# Backup database first
cp prisma/dev.db prisma/dev_backup_YYYY_MM_DD.db

# Apply schema changes
npx prisma db push --accept-data-loss

# Regenerate client
npx prisma generate
```

---

## 15. Environment Configuration

### `sacme-backend/.env`

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Server Port
PORT=5000

# JWT Authentication
JWT_SECRET=your_strong_secret_key_here

# Email (Gmail SMTP)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
```

---

## Appendix — Key Design Decisions

| Decision | Rationale |
|---|---|
| SQLite for storage | Lightweight, zero-config, file-based. Ideal for single-server institutional deployment |
| JWT stateless auth | Scalable sessions without server-side session state |
| Prisma ORM | Type-safe queries, easy schema management, migration tooling |
| Socket.IO rooms | Efficient broadcast scoping per-quiz and per-course |
| `window.location.href` for quiz exit | Forces hard SPA reset to fully clear anti-cheat state |
| `leaderboardGenerated` flag | Prevents double execution of expensive leaderboard computation |
| `Enrollment` table for emails | Decouples email targeting from raw Student-Course joins |
| `Notification` model for bell | Unified notification delivery across all system trigger types |
| Debounced violations | Prevents rapid duplicate anti-cheat events from single blur |

---

*SACME v1.0 — Documentation generated April 2026*
