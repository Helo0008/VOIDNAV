import { useState, useRef, useEffect, useCallback } from 'react';
import { Navigation } from '../components/Navigation';
import { EarthScene } from '../components/EarthScene';
import { ArrowUp, ArrowDown, RotateCcw, HelpCircle } from 'lucide-react';

const PHASE_TEXT = {
  intro: { 
    title: 'ORBITAL CATCH-UP CHALLENGE', 
    subtitle: 'Your mission: Rendezvous with the RED target satellite ahead of you. But there\'s a catch — speeding up won\'t help!',
    hint: 'Use the thrust buttons below to change your orbit. Watch what happens to your speed when you change altitude.'
  },
  wrong: { 
    title: 'COUNTER-INTUITIVE!', 
    subtitle: 'You sped up, but now you\'re SLOWER! In orbit, higher altitude = slower orbital speed. You\'ve fallen further behind.',
    hint: 'Think backwards: to catch up to something ahead of you in orbit, you need to go to a LOWER, faster orbit first.'
  },
  hint: { 
    title: 'GETTING WARMER', 
    subtitle: 'Now try the other direction. To catch up, you need to DROP to a lower orbit where you\'ll move FASTER than the target.',
    hint: 'Lower orbit = Higher speed. Once you\'re ahead, boost back up to match the target\'s orbit.'
  },
  winning: { 
    title: 'CATCHING UP!', 
    subtitle: 'You\'re in a lower, faster orbit now! Watch the gap close as you gain on the target.',
    hint: 'When the gap gets small, thrust PROGRADE to raise your orbit back to match the target.'
  },
  success: { 
    title: 'RENDEZVOUS COMPLETE!', 
    subtitle: 'You matched orbits with the target! This is exactly how real spacecraft dock — the Gemini program proved this in 1965.',
    hint: 'Key insight: In orbit, slowing down makes you go faster, and speeding up makes you go slower. Counter-intuitive but essential for space travel!'
  },
};

const BASE_RADIUS = 4.0;
const INITIAL_GAP = 0.4; // radians ahead

