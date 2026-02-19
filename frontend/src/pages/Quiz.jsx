import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { ORBITS, ORBIT_ORDER, ORBIT_UNLOCK_THRESHOLDS } from '../data/orbits';
import { QUIZ_DATA } from '../data/quizData';
import { useProgress } from '../hooks/useProgress';
import { Lock, CheckCircle, Trophy, ChevronRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

function OrbitSelector({ onSelect }) {
  const { progress, isOrbitUnlocked, isLessonComplete, getQuizScore } = useProgress();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      <div className="mb-10">
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#00F0FF', letterSpacing: '0.2em', marginBottom: '8px' }}>MISSION CONTROL</p>
        <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 'clamp(36px, 5vw, 56px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1 }}>
          Select Your Mission
        </h1>
        <p style={{ fontFamily: 'Outfit', fontSize: '15px', color: 'rgba(255,255,255,0.5)', marginTop: '12px' }}>
          Complete lessons first, then test your knowledge. Earn XP to unlock advanced orbits.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="quiz-grid">
        {ORBIT_ORDER.map(id => {
          const orbit = ORBITS[id];
          const unlocked = isOrbitUnlocked(id);
          const quizData = QUIZ_DATA[id];
          const score = getQuizScore(id);
          const maxScore = quizData ? quizData.questions.reduce((s, q) => s + q.points, 0) : 100;
          const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
          const threshold = ORBIT_UNLOCK_THRESHOLDS[id];

          return (
            <div
              key={id}
              className="orbit-card relative rounded-xl p-5 cursor-pointer"
              onClick={() => unlocked && onSelect(id)}
              style={{
                background: unlocked ? `${orbit.color}08` : 'rgba(255,255,255,0.03)',
                border: unlocked ? `1px solid ${orbit.color}25` : '1px solid rgba(255,255,255,0.08)',
                opacity: unlocked ? 1 : 0.6,
                cursor: unlocked ? 'pointer' : 'default',
              }}
              data-testid={`quiz-card-${id}`}
            >
              {!unlocked && (
                <div className="lock-overlay absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-2" style={{ zIndex: 2 }}>
                  <Lock size={20} color="rgba(255,255,255,0.4)" />
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>
                    NEED {threshold} XP
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: orbit.color, boxShadow: `0 0 8px ${orbit.color}60` }} />
                  <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '18px', color: orbit.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {orbit.shortName}
                  </span>
                </div>
                {score > 0 && (
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#00FF94' }}>
                    {pct}%
                  </span>
                )}
              </div>

              <p style={{ fontFamily: 'Outfit', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px', lineHeight: 1.5 }}>
                {orbit.name}
              </p>

              {score > 0 && (
                <div className="mb-3">
                  <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div
                      className="progress-bar-fill h-full rounded-full"
                      style={{ width: `${pct}%`, background: pct >= 80 ? '#00FF94' : pct >= 50 ? '#FFD700' : orbit.color }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                  {quizData?.questions.length || 0} QUESTIONS
                </span>
                {unlocked && (
                  <span style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '12px', color: orbit.color, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {score > 0 ? 'Retry' : 'Start'} <ChevronRight size={12} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActiveQuiz({ orbitId, onFinish }) {
  const navigate = useNavigate();
  const orbit = ORBITS[orbitId];
  const quizData = QUIZ_DATA[orbitId];
  const { addPoints, saveQuizScore } = useProgress();

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState([]);

  if (!quizData) return null;
  const questions = quizData.questions;
  const current = questions[qIndex];
  const maxScore = questions.reduce((s, q) => s + q.points, 0);
  const pct = Math.round((score / maxScore) * 100);

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    const correct = idx === current.correctIndex;
    const earned = correct ? current.points : 0;
    setScore(s => s + earned);
    setAnswers(a => [...a, { idx, correct, earned }]);
    if (correct) toast.success(`+${current.points} XP`, { duration: 1500 });
    else toast.error('Incorrect', { duration: 1500 });
  };

  const handleNext = () => {
    if (qIndex < questions.length - 1) {
      setQIndex(i => i + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setFinished(true);
      saveQuizScore(orbitId, score + (selected === current.correctIndex ? current.points : 0) - (answers[qIndex]?.earned || 0) + (answers.slice(-1)[0]?.earned || 0));
      addPoints(score);
    }
  };

  if (finished) {
    const finalPct = Math.round((score / maxScore) * 100);
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }} data-testid="quiz-results">
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${orbit.color}15`, border: `2px solid ${orbit.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Trophy size={36} color={orbit.color} />
        </div>
        <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '40px', color: '#fff', textTransform: 'uppercase', marginBottom: '8px' }}>
          Mission {finalPct >= 70 ? 'Success' : 'Complete'}
        </h2>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: orbit.color, marginBottom: '32px' }}>
          {orbit.name} — {finalPct}% accuracy
        </p>

        <div className="flex justify-center gap-6 mb-8">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '36px', color: '#FFD700', fontWeight: 700 }}>{score}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em' }}>XP EARNED</div>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '36px', color: finalPct >= 70 ? '#00FF94' : orbit.color }}>{finalPct}%</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em' }}>ACCURACY</div>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '36px', color: '#fff' }}>{answers.filter(a => a.correct).length}/{questions.length}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em' }}>CORRECT</div>
          </div>
        </div>

        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={onFinish}
            className="btn-secondary rounded-lg flex items-center gap-2"
            style={{ padding: '10px 24px', fontSize: '13px' }}
            data-testid="back-to-missions-btn"
          >
            All Missions
          </button>
          <button
            onClick={() => { setQIndex(0); setSelected(null); setRevealed(false); setScore(0); setFinished(false); setAnswers([]); }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg"
            style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#000', background: orbit.color, border: 'none', cursor: 'pointer' }}
            data-testid="retry-quiz-btn"
          >
            <RotateCcw size={13} /> Retry
          </button>
          <button
            onClick={() => navigate(`/learn/${orbitId}`)}
            className="btn-secondary rounded-lg flex items-center gap-2"
            style={{ padding: '10px 24px', fontSize: '13px' }}
            data-testid="review-lesson-btn"
          >
            Review Lesson
          </button>
        </div>
      </div>
    );
  }

  const progressPct = (qIndex / questions.length) * 100;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }} data-testid="active-quiz">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onFinish} style={{ fontFamily: 'Rajdhani', fontSize: '13px', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Missions
        </button>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#FFD700' }}>
          {score} XP
        </div>
      </div>

      {/* Orbit Label */}
      <div className="flex items-center gap-2 mb-4">
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: orbit?.color }} />
        <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '15px', color: orbit?.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {orbit?.name} — Q{qIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)', marginBottom: '28px', overflow: 'hidden' }}>
        <div className="progress-bar-fill h-full rounded-full" style={{ width: `${progressPct}%`, background: orbit?.color }} />
      </div>

      {/* Question */}
      <div className="hud-panel p-6 mb-6" data-testid="question-card">
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '12px' }}>
          {current.difficulty.toUpperCase()} — {current.points} XP
        </p>
        <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '20px', color: '#fff', lineHeight: 1.5 }} data-testid="question-text">
          {current.question}
        </h3>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 mb-6" data-testid="answer-options">
        {current.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === current.correctIndex;
          let cls = 'quiz-option';
          if (revealed) {
            if (isCorrect) cls += ' correct';
            else if (isSelected && !isCorrect) cls += ' incorrect';
          } else if (isSelected) {
            cls += ' selected';
          }
          const letters = ['A', 'B', 'C', 'D'];

          return (
            <div
              key={i}
              className={cls}
              onClick={() => handleSelect(i)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', cursor: revealed ? 'default' : 'pointer', userSelect: 'none' }}
              data-testid={`option-${i}`}
            >
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: 'rgba(255,255,255,0.4)', width: '16px', flexShrink: 0 }}>{letters[i]}</span>
              <span style={{ fontFamily: 'Outfit', fontSize: '15px', color: revealed && isCorrect ? '#00FF94' : revealed && isSelected && !isCorrect ? '#FF3B30' : 'rgba(255,255,255,0.8)' }}>
                {opt}
              </span>
              {revealed && isCorrect && <CheckCircle size={16} color="#00FF94" style={{ marginLeft: 'auto' }} />}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      {revealed && (
        <div className="animate-fadeIn p-4 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} data-testid="explanation">
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: '6px' }}>EXPLANATION</p>
          <p style={{ fontFamily: 'Outfit', fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
            {current.explanation}
          </p>
        </div>
      )}

      {/* Next */}
      {revealed && (
        <div className="flex justify-end animate-fadeIn">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 rounded-lg"
            style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#000', background: orbit?.color, border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
            data-testid="next-question-btn"
          >
            {qIndex < questions.length - 1 ? 'Next' : 'Finish'} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Quiz() {
  const { orbitId } = useParams();
  const [activeOrbit, setActiveOrbit] = useState(orbitId || null);

  useEffect(() => {
    if (orbitId) setActiveOrbit(orbitId);
  }, [orbitId]);

  return (
    <div style={{ minHeight: '100vh', background: '#030305' }}>
      <Navigation />
      <div style={{ paddingTop: '64px' }} className="grid-bg">
        {activeOrbit
          ? <ActiveQuiz orbitId={activeOrbit} onFinish={() => setActiveOrbit(null)} />
          : <OrbitSelector onSelect={setActiveOrbit} />
        }
      </div>
    </div>
  );
}
