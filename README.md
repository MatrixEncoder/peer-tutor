# Peer Tutoring Coordination Platform

A web-based prototype for university students to discover, schedule, and review peer tutors. Built as a capstone project following the research paper: *Web-Based Peer Tutoring Coordination Platform for University Students*.

## Features

- **User Registration & Authentication** — Sign up as a Student, Tutor, or both. Session-based login.
- **Tutor Directory & Search** — Browse tutor profiles filtered by subject/unit code, department, and minimum rating.
- **Tutor Profiles** — View bio, verified subjects, star rating, weekly availability, and past student reviews.
- **Session Booking** — Book a tutoring session by selecting a date, time, and duration from the tutor's availability.
- **Session Management** — Tutors accept or decline incoming requests. Both parties can cancel or mark sessions complete.
- **Ratings & Reviews** — After a session, students leave a 1–5 star rating with written feedback. Reviews appear on the tutor's profile.
- **Availability Management** — Tutors set their weekly available time slots (day, start time, end time).
- **Profile Management** — Edit name, bio, university, department, and subjects.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3 |
| Backend | Node.js, Express.js |
| Database | SQLite (via sql.js) |
| Auth | bcryptjs, express-session |
| Tools | Git/GitHub, VS Code |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Seed the database with test data
npm run seed

# 3. Start the server
npm start
```

Then open **http://localhost:3000** in your browser.

## Test Accounts

After seeding, these accounts are ready to use:

| Email | Password | Role |
|-------|----------|------|
| alex@university.edu | password123 | BOTH |
| sarah@university.edu | password123 | TUTOR |
| mike@university.edu | password123 | TUTOR |
| emma@university.edu | password123 | TUTOR |
| james@university.edu | password123 | TUTOR |
| lisa@university.edu | password123 | STUDENT |
| david@university.edu | password123 | STUDENT |

**Recommended:** Log in as `alex@university.edu` — this account has role `BOTH` so you can test the student dashboard (book sessions, leave reviews) and the tutor dashboard (accept/decline requests, view feedback) by switching between Student View and Tutor View.

## Project Structure

```
Peer-Tutor/
├── server.js              # Express server entry point
├── database.js            # SQLite setup (sql.js), schema, helpers
├── seed.js                # Database seeder with mock data
├── package.json
├── .env                   # PORT, SESSION_SECRET
├── middleware/
│   └── auth.js            # requireAuth middleware
├── routes/
│   ├── auth.js            # Register, login, logout, profile
│   ├── tutors.js          # Tutor listing and search
│   ├── sessions.js        # Session CRUD and status management
│   ├── availability.js    # Weekly availability CRUD
│   └── reviews.js         # Post-session reviews
├── public/
│   ├── index.html         # Landing page
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── tutors.html        # Tutor directory with filters
│   ├── tutor-profile.html # Individual tutor profile + booking form
│   ├── dashboard.html     # Student/Tutor dashboard
│   ├── profile.html       # Profile editor + availability
│   ├── css/
│   │   └── style.css      # Custom styles
│   └── js/
│       ├── auth.js        # Shared auth utilities
│       ├── tutors.js      # Tutor directory logic
│       ├── tutor-profile.js # Profile + booking logic
│       ├── dashboard.js   # Session management + reviews
│       └── profile.js     # Profile + availability editing
└── data/
    └── peer-tutor.db      # SQLite database (auto-created, gitignored)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/register | Create account |
| POST | /api/login | Authenticate |
| POST | /api/logout | Destroy session |
| GET | /api/me | Get current user |
| GET | /api/profile | Get profile |
| PUT | /api/profile | Update profile |
| GET | /api/tutors | List/search tutors |
| GET | /api/tutors/:id | Get tutor detail + availability + reviews |
| POST | /api/sessions | Book a session |
| GET | /api/sessions?role=student | Student's sessions |
| GET | /api/sessions?role=tutor | Tutor's incoming sessions |
| PATCH | /api/sessions/:id | Update status (ACCEPT/DECLINE/COMPLETE/CANCEL) |
| PUT | /api/availability | Set weekly availability slots |
| POST | /api/reviews | Submit a review (1-5 stars + comment) |

## Session Workflow

1. Student browses tutors and selects one
2. Student fills out booking form (subject, date, time, duration, notes)
3. Session is created with status **PENDING**
4. Tutor sees the request in their dashboard and **ACCEPTS** or **DECLINES**
5. If accepted, tutor marks it **COMPLETED** after the session
6. Student leaves a **rating and review**
7. Either party can **CANCEL** a pending or accepted session

## Database Schema

- **users** — id, name, email, password, role (STUDENT/TUTOR/BOTH), university, department, bio
- **tutor_profiles** — user_id, subjects, bio, avg_rating, total_reviews
- **availability** — tutor_id, day_of_week, start_time, end_time
- **sessions** — id, student_id, tutor_id, subject, scheduled_date, scheduled_time, duration_minutes, notes, status (PENDING/ACCEPTED/DECLINED/COMPLETED/CANCELLED)
- **reviews** — id, session_id, student_id, tutor_id, rating, comment, created_at

## Notes

- The database file (`data/peer-tutor.db`) is auto-created on first run and gitignored
- Run `npm run seed` to reset the database with fresh test data
- The app runs on port 3000 by default (configurable in `.env`)