export default function CatchUpChallenge() {
  const [playerR, setPlayerR] = useState(BASE_RADIUS);
  const [playerAngle, setPlayerAngle] = useState(0);
  const [targetAngle, setTargetAngle] = useState(INITIAL_GAP);
  const [phase, setPhase] = useState('intro');
  const [thrustCount, setThrustCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const animRef = useRef(null);

  const targetW = 1 / Math.pow(BASE_RADIUS, 1.5);

  const resetChallenge = () => {
    setPlayerR(BASE_RADIUS);
    setPlayerAngle(0);
    setTargetAngle(INITIAL_GAP);
    setPhase('intro');
    setThrustCount(0);
    setStarted(false);
    setShowHelp(true);
  };

  const thrustPrograde = () => {
    if (phase === 'success') return;
    setStarted(true);
    setShowHelp(false);
    setPlayerR(r => Math.min(r + 0.35, 6.0));
    setThrustCount(c => c + 1);
    if (phase === 'intro' || phase === 'hint') setPhase('wrong');
  };

  const thrustRetrograde = () => {
    if (phase === 'success') return;
    setStarted(true);
    setShowHelp(false);
    setPlayerR(r => Math.max(r - 0.35, 2.8));
    setThrustCount(c => c + 1);
    if (phase === 'wrong') setPhase('hint');
    if (phase === 'intro') setPhase('winning');
    if (phase === 'hint') setPhase('winning');
  };

  // Animation loop - more pronounced speed difference
  useEffect(() => {
    if (!started || phase === 'success') return;
    const loop = () => {
      const dt = 0.016;
      // Kepler's 3rd law: angular velocity ∝ 1/r^1.5
      const playerW = 1 / Math.pow(playerR, 1.5);
      const speedMultiplier = 0.8; // Make the animation faster for visibility
      setPlayerAngle(a => (a + playerW * dt * speedMultiplier) % (Math.PI * 2));
      setTargetAngle(a => (a + targetW * dt * speedMultiplier) % (Math.PI * 2));
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [started, playerR, targetW, phase]);

  // Check win condition - more generous
  useEffect(() => {
    if (!started) return;
    const diff = Math.abs(playerAngle - targetAngle);
    const gap = Math.min(diff, Math.PI * 2 - diff);
    // Win when gap is small AND player is close to target altitude
    if (gap < 0.12 && Math.abs(playerR - BASE_RADIUS) < 0.5 && thrustCount > 2) {
      setPhase('success');
    }
  }, [playerAngle, targetAngle, playerR, started, thrustCount]);

  // Calculate gap for display - show as percentage of full orbit ahead
  const angleDiff = targetAngle - playerAngle;
  const gapRaw = ((angleDiff % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const gapDeg = (gapRaw * 180 / Math.PI).toFixed(1);
  const gapPct = ((gapRaw / (Math.PI * 2)) * 100).toFixed(1);
  const playerSpeed = (1 / Math.pow(playerR, 0.5) * 7.8).toFixed(2);
  const targetSpeed = (1 / Math.pow(BASE_RADIUS, 0.5) * 7.8).toFixed(2);
  const speedDiff = (parseFloat(playerSpeed) - parseFloat(targetSpeed)).toFixed(2);
  const isGaining = parseFloat(speedDiff) > 0;

  const playerOrbit = { id: 'player', shortName: 'YOU', name: 'Your Satellite', color: '#00F0FF', semiMajor: playerR, eccentricity: 0.001, inclination: 0.5, raan: 0, speed: 0.15 };
  const targetOrbit = { id: 'target', shortName: 'TARGET', name: 'Target Satellite', color: '#FF3B30', semiMajor: BASE_RADIUS, eccentricity: 0.001, inclination: 0.5, raan: 0, speed: 0.15 };

  const info = PHASE_TEXT[phase] || PHASE_TEXT.intro;

  return (
    <div className="min-h-screen" style={{ background: '#030305' }}>
      <Navigation />
      <div className="flex" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden', marginTop: '56px' }}>
        {/* 3D Scene */}
        <div className="flex-1 relative">
          <EarthScene
            activeOrbits={[playerOrbit, targetOrbit]}
            selectedOrbit={playerOrbit}
            height="100%"
            interactive={true}
            showLabels={true}
          />
          
          {/* Phase Info overlay - top left */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, maxWidth: '420px' }}>
            <div className="hud-panel" style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(3,3,5,0.92)', backdropFilter: 'blur(12px)' }}>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: phase === 'success' ? '#00FF94' : phase === 'wrong' ? '#FF3B30' : phase === 'winning' ? '#FFD700' : '#00F0FF', letterSpacing: '0.15em', marginBottom: '6px', fontWeight: 700 }}>
                {info.title}
              </p>
              <p style={{ fontFamily: 'Rajdhani', fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, marginBottom: '8px' }}>
                {info.subtitle}
              </p>
              {info.hint && (
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '4px' }}>
                  💡 {info.hint}
                </p>
              )}
            </div>
          </div>

          {/* Telemetry Panel - bottom left */}
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 10 }}>
            <div className="hud-panel" style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(3,3,5,0.92)', backdropFilter: 'blur(12px)' }}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>GAP TO TARGET</p>
                  <p style={{ fontFamily: 'Rajdhani', fontSize: '22px', fontWeight: 700, color: parseFloat(gapDeg) < 20 ? '#00FF94' : parseFloat(gapDeg) > 50 ? '#FF3B30' : '#FFD700' }}>
                    {gapDeg}° <span style={{ fontSize: '12px', opacity: 0.6 }}>({gapPct}%)</span>
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>SPEED DIFF</p>
                  <p style={{ fontFamily: 'Rajdhani', fontSize: '22px', fontWeight: 700, color: isGaining ? '#00FF94' : parseFloat(speedDiff) < 0 ? '#FF3B30' : '#fff' }}>
                    {isGaining ? '+' : ''}{speedDiff} <span style={{ fontSize: '12px', opacity: 0.6 }}>km/s</span>
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: '#00F0FF', letterSpacing: '0.12em' }}>YOUR SPEED</p>
                  <p style={{ fontFamily: 'Rajdhani', fontSize: '18px', fontWeight: 700, color: '#00F0FF' }}>{playerSpeed} km/s</p>
                </div>
                <div>
                  <p style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: '#FF3B30', letterSpacing: '0.12em' }}>TARGET SPEED</p>
                  <p style={{ fontFamily: 'Rajdhani', fontSize: '18px', fontWeight: 700, color: '#FF3B30' }}>{targetSpeed} km/s</p>
                </div>
                <div>
                  <p style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>YOUR ALTITUDE</p>
                  <p style={{ fontFamily: 'Rajdhani', fontSize: '18px', fontWeight: 700, color: playerR > BASE_RADIUS + 0.2 ? '#FF3B30' : playerR < BASE_RADIUS - 0.2 ? '#00FF94' : '#fff' }}>
                    {((playerR - 2) * 3185).toFixed(0)} km
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>TARGET ALTITUDE</p>
                  <p style={{ fontFamily: 'Rajdhani', fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                    {((BASE_RADIUS - 2) * 3185).toFixed(0)} km
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls - bottom right */}
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
            <button
              onClick={thrustPrograde}
              data-testid="thrust-prograde"
              disabled={phase === 'success'}
              className="px-5 py-3 rounded-lg flex items-center gap-3"
              style={{ 
                fontFamily: 'Rajdhani', 
                fontWeight: 700, 
                fontSize: '14px', 
                letterSpacing: '0.08em', 
                textTransform: 'uppercase', 
                cursor: phase === 'success' ? 'not-allowed' : 'pointer', 
                transition: 'all 0.2s', 
                background: 'rgba(255,68,68,0.15)', 
                border: '1px solid rgba(255,68,68,0.5)', 
                color: '#FF4444',
                opacity: phase === 'success' ? 0.5 : 1
              }}
            >
              <ArrowUp size={18} />
              <span>PROGRADE (Raise Orbit)</span>
            </button>
            <button
              onClick={thrustRetrograde}
              data-testid="thrust-retrograde"
              disabled={phase === 'success'}
              className="px-5 py-3 rounded-lg flex items-center gap-3"
              style={{ 
                fontFamily: 'Rajdhani', 
                fontWeight: 700, 
                fontSize: '14px', 
                letterSpacing: '0.08em', 
                textTransform: 'uppercase', 
                cursor: phase === 'success' ? 'not-allowed' : 'pointer', 
                transition: 'all 0.2s', 
                background: 'rgba(0,255,148,0.15)', 
                border: '1px solid rgba(0,255,148,0.5)', 
                color: '#00FF94',
                opacity: phase === 'success' ? 0.5 : 1
              }}
            >
              <ArrowDown size={18} />
              <span>RETROGRADE (Lower Orbit)</span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={resetChallenge}
                data-testid="reset-challenge"
                className="px-4 py-2 rounded-lg flex items-center gap-2"
                style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
              >
                <RotateCcw size={14} /> Reset
              </button>
              <button
                onClick={() => setShowHelp(v => !v)}
                data-testid="toggle-help"
                className="px-4 py-2 rounded-lg flex items-center gap-2"
                style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', background: showHelp ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showHelp ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.15)'}`, color: showHelp ? '#00F0FF' : 'rgba(255,255,255,0.5)' }}
              >
                <HelpCircle size={14} /> Help
              </button>
            </div>
          </div>

          {/* Initial help overlay */}
          {!started && showHelp && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20, maxWidth: '500px', textAlign: 'center' }}>
              <div className="hud-panel" style={{ padding: '28px 32px', borderRadius: '16px', background: 'rgba(3,3,5,0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,240,255,0.3)' }}>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#00F0FF', letterSpacing: '0.2em', marginBottom: '12px' }}>🛰️ ORBITAL MECHANICS PUZZLE</p>
                <h2 style={{ fontFamily: 'Rajdhani', fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
                  Catch the Target Satellite
                </h2>
                <p style={{ fontFamily: 'Outfit', fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '20px' }}>
                  The <span style={{ color: '#FF3B30', fontWeight: 600 }}>RED satellite</span> is ahead of you. Your goal is to catch up and rendezvous.
                  <br /><br />
                  <strong style={{ color: '#FFD700' }}>Warning:</strong> Space doesn't work like driving a car. In orbit, speeding up doesn't make you catch up — it does the opposite!
                </p>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
                  Click a thrust button to begin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
