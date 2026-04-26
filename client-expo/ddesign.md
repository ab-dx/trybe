# Trybe — Google Stitch AI Design Document

> **Purpose:** This document provides Google Stitch AI with all the context it needs to generate, iterate on, and export high-fidelity mobile UI screens for the **Trybe** React Native (Expo) frontend. Feed it screen-by-screen or as a single prompt to produce cohesive, production-ready designs.

---

## 1. Product Overview

**Trybe** is a campus-centric, location-based social app that lets university students **discover, host, and join real-world activities** (pickup basketball, study sessions, open mics, etc.). Users earn a **Trust Score** through reliable behavior — showing up, checking in, hosting events — creating a reputation layer that replaces anonymity with accountability.

### Core Value Props

| Pillar | Description |
|---|---|
| **Discover** | Browse a real-time Feed or Map of nearby activities posted by peers |
| **Host** | Create location-pinned activities with a draggable map pin |
| **Join & Hype** | RSVP to activities and "Hype" them to boost visibility |
| **Trust** | Earn Trust Score through check-ins, hosting, and showing up |
| **Friends** | Add friends, filter feeds, and see friend-only activities |

### Target User

University students aged 18-24 on a single campus. Mobile-first (Android primary, iOS secondary).

---

## 2. Tech Stack Context

| Layer | Technology |
|---|---|
| Framework | React Native via **Expo SDK 54** |
| Language | TypeScript |
| Styling | `StyleSheet.create()` (React Native) + **NativeWind** (Tailwind CSS v3.4 for RN) |
| Navigation | Manual tab-based switching (no React Navigation — 4 tabs managed via state in `App.tsx`) |
| Auth | Firebase Auth (email/password) |
| Backend | NestJS REST API (separate `backend/` directory) |
| Maps | `react-native-maps` with CartoDB/OpenStreetMap tile layer |
| Location | `expo-location` for GPS + reverse geocoding |
| Fonts | Montserrat (Google Fonts via `@expo-google-fonts/montserrat`) |
| Icons | `@expo/vector-icons` — **Ionicons** and **Feather** icon sets |

---

## 3. Design System & Tokens

### 3.1 Color Palette

Use these exact hex values to maintain consistency across Stitch-generated screens.

#### Primary (Deep Navy)

```
50:  #e6e9ef    100: #c2c9db    200: #9ba7c5
300: #7385af    400: #56689d    500: #3a4c8c
600: #2f3d76    700: #243160    800: #1a254a
900: #101934    950: #080e1f  ← App background
```

#### Secondary (Steel Blue)

```
50:  #f0f4f8    100: #d9e2ec    200: #bcccdc
300: #9fb3c8    400: #829ab1    500: #627d98
600: #486581    700: #334e68    800: #243b53
900: #102a43    950: #081c2e
```

#### Accent (Electric Blue)

```
50:  #e6f2ff    100: #cce5ff    200: #99cbff
300: #66b0ff    400: #3396ff  ← Active tabs, CTA accent
500: #007aff  ← Primary CTA buttons
600: #0062cc    700: #004999
800: #003166    900: #001833
```

#### Neutral (Slate)

```
50:  #f8fafc    100: #f1f5f9    200: #e2e8f0
300: #cbd5e1    400: #94a3b8  ← Muted text, subtitles
500: #64748b  ← Secondary text
600: #475569    700: #334155  ← Card borders
800: #1e293b  ← Card backgrounds, inputs, tab bar
900: #0f172a    950: #020617
```

#### Semantic Colors

| Role | Hex | Usage |
|---|---|---|
| Success / Trust | `#10b981` | Trust badges, check-in confirmed, "Go Live" |
| Warning / Host | `#f59e0b` | Hosted badge, amber indicators |
| Error / Danger | `#ef4444` | Destructive actions, errors, logout |
| Info / Location | `#38bdf8` | Location links, map highlights |
| Hype / Indigo | `#6366f1` / `#818cf8` | Hype buttons, activity spinner, avatar circles |
| Purple | `#8b5cf6` | Check-ins stat, past activities |

### 3.2 Typography

| Element | Size | Weight | Color |
|---|---|---|---|
| App Brand "TRYBE" | 24px | Bold | `#ffffff` (Montserrat) |
| Screen Title (h1) | 28-32px | Bold | `#ffffff` |
| Section Title | 18-20px | Bold | `#ffffff` |
| Card Title | 20px | Bold | `#ffffff` |
| Body Text | 14-16px | Regular/500 | `#cbd5e1` or `#e2e8f0` |
| Muted / Subtitle | 13-14px | 500-600 | `#94a3b8` or `#64748b` |
| Tiny Labels | 11-12px | 600 | `#94a3b8` |
| Button Text | 13-18px | Bold/600 | `#ffffff` |

