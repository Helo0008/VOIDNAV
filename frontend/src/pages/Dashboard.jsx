import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { ORBITS, ORBIT_ORDER, ORBIT_UNLOCK_THRESHOLDS } from '../data/orbits';
import { QUIZ_DATA } from '../data/quizData';
import { useProgress } from '../hooks/useProgress';
import { BookOpen, Brain, Lock, CheckCircle, Zap, Trophy, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const ACHIEVEMENTS = {
  first_100: { label: 'First Hundred', desc: 'Earned 100+ XP', icon: Zap, color: '#FFD700' },
  halfway: { label: 'Halfway There', desc: 'Earned 500+ XP', icon: Trophy, color: '#00FF94' },
  master: { label: 'Orbital Master', desc: 'Earned 1000+ XP', icon: Trophy, color: '#E879F9' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { progress, getQuizScore, isOrbitUnlocked, isLessonComplete, getCompletionPercent, resetProgress } = useProgress();

  const totalOrbits = ORBIT_ORDER.length;
  const unlockedCount = progress.unlockedOrbits.length;
  const lessonsCount = progress.completedLessons.length;
  const quizzesCount = Object.keys(progress.quizScores).length;
  const completionPct = getCompletionPercent();

  const nextUnlock = ORBIT_ORDER.find(id => !isOrbitUnlocked(id));
  const nextThreshold = nextUnlock ? ORBIT_UNLOCK_THRESHOLDS[nextUnlock] : null;

  const stats = [
    { label: 'Total XP', value: progress.totalPoints.toLocaleString(), color: '#FFD700', icon: Zap },
    { label: 'Orbits Unlocked', value: `${unlockedCount}/${totalOrbits}`, color: '#00F0FF', icon: CheckCircle },
    { label: 'Lessons Done', value: `${lessonsCount}/${totalOrbits}`, color: '#00FF94', icon: BookOpen },
    { label: 'Quizzes Taken', value: quizzesCount, color: '#E879F9', icon: Brain },
  ];

  const handleReset = () => {
    resetProgress();
    toast.success('Progress reset successfully');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#030305' }}>
      <Navigation />
      <div style={{ paddingTop: '80px', padding: '80px 6% 60px', maxWidth: '1200px' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
          <div>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#00F0FF', letterSpacing: '0.2em', marginBottom: '8px' }}>ASTRONAUT STATUS</p>
            <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 'clamp(36px, 5vw, 60px)', color: '#fff', textTransform: 'uppercase', lineHeight: 0.95 }}>
              Mission<br />Control
            </h1>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg mt-2"
            style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,59,48,0.7)', border: '1px solid rgba(255,59,48,0.2)', background: 'rgba(255,59,48,0.05)', cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s' }}
            data-testid="reset-progress-btn"
          >
            <RotateCcw size={13} /> Reset Progress
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10" data-testid="stats-grid">
          {stats.map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="hud-panel p-5 rounded-xl"
              data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon size={15} color={color} />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{label}</span>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '32px', color, fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Overall Progress */}
        <div className="hud-panel p-6 rounded-xl mb-10" data-testid="overall-progress">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '4px' }}>MISSION PROGRESS</p>
              <p style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '20px', color: '#fff' }}>
                {completionPct}% Complete
              </p>
            </div>
            {nextUnlock && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginBottom: '4px' }}>NEXT UNLOCK</p>
                <p style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '14px', color: ORBITS[nextUnlock]?.color }}>
                  {ORBITS[nextUnlock]?.shortName} @ {nextThreshold} XP
                </p>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                  {Math.max(0, nextThreshold - progress.totalPoints)} XP needed
                </p>
              </div>
            )}
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div className="progress-bar-fill h-full rounded-full" style={{ width: `${completionPct}%`, background: 'linear-gradient(to right, #00F0FF, #00FF94)' }} />
          </div>
        </div>

        {/* Orbit Library */}
        <div className="mb-10">
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '16px', textTransform: 'uppercase' }}>Orbit Library</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="orbit-library">
            {ORBIT_ORDER.map(id => {
              const orbit = ORBITS[id];
              const unlocked = isOrbitUnlocked(id);
              const lessonDone = isLessonComplete(id);
              const score = getQuizScore(id);
              const maxScore = QUIZ_DATA[id]?.questions.reduce((s, q) => s + q.points, 0) || 100;
              const quizPct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

              return (
                <div
                  key={id}
                  className="rounded-xl p-5"
                  style={{
                    background: unlocked ? `${orbit.color}06` : 'rgba(255,255,255,0.02)',
                    border: unlocked ? `1px solid ${orbit.color}20` : '1px solid rgba(255,255,255,0.07)',
                    opacity: unlocked ? 1 : 0.55,
                    transition: 'opacity 0.2s',
                  }}
                  data-testid={`orbit-lib-${id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {unlocked
                        ? <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: orbit.color, boxShadow: `0 0 6px ${orbit.color}80` }} />
                        : <Lock size={10} color="rgba(255,255,255,0.2)" />
                      }
                      <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '16px', color: unlocked ? orbit.color : 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {orbit.shortName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {lessonDone && <span title="Lesson complete" style={{ fontSize: '10px', color: '#00FF94' }}>L</span>}
                      {score > 0 && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#FFD700' }}>{quizPct}%</span>}
                    </div>
                  </div>

                  <p style={{ fontFamily: 'Outfit', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>{orbit.name}</p>

                  {/* Progress bars */}
                  <div className="flex flex-col gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(255,255,255,0.3)', width: '40px', letterSpacing: '0.1em' }}>LESSON</span>
                      <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div className="progress-bar-fill h-full rounded-full" style={{ width: lessonDone ? '100%' : '0%', background: '#00FF94' }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(255,255,255,0.3)', width: '40px', letterSpacing: '0.1em' }}>QUIZ</span>
                      <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div className="progress-bar-fill h-full rounded-full" style={{ width: `${quizPct}%`, background: quizPct >= 80 ? '#00FF94' : orbit.color }} />
                      </div>
                    </div>
                  </div>

                  {unlocked && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/learn/${id}`)}
                        style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s' }}
                        data-testid={`learn-btn-${id}`}
                      >
                        Learn
                      </button>
                      <button
                        onClick={() => navigate(`/quiz/${id}`)}
                        style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: orbit.color, border: `1px solid ${orbit.color}30`, background: `${orbit.color}08`, cursor: 'pointer', transition: 'background 0.2s' }}
                        data-testid={`quiz-btn-${id}`}
                      >
                        Quiz
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        {progress.achievements.length > 0 && (
          <div data-testid="achievements-section">
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '16px', textTransform: 'uppercase' }}>Achievements</p>
            <div className="flex flex-wrap gap-4">
              {progress.achievements.map(key => {
                const a = ACHIEVEMENTS[key];
                if (!a) return null;
                const Icon = a.icon;
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: `${a.color}10`, border: `1px solid ${a.color}30` }}
                    data-testid={`achievement-${key}`}
                  >
                    <Icon size={20} color={a.color} />
                    <div>
                      <div style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '14px', color: a.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.label}</div>
                      <div style={{ fontFamily: 'Outfit', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{a.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
