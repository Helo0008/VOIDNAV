import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { EarthScene } from '../components/EarthScene';
import { ORBITS, ORBIT_ORDER } from '../data/orbits';
import { useProgress } from '../hooks/useProgress';
import { Rocket, ChevronRight, Target, Globe, Zap, Satellite } from 'lucide-react';
import { toast } from 'sonner';

// Mission parameters for recommendation
const MISSION_TYPES = [
  { id: 'imaging', label: 'Earth Observation', desc: 'High-res imaging, environmental monitoring', icon: Globe, color: '#00FF94' },
  { id: 'comms', label: 'Communications', desc: 'TV, internet, phone relay', icon: Zap, color: '#FFD700' },
  { id: 'nav', label: 'Navigation', desc: 'GPS positioning, timing services', icon: Target, color: '#00F0FF' },
  { id: 'science', label: 'Space Science', desc: 'Telescope, space physics, astronomy', icon: Satellite, color: '#E879F9' },
];

const COVERAGE_OPTIONS = [
  { id: 'equatorial', label: 'Equatorial (tropical regions)' },
  { id: 'midlat', label: 'Mid-latitudes (Europe, US, China)' },
  { id: 'polar', label: 'Polar / Arctic regions' },
  { id: 'global', label: 'Full global coverage' },
];

const LATENCY_OPTIONS = [
  { id: 'realtime', label: 'Real-time (<100ms)' },
  { id: 'standard', label: 'Standard (<1 second)' },
  { id: 'none', label: 'No latency requirement' },
];

const DWELL_OPTIONS = [
  { id: 'brief', label: 'Brief pass is OK (minutes/day)' },
  { id: 'extended', label: 'Need extended coverage (hours/day)' },
  { id: 'continuous', label: 'Continuous 24/7 coverage' },
];

// Scoring matrix: orbit → { missionType, coverage, latency, dwell } → score 1–5
const SCORES = {
  leo:      { imaging:5, comms:2, nav:2, science:4, equatorial:3, midlat:4, polar:3, global:4, realtime:5, standard:4, none:3, brief:5, extended:2, continuous:1 },
  polar:    { imaging:5, comms:1, nav:1, science:4, equatorial:2, midlat:4, polar:5, global:5, realtime:4, standard:4, none:3, brief:4, extended:3, continuous:2 },
  geo:      { imaging:2, comms:5, nav:3, science:1, equatorial:5, midlat:3, polar:1, global:3, realtime:1, standard:3, none:5, brief:1, extended:5, continuous:5 },
  sso:      { imaging:5, comms:1, nav:1, science:5, equatorial:3, midlat:4, polar:4, global:4, realtime:4, standard:4, none:3, brief:4, extended:3, continuous:2 },
  meo:      { imaging:1, comms:3, nav:5, science:2, equatorial:3, midlat:4, polar:3, global:5, realtime:3, standard:4, none:4, brief:3, extended:4, continuous:4 },
  heo:      { imaging:2, comms:2, nav:1, science:5, equatorial:2, midlat:3, polar:4, global:2, realtime:2, standard:3, none:5, brief:1, extended:5, continuous:2 },
  molniya:  { imaging:1, comms:4, nav:1, science:2, equatorial:1, midlat:3, polar:5, global:3, realtime:2, standard:3, none:4, brief:1, extended:5, continuous:3 },
  tundra:   { imaging:1, comms:4, nav:2, science:2, equatorial:1, midlat:2, polar:5, global:3, realtime:2, standard:3, none:4, brief:1, extended:5, continuous:3 },
  graveyard:{ imaging:1, comms:1, nav:1, science:1, equatorial:1, midlat:1, polar:1, global:1, realtime:1, standard:1, none:1, brief:1, extended:1, continuous:1 },
  hohmann:  { imaging:1, comms:1, nav:1, science:3, equatorial:2, midlat:2, polar:2, global:2, realtime:1, standard:2, none:3, brief:2, extended:3, continuous:1 },
  lagrange: { imaging:1, comms:2, nav:1, science:5, equatorial:2, midlat:2, polar:2, global:3, realtime:1, standard:2, none:5, brief:1, extended:5, continuous:3 },
};

function scoreOrbit(id, { type, coverage, latency, dwell }) {
  const s = SCORES[id];
  if (!s) return 0;
  return (s[type] || 0) + (s[coverage] || 0) + (s[latency] || 0) + (s[dwell] || 0);
}