### 3.3 Spacing & Radius

- **Screen padding:** 16-24px horizontal
- **Card padding:** 20px
- **Card border-radius:** 12-16px
- **Button border-radius:** 8px (rectangular) or 20px (pill)
- **Input border-radius:** 8-12px
- **Card gap/margin-bottom:** 16px
- **Avatar size:** 32-36px (circle)

### 3.4 Elevation & Borders

- **Card border:** 1px `#334155`
- **Card background:** `rgba(30, 41, 59, 0.8)` (semi-transparent slate)
- **Shadow:** `#000`, offset (0, 2), opacity 0.25, radius 3.84
- **Divider lines:** 1px `#334155` or `#1e293b`

---

## 4. Screen Inventory & Specifications

The app has **4 main tabs** + **2 auth modals** + **1 top bar** + **1 bottom tab bar**.

---

### 4.1 Top Bar (`TopBar.tsx`)

**Always visible** at the top of every screen.

| Element | Details |
|---|---|
| Left | "TRYBE" wordmark in Montserrat Bold, `#ffffff` |
| Right | User avatar circle (36px). Photo if available, else initial letter on `#334155` background |
| Tap avatar | Dropdown with email + "Sign Out" (red `#ef4444` with `log-out-outline` icon) |
| Background | `#080e1f` with 1px bottom border `#1e293b` |

---

### 4.2 Bottom Tab Bar (`StatusBar.tsx`)

**Always visible** at the bottom. 4 tabs:

| Tab | Icon (Feather) | Active Color | Inactive Color |
|---|---|---|---|
| Feed | `align-center` | `#ffffff` (icon), `#3396ff` (text) | `grey` (icon), `#9ca3af` (text) |
| Map | `map-pin` | same | same |
| Activity | `aperture` | same | same |
| Profile | `user` | same | same |

- **Background:** `#1e293b`
- **Active indicator:** 2px top border `#3396ff`
- **Tab text:** 12px, weight 500/600

---

### 4.3 Feed Screen (`FeedScreen.tsx`)

The default landing screen. Scrollable vertical feed of activity cards.

#### Header Section

- **Title:** "The Feed" — 30px, bold, white, with -0.5 letter-spacing
- **Filter Toggle** (top-right of title row): Pill toggle with "All" / "Friends" buttons
  - Container: `#1e293b`, border-radius 8px, padding 2px
  - Active button: `#3396ff` background, white text
  - Inactive: transparent, `#64748b` text
- **Subtitle:** "See what the Trybe is up to." / "See what your friends are up to." — 14px, `#94a3b8`

#### Activity Card (`ActivityCard.tsx`)

Each card represents one live/upcoming activity:

```
┌─────────────────────────────────────────┐
│ [Avatar] HostName       [🟢 Trusted 72] │  ← header row
│                                         │
│ Activity Title (20px bold white)        │
│ 3 RSVPs (13px #64748b)                  │
│ 📍 Location Name, City (tappable blue) │
│ Optional description (14px #94a3b8)     │
│─────────────────────────────────────────│
│ 📅 Apr 26 • 3:00 PM    [🔥Hype] [Join] │  ← footer row
└─────────────────────────────────────────┘
```

**Card Details:**
- Background: `rgba(30, 41, 59, 0.8)`, 16px radius, 1px `#334155` border
- **Host row:** 32px avatar circle (`#6366f1`), host name in `#cbd5e1`
- **Trust badge:** Green-tinted chip — `rgba(16, 185, 129, 0.2)` bg, 1px `rgba(16, 185, 129, 0.3)` border, `#34d399` text
- **Location:** Tappable, `#38bdf8` text, jumps to Map tab
- **Footer divider:** 1px `#334155` top border
- **Hype button:** Pill outline — `rgba(99, 102, 241, 0.1)` bg, `rgba(99, 102, 241, 0.4)` border, `#818cf8` text. When hyped: `#475569` solid bg
- **Join button:** `#4f46e5` bg, white text. When joined: transparent with `#475569` border, `#94a3b8` text

#### States

- **Loading:** Centered `ActivityIndicator` with `#6366f1` color
- **Empty:** "No activities live right now." / "Time to host one yourself?" centered vertically
- **Pull-to-refresh:** `#6366f1` tint color

