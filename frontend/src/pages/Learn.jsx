import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { EarthScene } from '../components/EarthScene';
import { ORBITS, ORBIT_ORDER } from '../data/orbits';
import { useProgress } from '../hooks/useProgress';
import { ChevronRight, ChevronLeft, Lock, CheckCircle, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function Learn() {
  const { orbitId } = useParams();
  const navigate = useNavigate();
  const { progress, markLessonComplete, addPoints, isOrbitUnlocked, isLessonComplete } = useProgress();
  const [selectedId, setSelectedId] = useState(orbitId || 'leo');
  const [stepIndex, setStepIndex] = useState(0);
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    if (orbitId && ORBITS[orbitId]) {
      setSelectedId(orbitId);
      setStepIndex(0);
    }
  }, [orbitId]);

  const orbit = ORBITS[selectedId];
  const steps = orbit?.lessonSteps || [];
  const isLastStep = stepIndex === steps.length - 1;
  const isUnlocked = isOrbitUnlocked(selectedId);
  const isComplete = isLessonComplete(selectedId);

  const handleSelectOrbit = (id) => {
    navigate(`/learn/${id}`);
    setStepIndex(0);
  };

  const handleNext = () => {
    if (isLastStep) {
      if (!isComplete) {
        markLessonComplete(selectedId);
        addPoints(50);
        toast.success(`Lesson complete! +50 XP earned`, { icon: '🎓' });
      }
    } else {
      setStepIndex(s => s + 1);
    }
  };

  const handleQuiz = () => navigate(`/quiz/${selectedId}`);

  return (
    <div style={{ height: '100vh', background: '#030305', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navigation />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', marginTop: '64px' }}>
        {/* Sidebar - Orbit List */}
        <div
          style={{ width: '220px', flexShrink: 0, overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.07)', background: 'rgba(11,16,21,0.9)', padding: '20px 12px' }}
          data-testid="orbit-sidebar"
        >
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '12px', paddingLeft: '8px' }}>ORBIT TYPES</p>
          <div className="flex flex-col gap-1">
            {ORBIT_ORDER.map(id => {
              const o = ORBITS[id];
              const unlocked = isOrbitUnlocked(id);
              const complete = isLessonComplete(id);
              const isActive = id === selectedId;

              return (
                <button
                  key={id}
                  onClick={() => unlocked && handleSelectOrbit(id)}
                  disabled={!unlocked}
                  data-testid={`orbit-sidebar-${id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: isActive ? `1px solid ${o.color}50` : '1px solid transparent',
                    background: isActive ? `${o.color}10` : 'transparent',
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                    opacity: unlocked ? 1 : 0.4,
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background 0.2s, border-color 0.2s',
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: unlocked ? o.color : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Rajdhani', fontWeight: isActive ? 700 : 500, fontSize: '13px', color: isActive ? o.color : unlocked ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>
                    {o.shortName}
                  </span>
                  {!unlocked && <Lock size={10} color="rgba(255,255,255,0.3)" />}
                  {complete && <CheckCircle size={11} color="#00FF94" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 3D Scene */}
          <div style={{ height: '45%', flexShrink: 0, position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <EarthScene
              activeOrbits={[orbit]}
              selectedOrbit={orbit}
              height="100%"
              showLabels={showLabels}
              cameraPosition={[0, 3, orbit?.semiMajor ? orbit.semiMajor * 2.2 : 10]}
            />
            {/* Orbit info overlay */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
              <div className="hud-panel px-4 py-3" data-testid="orbit-info-panel">
                <div className="flex items-center gap-2 mb-2">
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: orbit?.color }} />
                  <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '16px', color: orbit?.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {orbit?.shortName}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                  {[
                    ['ALT', orbit?.altitudeRange],
                    ['PERIOD', orbit?.periodRange],
                    ['VEL', orbit?.velocity],
                    ['INC', orbit?.inclinationRange],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>{label}</span>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#00F0FF' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            {!isUnlocked ? (
              <div className="flex flex-col items-center justify-center h-full gap-4" data-testid="locked-content">
                <Lock size={40} color="rgba(255,255,255,0.2)" />
                <p style={{ fontFamily: 'Rajdhani', fontSize: '18px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Orbit Locked
                </p>
                <p style={{ fontFamily: 'Outfit', fontSize: '14px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                  Earn more XP by completing quizzes to unlock this orbit type.
                </p>
              </div>
            ) : (
              <>
                {/* Step progress */}
                <div className="flex items-center gap-2 mb-6">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStepIndex(i)}
                      className={`step-indicator ${i === stepIndex ? 'active' : i < stepIndex ? 'completed' : ''}`}
                      data-testid={`step-indicator-${i}`}
                    />
                  ))}
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginLeft: '8px' }}>
                    {stepIndex + 1} / {steps.length}
                  </span>
                </div>

                {/* Step Content */}
                <div key={stepIndex} className="animate-fadeIn" data-testid="lesson-content">
                  <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '26px', color: orbit?.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                    {steps[stepIndex]?.title}
                  </h2>
                  <p style={{ fontFamily: 'Outfit', fontSize: '16px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: '28px' }}>
                    {steps[stepIndex]?.content}
                  </p>

                  {/* Key facts (shown on first step) */}
                  {stepIndex === 0 && (
                    <div className="mb-6">
                      <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '12px' }}>KEY FACTS</p>
                      <div className="flex flex-col gap-2">
                        {orbit?.funFacts?.slice(0, 3).map((fact, i) => (
                          <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: orbit.color, marginTop: '7px', flexShrink: 0 }} />
                            <span style={{ fontFamily: 'Outfit', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{fact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Examples (shown on last step) */}
                  {isLastStep && orbit?.examples && (
                    <div className="mb-6">
                      <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '12px' }}>REAL-WORLD EXAMPLES</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {orbit.examples.map((ex, i) => (
                          <div key={i} className="px-4 py-3 rounded-lg" style={{ background: `${orbit.color}08`, border: `1px solid ${orbit.color}20` }}>
                            <div style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '15px', color: orbit.color }}>{ex.name}</div>
                            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                              {ex.altitude} · i={ex.inclination} · {ex.year}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setStepIndex(s => Math.max(0, s - 1))}
                    disabled={stepIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg"
                    style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: stepIndex === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: stepIndex === 0 ? 'not-allowed' : 'pointer', transition: 'color 0.2s, border-color 0.2s' }}
                    data-testid="prev-step-btn"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>

                  <div className="flex items-center gap-3">
                    {isLastStep && (
                      <button
                        onClick={handleQuiz}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg"
                        style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.06)', cursor: 'pointer', transition: 'background 0.2s' }}
                        data-testid="take-quiz-btn"
                      >
                        <Award size={14} /> Take Quiz
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg"
                      style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#000', background: orbit?.color, border: 'none', cursor: 'pointer', transition: 'opacity 0.2s', boxShadow: `0 0 20px ${orbit?.color}40` }}
                      data-testid="next-step-btn"
                    >
                      {isLastStep ? (isComplete ? 'Completed' : 'Complete +50 XP') : 'Next'}
                      {!isLastStep && <ChevronRight size={14} />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
