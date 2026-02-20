import { useState, useEffect } from 'react';
import { ORBIT_UNLOCK_THRESHOLDS, ORBIT_ORDER } from '../data/orbits';

const DEFAULT_PROGRESS = {
  totalPoints: 0,
  unlockedOrbits: ['leo', 'polar', 'geo', 'sso', 'meo', 'heo', 'molniya', 'tundra', 'graveyard', 'hohmann', 'lagrange'],
  completedLessons: [],
  quizScores: {},
  achievements: [],
  lastActive: new Date().toISOString(),
};

export function useProgress() {
  const [progress, setProgress] = useState(() => {
    try {
      const stored = localStorage.getItem('voidnav_progress');
      return stored ? { ...DEFAULT_PROGRESS, ...JSON.parse(stored) } : DEFAULT_PROGRESS;
    } catch {
      return DEFAULT_PROGRESS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('voidnav_progress', JSON.stringify(progress));
    } catch {
      // ignore storage errors
    }
  }, [progress]);

  const addPoints = (pts) => {
    setProgress(p => {
      const newTotal = p.totalPoints + pts;
      const newUnlocked = ORBIT_ORDER.filter(id => ORBIT_UNLOCK_THRESHOLDS[id] <= newTotal);
      const newAchievements = [...p.achievements];
      if (newTotal >= 100 && !newAchievements.includes('first_100')) newAchievements.push('first_100');
      if (newTotal >= 500 && !newAchievements.includes('halfway')) newAchievements.push('halfway');
      if (newTotal >= 1000 && !newAchievements.includes('master')) newAchievements.push('master');
      return { ...p, totalPoints: newTotal, unlockedOrbits: newUnlocked, achievements: newAchievements };
    });
  };

  const unlockOrbit = (orbitId) => {
    setProgress(p => ({
      ...p,
      unlockedOrbits: [...new Set([...p.unlockedOrbits, orbitId])],
    }));
  };

  const markLessonComplete = (orbitId) => {
    setProgress(p => {
      if (p.completedLessons.includes(orbitId)) return p;
      return {
        ...p,
        completedLessons: [...p.completedLessons, orbitId],
      };
    });
  };

  const saveQuizScore = (orbitId, score, maxScore) => {
    setProgress(p => {
      const existing = p.quizScores[orbitId] || 0;
      if (score <= existing) return p;
      return {
        ...p,
        quizScores: { ...p.quizScores, [orbitId]: score },
      };
    });
  };

  const isOrbitUnlocked = (orbitId) => progress.unlockedOrbits.includes(orbitId);
  const isLessonComplete = (orbitId) => progress.completedLessons.includes(orbitId);
  const getQuizScore = (orbitId) => progress.quizScores[orbitId] || 0;
  const getCompletionPercent = () => {
    const total = ORBIT_ORDER.length;
    const done = progress.completedLessons.length;
    return Math.round((done / total) * 100);
  };

  const resetProgress = () => setProgress(DEFAULT_PROGRESS);

  return {
    progress,
    addPoints,
    unlockOrbit,
    markLessonComplete,
    saveQuizScore,
    isOrbitUnlocked,
    isLessonComplete,
    getQuizScore,
    getCompletionPercent,
    resetProgress,
  };
}