---

### 4.4 Map Screen (`MapScreen.tsx` + `RadarMap.tsx`)

Full-screen interactive map with activity markers.

- **Map Provider:** `react-native-maps` with CartoDB light tile layer
- **Tile URL:** `https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png`
- **Filter Overlay:** Same "All / Friends" pill toggle as Feed, positioned `top: 12, zIndex: 10`, centered
- **Markers:** Red pins on activity coordinates with title/description callouts
- **User Location:** Blue dot (native `showsUserLocation`)
- **Attribution:** "© OpenStreetMap, © CARTO" in white semi-transparent pill at bottom center
- **Zoom behavior:** When zoomed out beyond threshold (latDelta > 0.15), activities are cleared

---

### 4.5 Activity Screen (`ActivityScreen.tsx` + `CreateActivity.tsx`)

Activity creation form. Two modes:

#### Guest Mode (not logged in)

```
┌─────────────────────────────┐
│         🔥 (40px emoji)     │
│     Host an Activity        │
│  Got an idea for a run...   │
│   [ Log In to Host ]        │
└─────────────────────────────┘
```

- Centered vertically on `#080e1f` background
- Icon wrapper: 88px circle, `#1e293b` bg, 2px `#334155` border, shadow
- CTA: `#3396ff` bg, 12px radius, full width

#### Logged-In Mode — Form

Background: `#0F172A`, padding 24px

| Field | Type | Details |
|---|---|---|
| Activity Title | TextInput | `#1E293B` bg, `#E2E8F0` text, 12px radius, placeholder `#64748B` |
| Description | TextInput (multiline) | Same styling, 100px height |
| Exact Location | Interactive MapView | 200px height, 12px radius, blue pin (`#3B82F6`), draggable. Hint pill at bottom: "Hold and drag the pin to adjust" |
| Start Time | DateTimePicker trigger | Same input styling, shows formatted date |
| Visibility | 3-way toggle | "PUBLIC" / "FRIENDS" / "PRIVATE" — `#1E293B` bg, active = `#3B82F6` |

- **Labels:** Uppercase, 14px, `#94A3B8`, weight 600
- **Submit button:** "Create Activity" — `#10B981` bg, 18px bold white text, 12px radius
- **Loading:** `ActivityIndicator` replaces submit text

---

### 4.6 Profile Screen (`ProfileScreen.tsx`)

The most complex screen. Multiple sections in a ScrollView.

#### Guest Mode

```
┌──────────────────────────────┐
│  🛡️ (80px, #334155)         │
│     Join the Trybe           │
│  Sign up to track your...   │
│   [ Log In / Sign Up ]      │
└──────────────────────────────┘
```

#### Logged-In Mode

**Header Section:**
- Centered avatar with glow effect (64px circle, `#3396ff` border glow)
- Display name (22px bold white)
- Email (14px `#94a3b8`)
- "Joined {date}" with calendar icon (Feather `calendar`)

**Stats Grid (2x2):**

| Stat | Icon (Ionicons) | Color |
|---|---|---|
| Trust Score | `shield-checkmark-outline` | `#10b981` |
| Hosted | `flag-outline` | `#f59e0b` |
| Joined | `people-outline` | `#3b82f6` |
| Check-ins | `location-outline` | `#8b5cf6` |

- Each stat card: `#1e293b` bg, 12px radius, centered icon + value + label

**Hosted by Me Section:**
- Section header: Feather `flag` icon (`#f59e0b`) + title + count badge (`#422006` bg, `#f59e0b` text)
- Each activity row: left-side colored indicator (green if LIVE, amber if UPCOMING), title, time, status badge, action buttons
- Actions: "Go Live" (green), "End" (outlined), "Cancel" (red text)

**My RSVPs Section:**
- Section header: Feather `clock` icon (`#3396ff`) + title + count badge
- Each RSVP row: title, time, "Check In" button or "Checked In ✓" state, "Leave" button

**Past Activities Section:**
- Section header: Feather `archive` icon (`#8b5cf6`) + title + count badge (`#1e1b4b` bg, `#8b5cf6` text)
- Each past item: title, date, badge (HOSTED = amber, CHECKED IN = green, ENDED = purple)

**Friends Section:**
- Friend list with avatars, names, trust scores
- Search modal for finding users
- Incoming/outgoing friend request management
- "Add Friend" button

**Footer:**
- Logout button with Feather `log-out` icon, `#ef4444` color

---

### 4.7 Login Screen (`LoginScreen.tsx`)