const EXPLANATIONS = {
  leo: (params) => `LEO is the workhorse orbit for your mission. Its low altitude enables ${params.type === 'imaging' ? 'high-resolution Earth imaging' : 'fast signal response'} with short orbital periods. A constellation of satellites can achieve your coverage requirements.`,
  polar: (params) => `Polar orbit is ideal for complete ${params.coverage === 'polar' ? 'Arctic/Antarctic' : 'global'} coverage. As Earth rotates, successive passes cover every latitude — perfect for systematic Earth observation.`,
  geo: (params) => `Geostationary orbit appears stationary from the ground — ideal for ${params.type === 'comms' ? 'broadcast communications and TV' : 'fixed-point monitoring'}. One satellite covers ~40% of Earth\'s surface continuously.`,
  sso: (params) => `Sun-synchronous orbit ensures consistent lighting for every pass — ideal for comparing images over time. Landsat and Sentinel use this orbit for Earth observation.`,
  meo: (params) => `Medium Earth Orbit is the home of navigation systems like GPS, Galileo, and GLONASS. Multiple satellites provide global positioning coverage with excellent geometric diversity.`,
  heo: (params) => `Highly Elliptical Orbit lets your spacecraft escape Earth's radiation belts for extended science observations at apogee. Space telescopes like Chandra use this for clean observation windows.`,
  molniya: (params) => `The Molniya orbit was engineered to serve high-latitude Russia where GEO signals are too weak. Its 8-hour apogee dwell over northern regions makes it ideal for polar/Arctic communications.`,
  tundra: (params) => `The Tundra orbit is a geosynchronous HEO providing extended coverage of high-latitude regions daily. Japan's QZSS uses a similar orbit to provide GPS augmentation over mountainous terrain.`,
  lagrange: (params) => `Lagrange points offer stable gravitational equilibria. L2 (behind Earth) is used by space telescopes like Webb for an unobstructed, thermally stable view of the universe.`,
};

