// शिनाख्त - Adaptive Brain Games AI Engine
// Implements: Normalize → Smooth → Decide → Prioritize

export type CognitiveStage = 'early' | 'moderate' | 'severe';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface GameSession {
  gameId: string;
  gameName: string;
  score: number;
  maxScore: number;
  timestamp: number;
  stage: CognitiveStage;
}

export interface DifficultyDecision {
  level: DifficultyLevel;
  reason: string;
  smoothedScore: number;
  normalizedScore: number;
}

// Stage baselines for normalization
const STAGE_BASELINES: Record<CognitiveStage, number> = {
  early: 0.85,
  moderate: 0.65,
  severe: 0.45,
};

// Recency weights for moving average (last 10 sessions)
const RECENCY_WEIGHTS = [0.25, 0.20, 0.16, 0.12, 0.09, 0.07, 0.05, 0.03, 0.02, 0.01];

/**
 * Step 1: Normalize - Calculate score as share of max, divided by stage baseline
 */
export function normalizeScore(
  score: number,
  maxScore: number,
  stage: CognitiveStage
): number {
  const rawRatio = score / maxScore;
  const baseline = STAGE_BASELINES[stage];
  return rawRatio / baseline;
}

/**
 * Step 2: Smooth - Recency-weighted moving average over last 10 sessions
 */
export function smoothScore(sessions: GameSession[]): number {
  if (sessions.length === 0) return 0;

  // Take last 10 sessions, sorted by timestamp (most recent first)
  const recentSessions = sessions
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  let weightedSum = 0;
  let totalWeight = 0;

  recentSessions.forEach((session, index) => {
    const normalizedScore = normalizeScore(session.score, session.maxScore, session.stage);
    const weight = RECENCY_WEIGHTS[index] || 0.01;
    weightedSum += normalizedScore * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Step 3: Decide Difficulty based on smoothed score
 */
export function decideDifficulty(smoothedScore: number, stage: CognitiveStage): DifficultyDecision {
  let level: DifficultyLevel;
  let reason: string;

  if (smoothedScore > 0.8) {
    level = 'hard';
    reason = `Performance is strong (score: ${(smoothedScore * 100).toFixed(1)}%). Increasing challenge to maintain cognitive engagement.`;
  } else if (smoothedScore < 0.4) {
    level = 'easy';
    reason = `Recent performance suggests need for support (score: ${(smoothedScore * 100).toFixed(1)}%). Reducing difficulty to build confidence.`;
  } else {
    level = 'medium';
    reason = `Performance is balanced (score: ${(smoothedScore * 100).toFixed(1)}%). Maintaining current difficulty level.`;
  }

  return {
    level,
    reason,
    smoothedScore,
    normalizedScore: smoothedScore,
  };
}

/**
 * Step 4: Prioritize - Nudge untouched games back into routine
 */
export function prioritizeGames(
  allGames: { gameId: string; gameName: string; lastPlayed: number }[],
  daysThreshold: number = 3
): { gameId: string; gameName: string; daysSincePlayed: number }[] {
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  return allGames
    .map(game => ({
      ...game,
      daysSincePlayed: Math.floor((now - game.lastPlayed) / msPerDay),
    }))
    .filter(game => game.daysSincePlayed >= daysThreshold)
    .sort((a, b) => b.daysSincePlayed - a.daysSincePlayed);
}

/**
 * Full pipeline: Process sessions and return difficulty recommendation
 */
export function getDifficultyRecommendation(
  sessions: GameSession[],
  stage: CognitiveStage
): DifficultyDecision {
  const smoothed = smoothScore(sessions);
  return decideDifficulty(smoothed, stage);
}

/**
 * Get game history stats for display
 */
export function getGameStats(sessions: GameSession[]) {
  if (sessions.length === 0) {
    return { totalGames: 0, avgScore: 0, trend: 'stable', streak: 0 };
  }

  const sorted = [...sessions].sort((a, b) => b.timestamp - a.timestamp);
  const avgScore = sorted.reduce((sum, s) => sum + (s.score / s.maxScore), 0) / sorted.length;

  // Calculate streak (consecutive days played)
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const dayDiff = Math.floor((sorted[i - 1].timestamp - sorted[i].timestamp) / (24 * 60 * 60 * 1000));
    if (dayDiff <= 1) streak++;
    else break;
  }

  // Trend calculation
  const recentHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
  const olderHalf = sorted.slice(Math.ceil(sorted.length / 2));
  const recentAvg = recentHalf.reduce((sum, s) => sum + (s.score / s.maxScore), 0) / recentHalf.length;
  const olderAvg = olderHalf.length > 0 ? olderHalf.reduce((sum, s) => sum + (s.score / s.maxScore), 0) / olderHalf.length : recentAvg;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (recentAvg > olderAvg + 0.1) trend = 'improving';
  else if (recentAvg < olderAvg - 0.1) trend = 'declining';

  return {
    totalGames: sessions.length,
    avgScore: Math.round(avgScore * 100),
    trend,
    streak,
  };
}
