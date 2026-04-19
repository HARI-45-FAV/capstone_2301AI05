# Authentication & Authorization System

**Smart Academic Course Management Ecosystem (SACME)**

---

## 1. Introduction

The Authentication and Authorization system ensures that only legitimate institutional members can access the Smart Academic Course Management Ecosystem (SACME).

The system uses database-verified signup and role-based authentication to prevent unauthorized users from creating accounts.

Unlike public platforms, SACME does not allow unrestricted user registration. Instead, the system verifies users against records entered by authorized administrators.

This design ensures:
- Institutional security
- Role-based access control
- Prevention of unauthorized account creation
- Structured academic data management

---

## 2. Authentication Design Philosophy

The system follows a pre-registered identity verification model.

This means:
1. Authorized administrators first register official user records in the system database.
2. Users attempting to sign up must provide credentials that match the pre-registered records.
3. The system verifies the information before allowing account creation.

This approach eliminates the need for email invitations while maintaining strong access control.

---

## 3. Role-Based Authentication Hierarchy

The system contains four primary user roles.

`Main Admin`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
`Institute Admin (Faculty Advisor)`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
`Professor`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
`Student`

Each role has:
- Separate dashboards
- Role-specific permissions
- Controlled authentication mechanisms

---

## 4. Main Admin Authentication

The Main Admin is the highest authority in the system.

**Account Creation**
Main Admin accounts are manually created in the database during system initialization.

Example record:
| Field | Value |
| :--- | :--- |
| Email | admin@sacme.edu |
| Password | Hashed password |
| Role | MAIN_ADMIN |

Main Admin login is available through a protected route: `/admin-login`
This prevents unauthorized users from attempting admin access.

---

## 5. Institute Admin (Faculty Advisor) Authentication

The Institute Admin is the Faculty Advisor responsible for configuring academic data for each academic year.

To prevent unauthorized registrations, faculty advisors cannot freely sign up. Instead, the system uses database verification.

### 5.1 Faculty Advisor Registration Process

**Step 1 — Main Admin Registers Faculty Advisor**
The Main Admin enters faculty advisor details in the database using the admin dashboard.

Information stored includes:
| Field | Example |
| :--- | :--- |
| Name | Dr Ramesh |
| Email | ramesh@college.edu |
| Faculty ID | FAC001 |
| Department | Computer Science |
| Account Status | NOT_REGISTERED |

Example database record:
| id | name | email | faculty_id | status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Dr Ramesh | ramesh@college.edu | FAC001 | NOT_REGISTERED |

**Step 2 — Faculty Advisor Signup**
Faculty advisors access the signup page: `/signup/faculty-advisor`
They enter the following information:
- Faculty ID
- College Email
- Password
- Confirm Password

**Step 3 — Verification Process**
The system verifies the input using the database.

Verification logic:
`Check if faculty_id AND email exist in database`

Possible outcomes:
* **Case 1: Record exists and status = NOT_REGISTERED**
  Signup is allowed. System updates the database:
  - Password stored (hashed)
  - Status changed to ACTIVE
* **Case 2: Record does not exist**
  Signup is rejected. Error message:
  `Unauthorized registration. Please contact the system administrator.`

---

## 6. Professor Authentication

Professors are verified using data entered by the Faculty Advisor during semester configuration.

### 6.1 Instructor Registration by Faculty Advisor

When setting up a semester, the Faculty Advisor registers instructors.

Example table:
| Course | Instructor | Email | Instructor ID |
| :--- | :--- | :--- | :--- |
| Data Structures | Dr Kumar | kumar@college.edu | FAC203 |
| Operating Systems | Dr Rao | rao@college.edu | FAC118 |

This data is stored in the system database.

### 6.2 Professor Signup

Professors register using the following information:
- Instructor ID
- College Email
- Password

Signup page: `/signup/professor`

### 6.3 Verification Logic

The system checks:
`Instructor ID AND Email exist in database`

Possible outcomes:
* **Valid match**
  Account activated. Password stored. Professor dashboard enabled.
* **Invalid match**
  Signup rejected. Message displayed: `Instructor details not found. Please contact Faculty Advisor.`