function MissionBuilder({ onRecommend }) {
  const [step, setStep] = useState(0);
  const [params, setParams] = useState({ type: '', coverage: '', latency: '', dwell: '' });

  const steps = [
    {
      title: 'Mission Type',
      key: 'type',
      options: MISSION_TYPES,
      renderOption: ({ id, label, desc, icon: Icon, color }) => (
        <div key={id} onClick={() => setParams(p => ({ ...p, type: id }))}
          className="cursor-pointer p-4 rounded-xl flex items-start gap-4"
          style={{ background: params.type === id ? `${color}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${params.type === id ? color + '60' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.2s' }}
          data-testid={`mission-type-${id}`}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={20} color={color} />
          </div>
          <div>
            <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 16, color: params.type === id ? color : '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{desc}</div>
          </div>
          {params.type === id && <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 6, boxShadow: `0 0 8px ${color}` }} />}
        </div>
      ),
    },
    {
      title: 'Coverage Region',
      key: 'coverage',
      options: COVERAGE_OPTIONS,
      renderOption: ({ id, label }) => (
        <div key={id} onClick={() => setParams(p => ({ ...p, coverage: id }))}
          className="cursor-pointer p-4 rounded-xl"
          style={{ background: params.coverage === id ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${params.coverage === id ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.2s' }}
          data-testid={`coverage-${id}`}>
          <div style={{ fontFamily: 'Outfit', fontSize: 15, color: params.coverage === id ? '#00F0FF' : 'rgba(255,255,255,0.7)' }}>{label}</div>
        </div>
      ),
    },
    {
      title: 'Latency Requirements',
      key: 'latency',
      options: LATENCY_OPTIONS,
      renderOption: ({ id, label }) => (
        <div key={id} onClick={() => setParams(p => ({ ...p, latency: id }))}
          className="cursor-pointer p-4 rounded-xl"
          style={{ background: params.latency === id ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${params.latency === id ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.2s' }}
          data-testid={`latency-${id}`}>
          <div style={{ fontFamily: 'Outfit', fontSize: 15, color: params.latency === id ? '#00F0FF' : 'rgba(255,255,255,0.7)' }}>{label}</div>
        </div>
      ),
    },
    {
      title: 'Dwell Requirements',
      key: 'dwell',
      options: DWELL_OPTIONS,
      renderOption: ({ id, label }) => (
        <div key={id} onClick={() => setParams(p => ({ ...p, dwell: id }))}
          className="cursor-pointer p-4 rounded-xl"
          style={{ background: params.dwell === id ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${params.dwell === id ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.2s' }}
          data-testid={`dwell-${id}`}>
          <div style={{ fontFamily: 'Outfit', fontSize: 15, color: params.dwell === id ? '#00F0FF' : 'rgba(255,255,255,0.7)' }}>{label}</div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const currentValue = params[currentStep.key];
  const canProceed = !!currentValue;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      // Compute recommendations
      const scored = ORBIT_ORDER
        .filter(id => id !== 'graveyard')
        .map(id => ({ id, score: scoreOrbit(id, params) }))
        .sort((a, b) => b.score - a.score);
      onRecommend({ params, ranked: scored.slice(0, 3) });
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? '#00F0FF' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
        ))}
      </div>

      <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#00F0FF', letterSpacing: '0.2em', marginBottom: 8 }}>
        STEP {step + 1} / {steps.length}
      </p>
      <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 28, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
        {currentStep.title}
      </h2>

      <div className="flex flex-col gap-3 mb-6">
        {currentStep.options.map(opt => currentStep.renderOption(opt))}
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            style={{ padding: '10px 24px', borderRadius: 8, fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', cursor: 'pointer' }}>
            Back
          </button>
        )}
        <button onClick={handleNext} disabled={!canProceed}
          data-testid="next-step-sandbox"
          style={{ flex: 1, padding: '12px 24px', borderRadius: 8, fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.12em', color: canProceed ? '#000' : 'rgba(255,255,255,0.2)', background: canProceed ? '#00F0FF' : 'rgba(255,255,255,0.05)', border: 'none', cursor: canProceed ? 'pointer' : 'not-allowed', transition: 'background 0.2s, color 0.2s', boxShadow: canProceed ? '0 0 24px rgba(0,240,255,0.3)' : 'none' }}>
          {step < steps.length - 1 ? 'Next' : 'Launch Analysis'} <ChevronRight size={14} style={{ display: 'inline' }} />
        </button>
      </div>
    </div>
  );
}

function RecommendationView({ result, onReset }) {
  const navigate = useNavigate();
  const { isOrbitUnlocked } = useProgress();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const top = result.ranked[selectedIdx];
  const orbit = ORBITS[top?.id];
  const maxScore = 20; // max possible score (4 params × 5 points)

  if (!orbit) return null;

  return (
    <div className="flex gap-8 flex-wrap">
      {/* Left: Result */}
      <div style={{ flex: '1 1 400px' }}>
        <div className="mb-6 animate-fadeIn">
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#00FF94', letterSpacing: '0.2em', marginBottom: 8 }}>MISSION ANALYSIS COMPLETE</p>
          <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 42px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1 }}>
            Recommended<br />Orbit
          </h2>
        </div>

        {/* Top 3 */}
        <div className="flex flex-col gap-3 mb-6">
          {result.ranked.map(({ id, score }, i) => {
            const o = ORBITS[id];
            const pct = Math.round((score / maxScore) * 100);
            const isSelected = i === selectedIdx;
            return (
              <div key={id} onClick={() => setSelectedIdx(i)}
                className="cursor-pointer p-4 rounded-xl"
                style={{ background: isSelected ? `${o.color}10` : 'rgba(255,255,255,0.02)', border: `1px solid ${isSelected ? o.color + '40' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.2s' }}
                data-testid={`recommendation-${id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>#{i + 1}</span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: o.color }} />
                    <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 16, color: isSelected ? o.color : '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{o.shortName} — {o.name}</span>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: o.color }}>{pct}%</span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: o.color, borderRadius: 2, transition: 'width 0.6s' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        {orbit && (
          <div className="animate-fadeIn p-5 rounded-xl mb-6" style={{ background: `${orbit.color}08`, border: `1px solid ${orbit.color}20` }}>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: 8 }}>WHY THIS ORBIT?</p>
            <p style={{ fontFamily: 'Outfit', fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
              {EXPLANATIONS[top.id]?.(result.params) || orbit.tagline}
            </p>
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <button onClick={onReset}
            style={{ padding: '10px 24px', borderRadius: 8, fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', cursor: 'pointer' }}>
            New Mission
          </button>
          <button onClick={() => navigate(`/learn/${top.id}`)}
            style={{ padding: '10px 28px', borderRadius: 8, fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#000', background: orbit.color, border: 'none', cursor: 'pointer', boxShadow: `0 0 20px ${orbit.color}40` }}
            data-testid="learn-recommended-orbit">
            Learn {orbit.shortName}
          </button>
        </div>
      </div>

      {/* Right: 3D Visualization */}
      <div style={{ flex: '1 1 340px', height: 420, borderRadius: 16, overflow: 'hidden', border: `1px solid ${orbit.color}25` }}>
        <EarthScene
          activeOrbits={[orbit]}
          selectedOrbit={orbit}
          height="100%"
          showLabels={true}
          cameraPosition={[0, orbit.semiMajor * 0.8, orbit.semiMajor * 2.4]}
        />
      </div>
    </div>
  );
}

export default function Sandbox() {
  const [result, setResult] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: '#030305' }}>
      <Navigation />
      <div style={{ paddingTop: '80px', padding: '80px 6% 60px' }} className="grid-bg">
        <div style={{ maxWidth: 1100 }}>
          {/* Header */}
          <div className="mb-10">
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#00F0FF', letterSpacing: '0.2em', marginBottom: 8 }}>MISSION DESIGN</p>
            <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 'clamp(40px, 6vw, 72px)', color: '#fff', textTransform: 'uppercase', lineHeight: 0.92 }}>
              Launch Your<br />
              <span style={{ color: '#00F0FF', textShadow: '0 0 40px rgba(0,240,255,0.4)' }}>Satellite</span>
            </h1>
            <p style={{ fontFamily: 'Outfit', fontSize: 16, color: 'rgba(255,255,255,0.5)', marginTop: 16, maxWidth: 520, lineHeight: 1.6 }}>
              Tell us your mission requirements. Our orbital mechanics engine will recommend the ideal orbit type — just like real satellite engineers do.
            </p>
          </div>

          {result
            ? <RecommendationView result={result} onReset={() => setResult(null)} />
            : <MissionBuilder onRecommend={setResult} />
          }
        </div>
      </div>
    </div>
  );
}