Presented as a modal sheet (`presentationStyle="pageSheet"`, slide animation).

```
┌──────────────────────────────────┐
│                            [✕]   │  ← close button (Ionicons "close", #94a3b8)
│                                  │
│          Welcome                 │  ← 32px bold white
│      Sign in to continue         │  ← 16px #9ca3af
│                                  │
│  ┌───────────────────────────┐   │
│  │ Email                     │   │  ← #1e293b bg, #334155 border
│  └───────────────────────────┘   │
│  ┌───────────────────────────┐   │
│  │ Password                  │   │
│  └───────────────────────────┘   │
│                Forgot Password?  │  ← #007aff text, right-aligned
│                                  │
│  ┌───────────────────────────┐   │
│  │         Login             │   │  ← #007aff bg, 8px radius
│  └───────────────────────────┘   │
│                                  │
│   Don't have an account? Sign Up │  ← #9ca3af + #007aff link
└──────────────────────────────────┘
```

- **Error banner:** `#fef2f2` bg, `#ef4444` border/text
- **Input validation errors:** `#ef4444` text below inputs

**Forgot Password sub-screen:** Same layout, title "Reset Password", single email field, "Send Reset Link" button, "Back to Login" link.

---

### 4.8 Signup Screen (`SignupScreen.tsx`)

Same modal context as Login.

```
┌──────────────────────────────────┐
│                            [✕]   │
│                                  │
│       Create Account             │
│     Sign up to get started       │
│                                  │
│  [ Email                     ]   │
│  [ Password                  ]   │
│  [ Confirm Password          ]   │
│                                  │
│  [         Sign Up           ]   │  ← #007aff bg
│                                  │
│  Already have an account? Sign In│
└──────────────────────────────────┘
```

---

## 5. Component Hierarchy

```
App.tsx
├── AuthProvider (context)
│   └── MainApp
│       ├── SafeAreaProvider
│       │   └── SafeAreaView (edges=["top"])
│       │       ├── TopBar
│       │       ├── Screen Container (flex: 1)
│       │       │   ├── FeedScreen
│       │       │   │   └── ActivityCard[] (FlatList)
│       │       │   ├── MapScreen
│       │       │   │   └── RadarMap
│       │       │   ├── ActivityScreen
│       │       │   │   └── CreateActivity
│       │       │   └── ProfileScreen
│       │       └── StatusBar (bottom tabs)
│       └── Modal (auth)
│           ├── LoginScreen
│           └── SignupScreen
```

---

## 6. User Flows for Stitch

### Flow 1: New User Onboarding
1. **Feed Screen (guest)** → User sees activity cards, taps "Join"
2. **Auth Modal slides up** → Login screen
3. User taps "Sign Up" → Signup screen
4. After signup → Modal closes, Feed reloads with auth context
5. User taps "Profile" tab → Full profile with 0 stats

### Flow 2: Hosting an Activity
1. **Activity Tab** → Create Activity form
2. User fills title, description, drags map pin
3. Sets time via DateTimePicker, selects visibility
4. Taps "Create Activity" → Success alert
5. **Profile Tab** → New activity appears in "Hosted by Me"
6. Host taps "Go Live" → Activity status changes to LIVE
7. Host taps "End" → Activity moves to "Past Activities"

### Flow 3: Joining & Checking In
1. **Feed** → User taps "Join" on a card → Button becomes "Joined ✓"
2. **Profile > My RSVPs** → Activity appears with "Check In" button
3. When activity is LIVE, user taps "Check In" → GPS verification → "Checked In ✓"
4. Trust Score increments

### Flow 4: Social / Friends
1. **Profile > Friends** → User taps search icon
2. Search modal → Types name → Results appear
3. Taps "Add" → Friend request sent
4. Other user sees incoming request → Accepts
5. Both can now filter Feed/Map to "Friends" only

---

## 7. Stitch Prompt Templates

Use these prompts to generate each screen in Google Stitch:

### Master Context Prompt (prefix to every screen)

```
Design a mobile app screen for "Trybe", a campus social app for discovering
and joining real-world activities. The design should be dark-themed with a
deep navy background (#080e1f), using a modern, premium aesthetic with
glassmorphic card elements. The color palette uses electric blue (#3396ff)
for accents, emerald (#10b981) for trust/success, amber (#f59e0b) for
hosting, and indigo (#6366f1 / #4f46e5) for action buttons. Typography is
clean and bold. Target audience: Gen-Z university students. Mobile-first
(portrait, ~390px width).
```

