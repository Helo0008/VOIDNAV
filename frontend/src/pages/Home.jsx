import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { EarthScene } from '../components/EarthScene';
import { ORBITS, ORBIT_ORDER } from '../data/orbits';
import { useProgress } from '../hooks/useProgress';
import { ChevronRight, Zap, BookOpen, Globe, Brain } from 'lucide-react';

const allOrbits = ORBIT_ORDER.map(id => ORBITS[id]);

const TICKER_DATA = [
  'ISS: 400 km | 92 min | 7.66 km/s',
  'GPS Block III: 20,200 km | 12 hr | 3.87 km/s',
  'GOES-18: 35,786 km | 24 hr | 3.07 km/s',
  'Starlink: 550 km | 95 min | 7.6 km/s',
  'Hubble: 540 km | 95 min | 7.59 km/s',
  'JWST: L2 | 1.5M km from Earth | 1 yr orbit',
];

const features = [
  { icon: BookOpen, title: 'Guided Lessons', desc: '11 orbit types with step-by-step lessons. Learn LEO to Lagrange Points with 3D visualization.', color: '#00F0FF', to: '/learn' },
  { icon: Globe, title: 'Free Exploration', desc: 'Build your own orbit. Adjust parameters in real-time and see exactly how orbital mechanics responds.', color: '#00FF94', to: '/explore' },
  { icon: Brain, title: 'Mission Quizzes', desc: 'Test your knowledge, earn XP, and unlock advanced orbit types. Gamified orbital mechanics.', color: '#FFD700', to: '/quiz' },
  { icon: Zap, title: 'Mission Log', desc: 'Track your progress, view unlocked orbits, and see your XP accumulate toward mastery.', color: '#E879F9', to: '/dashboard' },
];

export default function Home() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const [tickerIdx, setTickerIdx] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const t = setInterval(() => setTickerIdx(i => (i + 1) % TICKER_DATA.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#030305' }}>
      <Navigation />

      {/* Hero Section */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        {/* 3D Earth Background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <EarthScene
            activeOrbits={allOrbits.slice(0, 7)}
            interactive={false}
            height="100%"
            cameraPosition={[0, 3, 13]}
          />
        </div>

        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(3,3,5,0.3) 0%, rgba(3,3,5,0.1) 40%, rgba(3,3,5,0.7) 80%, #030305 100%)' }} />

        {/* Hero Content */}
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '6%', paddingTop: '64px' }}
          className={visible ? 'animate-fadeInUp' : ''}
        >
          <div style={{ maxWidth: '660px' }}>
            <div
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.25)', fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#00F0FF', letterSpacing: '0.15em' }}
              data-testid="hero-badge"
            >
              ORBITAL MECHANICS LAB
            </div>

            <h1
              data-testid="hero-title"
              style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(48px, 7vw, 96px)', lineHeight: 0.9, textTransform: 'uppercase', color: '#fff', letterSpacing: '-0.02em', marginBottom: '24px' }}
            >
              ORBIT<br />
              <span style={{ color: '#00F0FF', textShadow: '0 0 40px rgba(0,240,255,0.5)' }}>OPS</span>
            </h1>

            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: '40px', maxWidth: '500px' }}>
              Master orbital mechanics through interactive 3D visualization. From LEO to Lagrange Points — explore all orbit types in stunning detail.
            </p>

            <div className="flex flex-wrap gap-4" data-testid="hero-ctas">
              <button
                className="btn-primary rounded-lg text-sm"
                onClick={() => navigate('/learn')}
                data-testid="start-learning-btn"
                style={{ padding: '14px 36px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '0.15em', textTransform: 'uppercase' }}
              >
                Start Learning
              </button>
              <button
                className="btn-secondary rounded-lg text-sm"
                onClick={() => navigate('/explore')}
                data-testid="explore-orbits-btn"
                style={{ padding: '13px 35px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '14px', letterSpacing: '0.15em', textTransform: 'uppercase' }}
              >
                Explore Orbits
              </button>
            </div>

            {/* XP Display */}
            {progress.totalPoints > 0 && (
              <div className="mt-6 flex items-center gap-2" style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: '#FFD700' }}>
                <Zap size={14} />
                <span>{progress.totalPoints} XP earned &bull; {progress.unlockedOrbits.length} orbits unlocked</span>
              </div>
            )}
          </div>
        </div>

        {/* Live ticker */}
        <div
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2, borderTop: '1px solid rgba(0,240,255,0.1)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}
          data-testid="live-ticker"
        >
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00F0FF', letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>LIVE DATA</span>
          <div style={{ width: '1px', height: '14px', background: 'rgba(0,240,255,0.3)' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: 'rgba(255,255,255,0.6)', transition: 'opacity 0.3s' }} key={tickerIdx}>
            {TICKER_DATA[tickerIdx]}
          </span>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 6%', position: 'relative', zIndex: 5 }} data-testid="features-section">
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px' }}>
          <div style={{ marginBottom: '60px' }}>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#00F0FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              MISSION MODULES
            </p>
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(32px, 4vw, 52px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1 }}>
              How You Learn
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc, color, to }) => (
              <div
                key={title}
                className="orbit-card hud-panel p-6 cursor-pointer"
                onClick={() => navigate(to)}
                data-testid={`feature-card-${title.toLowerCase().replace(' ', '-')}`}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon size={20} color={color} />
                </div>
                <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '18px', color: '#fff', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {title}
                </h3>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  {desc}
                </p>
                <div className="flex items-center gap-1 mt-4" style={{ color, fontSize: '12px', fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  <span>Enter</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Orbit types preview */}
      <section style={{ padding: '40px 6% 80px', position: 'relative', zIndex: 5 }}>
        <div style={{ maxWidth: '1200px' }}>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '24px' }}>
            11 ORBIT TYPES TO MASTER
          </p>
          <div className="flex flex-wrap gap-3">
            {ORBIT_ORDER.map(id => {
              const orbit = ORBITS[id];
              return (
                <div
                  key={id}
                  className="px-4 py-2 rounded-full cursor-pointer"
                  onClick={() => navigate(`/learn/${id}`)}
                  style={{ border: `1px solid ${orbit.color}40`, background: `${orbit.color}08`, fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '13px', color: orbit.color, letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'background 0.2s, border-color 0.2s' }}
                  data-testid={`orbit-pill-${id}`}
                >
                  {orbit.shortName}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
