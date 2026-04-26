# Trybe - Social Activity Platform

A social activity platform for organizing and joining spontaneous events with friends. Host activities, build trust, and discover what's happening in your community.

## Features

### Activities

- **Create Activities** - Set title, description, location (interactive map), start time, and visibility (Public or Friends-only)
- **Live Status** - Activities start as UPCOMING; hosts manually toggle them LIVE to enable attendee check-ins
- **RSVP** - Join/leave activities; hosts can end or cancel their events
- **Check-ins** - Location-verified attendance when activities are LIVE

### Trust System

Build your reputation through positive community participation.

| Starting Score | 50 |
|----------------|-----|

| Action | Trust Delta | Description |
|--------|-------------|-------------|
| Complete hosted activity | +10 | Host ends a successfully attended event |
| Check in to activity | +5 | Attendee verifies their presence at a LIVE activity |
| Accept friend request | +5 | Both users gain trust when connecting |
| Host cancels with attendees | -15 | Last-minute cancellation affects reliability |
| Cancel RSVP within 2 hours | -5 | Leaving too close to start time |
| Remove a friend | -10 | Friend removal affects trust |

**Trust Badges:**

| Score Range | Badge | Label |
|-------------|-------|-------|
| 76+ | ⭐ | Veteran |
| 51-75 | 🟢 | Trusted |
| 26-50 | 🟡 | Regular |
| 0-25 | 🔴 | New |

### Hype System

Show enthusiasm for activities without committing to attend. Hypes are displayed on activity cards and can be toggled on/off.

- Each user can hype an activity exactly once
- Activities display hype count in the feed
- Hype status is persisted across sessions

### Friends

- **Send Requests** - Search users by email or name
- **Manage Requests** - Accept incoming or view outgoing requests
- **Filter Feed** - Toggle between "All" and "Friends" activities

### User Workflow

1. **Sign Up** - Create account (email/password via Firebase Auth)
2. **Set Profile** - Display name auto-generated from email
3. **Browse Feed** - See activities on The Feed (All or Friends-only)
4. **Join Activity** - RSVP to events you're interested in
5. **Check In** - When the activity goes LIVE, verify your attendance with location
6. **Build Trust** - Complete activities and check in to increase your score
7. **Connect** - Add friends to see their activities

---

## Technical Architecture

### Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React Native (Expo) |
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL |
| ORM | TypeORM |
| Auth | Firebase Auth (JWT) |
| Maps | react-native-maps + CARTO tile server |

### Directory Structure

```
trybe/
├── backend/                    # NestJS API server
│   └── src/
│       ├── activities/         # Activity CRUD, live status
│       ├── activity-hype/     # Hype feature
│       ├── auth/              # Firebase JWT validation
│       ├── friends/           # Friend requests, management
│       ├── rsvp/              # RSVP management
│       ├── users/             # User profiles, trust scores
│       ├── chat/              # (reserved for future)
│       ├── gamification/      # (reserved for future)
│       └── main.ts           # App bootstrap
│
├── client-expo/                # React Native app
│   ├── components/            # Reusable UI components
│   │   ├── ActivityCard.tsx  # Activity feed card
│   │   ├── CreateActivity.tsx # Activity creation form
│   │   ├── DateTimePickerModal.tsx
│   │   ├── RadarMap.tsx       # Map with CARTO tiles
│   │   └── ...
│   ├── screens/               # Screen components
│   │   ├── FeedScreen.tsx    # Activity feed
│   │   ├── MapScreen.tsx     # Map view
│   │   ├── ActivityScreen.tsx
│   │   └── ProfileScreen.tsx # Profile, RSVPs, friends
│   ├── lib/                  # API client, utilities
│   │   └── api.ts            # Fetch wrappers
│   ├── App.tsx               # Root component
│   └── tailwind.config.js    # Theme colors
│
└── docker-compose.yml         # PostgreSQL setup
```

### Database Schema

**Core Entities:**

- `User` - id, email, displayName, trustScore, createdAt
- `Activity` - id, title, description, location, startTime, status, hostId, visibility
- `Rsvp` - userId, activityId, checkedIn
- `ActivityHype` - activityId, userId (unique composite)
- `FriendRequest` - id, requesterId, receiverId, status
- `Friendship` - userId, friendId (bidirectional)

### API Endpoints

| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/activities` | GET | List activities (with friends filter) |
| `/activities` | POST | Create activity |
| `/activities/:id/live` | POST | Go live |
| `/activities/:id/end` | POST | Complete activity |
| `/activities/:id/cancel` | POST | Cancel activity |
| `/activities/:id/rsvp` | POST | Join RSVP |
| `/activities/:id/rsvp` | DELETE | Leave RSVP |
| `/activities/:id/checkin` | POST | Location-verified check-in |
| `/activities/:id/hype` | POST | Toggle hype |
| `/activities/:id/hypes` | GET | Get hype statuses |
| `/users/me` | GET | Current user profile |
| `/friends` | GET | List friends |
| `/friends/requests/incoming` | GET | Pending requests |
| `/friends/requests/outgoing` | GET | Sent requests |
| `/friends/requests` | POST | Send request |
| `/friends/requests/:id/accept` | POST | Accept request |
| `/friends/requests/:id/reject` | POST | Reject request |
| `/friends/:id` | DELETE | Remove friend |

---

## Getting Started

### Backend

```bash
cd backend
npm install
# Configure DATABASE_URL in .env
npm run start:dev
```

### Frontend

```bash
cd client-expo
npm install
# Configure EXPO_PUBLIC_API_URL in .env
npx expo start
```

