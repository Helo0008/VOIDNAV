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

  // Check win condition
  useEffect(() => {
    if (!started) return;
    const diff = Math.abs(playerAngle - targetAngle);
    const gap = Math.min(diff, Math.PI * 2 - diff);
    if (gap < 0.06 && Math.abs(playerR - BASE_RADIUS) < 0.3 && thrustCount > 2) {
      setPhase('success');
    }
  }, [playerAngle, targetAngle, playerR, started, thrustCount]);

  const angleDiff = targetAngle - playerAngle;
  const gap = ((angleDiff % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const gapDeg = (gap * 180 / Math.PI).toFixed(1);
  const playerSpeed = (1 / Math.pow(playerR, 0.5) * 7.8).toFixed(2);
  const targetSpeed = (1 / Math.pow(BASE_RADIUS, 0.5) * 7.8).toFixed(2);

  const playerOrbit = { id: 'player', shortName: 'YOU', name: 'Your Satellite', color: '#00F0FF', semiMajor: playerR, eccentricity: 0.001, inclination: 0.5, raan: 0, speed: 0.12 };
  const targetOrbit = { id: 'target', shortName: 'TARGET', name: 'Target Satellite', color: '#FF3B30', semiMajor: BASE_RADIUS, eccentricity: 0.001, inclination: 0.5, raan: 0, speed: 0.12 };

  const info = PHASE_TEXT[phase] || PHASE_TEXT.intro;

  return (
    <div className="min-h-screen" style={{ background: '#030305' }}>
      <Navigation />
      <div className="flex" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        {/* 3D Scene */}
        <div className="flex-1 relative">
          <EarthScene
            activeOrbits={[playerOrbit, targetOrbit]}
            selectedOrbit={playerOrbit}
            height="100%"
            interactive={true}
            showLabels={true}
          />
          {/* Phase Info overlay */}
          <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, maxWidth: '380px' }}>
            <div className="hud-panel" style={{ padding: '16px 20px', borderRadius: '12px' }}>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: phase === 'success' ? '#00FF94' : phase === 'wrong' ? '#FF3B30' : '#00F0FF', letterSpacing: '0.15em', marginBottom: '4px' }}>
                {info.title}
              </p>
              <p style={{ fontFamily: 'Rajdhani', fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                {info.subtitle}
              </p>
            </div>
          </div>

          {/* Telemetry */}
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 10 }}>
            <div className="hud-panel" style={{ padding: '12px 16px', borderRadius: '10px', display: 'flex', gap: '20px' }}>
              <div>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>GAP</p>
                <p style={{ fontFamily: 'Rajdhani', fontSize: '18px', fontWeight: 700, color: gap < 0.1 ? '#00FF94' : '#FFD700' }}>{gapDeg}°</p>
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
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>YOUR ALT</p>
                <p style={{ fontFamily: 'Rajdhani', fontSize: '18px', fontWeight: 700, color: playerR > BASE_RADIUS + 0.15 ? '#FF3B30' : playerR < BASE_RADIUS - 0.15 ? '#00FF94' : '#fff' }}>
                  {((playerR - 2) * 6371 / 2).toFixed(0)} km
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={thrustPrograde}
              data-testid="thrust-prograde"
              className="px-5 py-3 rounded-lg"
              style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.4)', color: '#FF4444' }}
            >
              THRUST PROGRADE (Speed Up)
            </button>
            <button
              onClick={thrustRetrograde}
              data-testid="thrust-retrograde"
              className="px-5 py-3 rounded-lg"
              style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', background: 'rgba(0,255,148,0.15)', border: '1px solid rgba(0,255,148,0.4)', color: '#00FF94' }}
            >
              THRUST RETROGRADE (Slow Down)
            </button>
            <button
              onClick={resetChallenge}
              data-testid="reset-challenge"
              className="px-5 py-2 rounded-lg"
              style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
