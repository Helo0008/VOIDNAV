# The Void Navigator - Space Orbits Educational Platform

## Original Problem Statement
Build an interactive website that helps teach different types of space orbits using a fun, interactive 4D model. Target audience: students with intermediate knowledge. Features include gamified learning with quizzes/points, guided lessons with animations, free exploration mode, and a realistic dark space theme.

## Tech Stack
- **Frontend:** React, TailwindCSS, react-three-fiber (3D), three.js, drei, Shadcn UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB (minimal - progress in localStorage)

## Architecture
```
frontend/src/
├── components/
│   ├── EarthScene.jsx    # 3D scene: orbits, satellites, Hohmann animation, force vectors, Lagrange points
│   ├── Navigation.jsx    # 7 nav items: Learn, Explore, Sandbox, Challenge, Quiz, Mission Log
│   └── ui/               # Shadcn components
├── pages/
│   ├── Home.jsx          # Landing with 3D hero
│   ├── Learn.jsx         # Guided lessons + force vectors + free-fall explanation + compact HUD
│   ├── Explore.jsx       # Orbit builder + compare + Hohmann + GPS + progressive UI
│   ├── Sandbox.jsx       # Mission-based orbit recommender
│   ├── CatchUpChallenge.jsx  # Orbital rendezvous puzzle with improved UI/instructions
│   ├── Quiz.jsx          # Gamified quizzes per orbit type + Back to Learn button
│   └── Dashboard.jsx     # Progress tracking
├── data/orbits.js        # 11 orbit types + unlock thresholds
└── hooks/useProgress.js  # XP, unlocks, localStorage
```

## Implemented Features

### Phase 1 — Core Build
- 3D Earth scene, 11 orbit types, guided lessons, quiz system, XP + progress tracking

### Phase 2 — Animation Polish
- Gradient trails (vertex colors), satellite glow sprites, Kepler's 2nd law speed variation
- Smooth one-shot camera transitions, GPS constellation toggle, orbit labels

### Phase 3 — Camera + Satellite + Comparison
- Camera no longer snaps back (one-shot transitions only, maxDistance=80)
- 3D satellite models (body + solar panels, oriented along orbit tangent)
- Multi-orbit comparison (overlay chips), static Hohmann display
- All 11 orbits unlocked for testing

### Phase 4 — Educational Fundamentals (Feb 2026)
- **Animated Hohmann Transfer:** Satellite actually transfers LEO→burn→transfer coast→burn→GEO with delta-V indicators (+2.46 km/s, +1.47 km/s) and live phase timeline
- **Orbital Catch-Up Puzzle:** Counter-intuitive rendezvous challenge — player must learn to decelerate to catch a target satellite (prograde raises orbit = slower, retrograde lowers = faster)
- **Force Vectors + Free-Fall Explanation:** Toggle on Learn page shows gravity (red arrow) + velocity (blue arrow) with explanation: "The satellite IS falling — but it moves sideways fast enough that Earth's surface curves away"
- **Progressive UI:** Explore shows only 3 core parameters (semi-major axis, eccentricity, inclination) with Advanced Telemetry toggle for RAAN/Speed

### Phase 5 — Bug Fixes & Polish (Feb 2026)
- **Lagrange Points Visualization:** L-Points lesson now shows proper Sun-Earth system with all 5 Lagrange points (L1-L5) labeled, Sun with glow, Earth's orbit around Sun, pulsing markers
- **Compact Learn HUD:** Reduced orbit info panel to ~54px height showing only essential info (orbit name, altitude, velocity) to avoid obstructing the 3D view
- **Molniya Orbit Fix:** Corrected orbital parameters (semiMajor: 5.5, eccentricity: 0.6) so perigee (2.2 units) is outside Earth's surface (2.0 units)
- **Quiz Navigation:** Added "Back to Learn" button always visible at top of Quiz page
- **Challenge Page Improvements:** Added initial help overlay, comprehensive instructions, hints for each phase, detailed telemetry (gap %, speed differential, altitudes), clearer button labels

## Upcoming (P1)
- **Camera Lock/Follow Mode:** Allow camera to lock onto and follow specific satellites or orbits
- Kepler's 2nd law visual emphasis (area sweep visualization)
- Orbit transfer path planning (user-selectable start/end orbits for Hohmann)
- Progressive lesson unlocking tied to quiz mastery

## Backlog (P2)
- Re-enable XP unlock gates for production
- User auth + backend persistence
- Leaderboard, sound effects, mobile touch optimization
- Argument of periapsis parameter in advanced mode