### Screen-Specific Prompts

**Feed Screen:**
```
A scrollable feed of activity cards. Top has "The Feed" title (30px bold)
with a segmented "All / Friends" pill toggle. Each card shows: host avatar
+ name, trust badge, activity title, RSVP count, tappable location with
pin emoji, optional description, date/time footer with "Hype" and "Join"
pill buttons. Cards have semi-transparent slate backgrounds with subtle
borders. Dark navy (#080e1f) screen background.
```

**Map Screen:**
```
Full-screen light-themed map (CartoDB style tiles) with red activity
markers. A floating "All / Friends" segmented toggle at top center.
Bottom attribution bar. No search bar. Clean and minimal.
```

**Create Activity:**
```
A form screen titled "Host an Activity" on dark navy background. Fields:
Activity Title input, Description textarea, interactive map picker (200px)
with a draggable blue pin and hint text, date/time picker, 3-way
visibility toggle (PUBLIC/FRIENDS/PRIVATE), and a green "Create Activity"
submit button. Labels are uppercase slate-gray.
```

**Profile Screen:**
```
Scrollable profile page. Centered avatar with glow, display name, email,
join date. 2x2 stats grid (Trust Score green, Hosted amber, Joined blue,
Check-ins purple). Sections: "Hosted by Me" with live/upcoming activity
rows and action buttons, "My RSVPs" with check-in buttons, "Past
Activities" with status badges, "Friends" list. Logout at bottom in red.
```

**Login Modal:**
```
Centered login form on dark navy background. "Welcome" title, "Sign in to
continue" subtitle. Email and password inputs with dark slate backgrounds
and subtle borders. "Forgot Password?" link in blue. Full-width blue login
button. Footer: "Don't have an account? Sign Up" with blue link.
```

**Signup Modal:**
```
Centered signup form on dark navy background. "Create Account" title.
Email, Password, and Confirm Password inputs. Full-width blue "Sign Up"
button. Footer: "Already have an account? Sign In" with blue link.
```

---

## 8. Export Guidelines for Stitch → Code

When exporting from Stitch to code for integration:

1. **Export as React/Tailwind** — This aligns with the NativeWind setup in `tailwind.config.js`
2. **Map Stitch colors** to the Tailwind theme tokens defined in `tailwind.config.js` (e.g., `primary-950`, `accent-400`, `neutral-800`)
3. **Replace web elements** with React Native equivalents:
   - `<div>` → `<View>`
   - `<p>`, `<span>` → `<Text>`
   - `<button>` → `<TouchableOpacity>`
   - `<img>` → `<Image>`
   - `<input>` → `<TextInput>`
4. **Icon mapping:** Use `@expo/vector-icons` (Ionicons, Feather) instead of SVGs
5. **Fonts:** Use `@expo-google-fonts/montserrat` for the TRYBE wordmark; system font for everything else
6. **No web-specific CSS:** Avoid `hover:`, `cursor:`, `position: fixed`, etc.

---

## 9. Assets & Resources

| Resource | Location |
|---|---|
| App Icon | `assets/icon.png` |
| Adaptive Icon | `assets/adaptive-icon.png` |
| Splash Screen | `assets/splash.png` |
| Favicon (web) | `assets/favicon.png` |
| Tailwind Config | `tailwind.config.js` |
| Firebase Config | `lib/firebase.ts` |
| API Client | `lib/api.ts` |
| Auth Context | `lib/auth/AuthContext.tsx` |

---

## 10. Design Priorities for Redesign

If using Stitch to redesign/upgrade the Trybe UI, focus on:

1. **Visual Hierarchy:** Make Trust Score and host reputation more prominent on cards
2. **Micro-animations:** Add subtle transitions for card appearances, button state changes, and tab switching
3. **Map Experience:** Consider custom styled markers instead of default red pins; activity type icons on markers
4. **Onboarding:** Design a proper first-launch onboarding flow (3-4 slides explaining Trybe)
5. **Activity Detail:** Currently missing — design a full-screen activity detail view when tapping a card
6. **Notifications:** Design a notification bell in the TopBar with friend requests and activity alerts
7. **Profile Enhancement:** Add an editable profile with avatar upload, bio, and interest tags
8. **Dark Mode Polish:** Current theme is dark-only; refine with better contrast ratios and glassmorphism depth
9. **Empty States:** Make empty states more engaging with illustrations or animations
10. **Accessibility:** Ensure sufficient contrast ratios (WCAG AA minimum) across all text/background combinations