---

## 7. Student Authentication

Students do not create accounts manually.
Student authentication uses the reference Excel sheet uploaded by the Faculty Advisor.

### 7.1 Student Data Upload

During semester setup, the Faculty Advisor uploads a student list containing:
- Roll Number
- Student Name
- Academic Year
- Semester

Example:
| Roll No | Name | Semester |
| :--- | :--- | :--- |
| 21CS101 | Ravi | 5 |
| 21CS102 | Priya | 5 |

This sheet becomes the official student database.

### 7.2 Student Login

Students log in using:
- Roll Number
- Academic Year
- Semester

Example:
`Roll No: 21CS101`
`Year: 2025`
`Semester: 5`

The system verifies the roll number in the database.
If the student exists: Access granted.
If not: Invalid student credentials.

---

## 8. Authentication Workflow

Complete login workflow:

Landing Page
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
Authentication Page
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
User chooses role
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
* **Main Admin** → Admin Dashboard
* **Faculty Advisor** → Database Verification → Institute Admin Dashboard
* **Professor** → Instructor Verification → Professor Dashboard
* **Student** → Roll Number Verification → Student Dashboard

---

## 9. Security Mechanisms

To ensure system security, SACME uses the following mechanisms.

**Password Hashing**
Passwords are stored using secure hashing algorithms such as bcrypt or Argon2. Plain text passwords are never stored.

**JWT Authentication**
After successful login, the system generates a JSON Web Token (JWT).
Example request header: `Authorization: Bearer JWT_TOKEN`
This token verifies user identity for all API requests.

**Role-Based Access Control**
Each API endpoint checks the user's role before granting access.
Example rules:
- Only professors can upload lectures.
- Only faculty advisors can configure semesters.
- Only admins can manage advisors.

---

## 10. Database Tables Used

Key authentication tables include:
| Table | Purpose |
| :--- | :--- |
| Users | Stores login credentials |
| FacultyAdvisors | Faculty advisor records |
| Professors | Instructor information |
| Students | Student records |
| Roles | Role definitions |
| AuthTokens | Session tokens |

---

## 11. Advantages of This Authentication Design

This approach offers several benefits:
- Prevents unauthorized user registrations
- Eliminates dependency on email verification
- Ensures all users belong to the institution
- Simplifies system implementation
- Provides strong role-based access control

---

## 12. Conclusion

The SACME authentication system uses database-verified registration and role-based access control to ensure secure access to academic resources.

By verifying users against records created by authorized administrators, the system prevents unauthorized access while maintaining a simple and efficient authentication process.

This approach ensures that only legitimate faculty advisors, professors, and students can participate in the academic ecosystem.


---

## Correct Authentication Flow (System Architecture)

### First Time User
Landing Page
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
Enter Identity (ID + Email)
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
Check DB status
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
IF `status = NOT_REGISTERED`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
Activation Page (Set Password)
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
`status → ACTIVE`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
Dashboard

### Returning User
Landing Page
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
Login Page (ID / Email + Password)
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
Dashboard

### Forgot Password
Login Page
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
Forgot Password
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
Enter Email
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
Send OTP
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
Verify OTP
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
Set New Password

---

## Required Database Change

Add this column to the schema:
```sql
account_status ENUM('NOT_REGISTERED', 'ACTIVE') DEFAULT 'NOT_REGISTERED'
```

Example record (Before Activation):
| faculty_id | email | password | account_status |
| :--- | :--- | :--- | :--- |
| FAC001 | ramesh@college.edu | NULL | NOT_REGISTERED |

Example record (After Activation):
| faculty_id | email | password | account_status |
| :--- | :--- | :--- | :--- |
| FAC001 | ramesh@college.edu | hashed | ACTIVE |

---

## UI Pages Needed

Three authentication pages are required for a unified auth flow across all portals (Main Admin, Faculty Advisor, Professor, Student):

1. **Activation Page** (first time only)
2. **Login Page** (normal access - `/auth/login`)
3. **Forgot Password Page** (OTP reset)

*Note: Uses a Unified Login Gateway (`/auth/login`) where the system detects the role automatically from the DB.*
