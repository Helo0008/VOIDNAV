# VOID NAVIGATOR — Space Orbit Educational App
## PRD (Product Requirements Document)

### Last Updated: 2026-02-19

---

## Problem Statement
Build an interactive website that helps teach all different types of space orbits and teaches orbital mechanics in a fun, interactive 4D model.

---

## User Personas
- **Students / Intermediate learners** interested in orbital mechanics and space science
- Age range: High school to university level
- Motivation: Learn space science through hands-on interaction
- Background: Basic physics knowledge, curious about how satellites work

---

## User Choices / Design
- Target: Students / intermediate (educational depth)
- Cover ALL orbit types plus more
- All learning styles: gamified, guided lessons, free exploration
- As realistic as possible with dark space theme
- Interactive around Earth

---

## Architecture

### Frontend (React)
- **App.js** — React Router with 5 routes (/, /learn, /explore, /quiz, /dashboard)
- **pages/Home.jsx** — Hero landing with full-screen 3D Earth + orbit showcase
- **pages/Learn.jsx** — Step-by-step guided lessons per orbit type
- **pages/Explore.jsx** — Free exploration with real-time orbit builder
- **pages/Quiz.jsx** — Gamified quiz with XP/unlock system
- **pages/Dashboard.jsx** — Progress tracking / Mission Log
- **components/Navigation.jsx** — Fixed navbar with XP display
- **components/EarthScene.jsx** — React Three Fiber + Three.js 3D Earth
- **data/orbits.js** — 11 orbit types with full educational content
- **data/quizData.js** — 55 quiz questions (5 per orbit type)
- **hooks/useProgress.js** — localStorage-based user progress

### Backend (FastAPI)
- **server.py** — Orbit data API, user progress persistence, quiz endpoints
- MongoDB for progress storage (optional - frontend uses localStorage primary)

### 3D Visualization
- React Three Fiber (R3F) v9.5.0
- Three.js v0.183.0
- Three.js OrbitControls (direct import, bypasses drei)
- Custom implementation (no drei components) to avoid React 19 compatibility issues

---

## Orbit Types Implemented
1. **LEO** — Low Earth Orbit (160–2,000 km) — Unlocked by default
2. **Polar** — Polar Orbit (90° inclination) — Unlocked by default
3. **GEO** — Geostationary Orbit (35,786 km) — Unlocked by default
4. **SSO** — Sun-Synchronous Orbit — Unlocked at 100 XP
5. **MEO** — Medium Earth Orbit (GPS) — Unlocked at 100 XP
6. **HEO** — Highly Elliptical Orbit — Unlocked at 250 XP
7. **Molniya** — Russian HEO communications — Unlocked at 250 XP
8. **Tundra** — Geosynchronous HEO — Unlocked at 450 XP
9. **Graveyard** — Cemetery orbit above GEO — Unlocked at 450 XP
10. **Hohmann** — Transfer orbit maneuver — Unlocked at 700 XP
11. **Lagrange** — Earth-Sun L-points — Unlocked at 1000 XP

---

## What's Been Implemented (v1.0)
*Date: 2026-02-19*

### Core Features ✅
- [x] Full-screen 3D Earth with orbit lines and animated satellites
- [x] Real-time starfield (4,000 stars)
- [x] Earth texture loading from CDN with blue sphere fallback
- [x] Orbit controls (drag to rotate, scroll to zoom)
- [x] Dark space theme (Rajdhani/Outfit/JetBrains Mono fonts)
- [x] HUD-style panels with corner brackets
- [x] Responsive navigation with XP counter

### Learning System ✅
- [x] 11 orbit types with 4-5 step lessons each
- [x] Step-by-step lesson navigation (Prev/Next)
- [x] Orbital parameter info panel (altitude, period, velocity, inclination)
- [x] Real-world examples for each orbit
- [x] +50 XP awarded for lesson completion

### Quiz System ✅
- [x] 55 quiz questions (5 per orbit type)
- [x] Easy/Medium/Hard difficulty levels (20/25/30 XP per question)
- [x] Multiple choice with A/B/C/D options
- [x] Green/Red answer feedback
- [x] Explanation shown after each answer
- [x] Score tracking and best score persistence
- [x] Quiz results screen with accuracy %

### Gamification ✅
- [x] XP point system
- [x] Orbit unlock thresholds (100/250/450/700/1000 XP)
- [x] Achievement system (First Hundred, Halfway There, Orbital Master)
- [x] Progress bars per orbit (lesson + quiz)
- [x] Mission Log (Dashboard) with orbit library

### Exploration Mode ✅
- [x] Real-time orbit builder with 4 sliders
- [x] Semi-major axis, eccentricity, inclination, RAAN controls
- [x] Computed orbital data display (type, period, perigee/apogee)
- [x] 11 orbit presets (locked/unlocked based on XP)
- [x] 7 orbit color choices

---

## Prioritized Backlog

### P0 (Critical - Not Done)
- Nothing blocking

### P1 (High Priority)
- [ ] Earth day/night texture with city lights on dark side
- [ ] Orbit labels (hover to show orbit name in 3D scene)
- [ ] Camera auto-focus on selected orbit (smooth transition)
- [ ] Sound effects for quiz correct/incorrect answers
- [ ] Mobile responsive 3D layout

### P2 (Medium Priority)
- [ ] Hohmann transfer animation (showing two-burn maneuver)
- [ ] Lagrange points visualization (5 L-point markers)
- [ ] Orbital decay simulation for LEO
- [ ] Satellite comparison mode (two orbits side by side)
- [ ] Share quiz results to social media
- [ ] Backend progress sync (vs. localStorage only)

### P3 (Nice to Have)
- [ ] Constellation mode (show GPS constellation of 31 satellites)
- [ ] Space debris visualization
- [ ] Historical missions timeline
- [ ] 3D orbit comparison overlay
- [ ] Interactive Kepler's Laws demonstrations

---

## Next Tasks
1. Add Earth texture with better lighting (day/night terminator)
2. Add orbit labels in 3D scene
3. Camera smooth transitions when switching orbits in Learn page
4. Mobile layout optimization
5. Backend progress persistence (replacing/augmenting localStorage)
