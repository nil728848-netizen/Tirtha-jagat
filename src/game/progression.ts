import { ALPHABET_WORLDS, MINI_GAMES } from '../data/worlds';
import {
  AchievementDef,
  DifficultyMode,
  GameSettings,
  MiniGameId,
  PlayerProgress,
  RewardSummary,
} from '../types/game';

export const PROGRESS_STORAGE_KEY = 'alphabet_adventure_progress_v1';
export const SETTINGS_STORAGE_KEY = 'alphabet_adventure_settings_v1';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_steps',
    title: 'First Explorer',
    description: 'Complete your very first mini-game in Alphabet Adventure.',
    requirementText: 'Complete 1 mini-game',
    rewardCoins: 30,
  },
  {
    id: 'five_games',
    title: 'Curious Scholar',
    description: 'Complete 5 mini-games across any A–Z worlds.',
    requirementText: 'Complete 5 mini-games',
    rewardCoins: 60,
  },
  {
    id: 'world_hopper',
    title: 'World Hopper',
    description: 'Visit at least 5 different Alphabet Worlds.',
    requirementText: 'Visit 5 worlds',
    rewardCoins: 75,
  },
  {
    id: 'halfway_atlas',
    title: 'Halfway Across A–Z',
    description: 'Earn stars in 13 different Alphabet Worlds.',
    requirementText: 'Earn stars in 13 worlds',
    rewardCoins: 150,
  },
  {
    id: 'az_legend',
    title: 'Master of A to Z',
    description: 'Earn at least 1 star in all 26 Alphabet Worlds!',
    requirementText: 'Earn stars in all 26 worlds',
    rewardCoins: 500,
  },
  {
    id: 'star_collector',
    title: 'Star Collector',
    description: 'Collect 25 Stars across your adventures.',
    requirementText: 'Collect 25 stars',
    rewardCoins: 100,
  },
  {
    id: 'coin_vault',
    title: 'Golden Treasure',
    description: 'Accumulate 500 Golden Coins.',
    requirementText: 'Hold 500+ coins',
    rewardCoins: 100,
  },
  {
    id: 'sharp_mind',
    title: 'Sharp Mind',
    description: 'Answer 25 questions or puzzles accurately.',
    requirementText: '25 accurate answers',
    rewardCoins: 80,
  },
  {
    id: 'daily_hero',
    title: 'Daily Champion',
    description: 'Complete a Daily Challenge mission.',
    requirementText: 'Finish Daily Challenge',
    rewardCoins: 90,
  },
  {
    id: 'level_five',
    title: 'Rising Adventurer',
    description: 'Reach Player Level 5.',
    requirementText: 'Reach Level 5',
    rewardCoins: 120,
  },
];

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'high',
  masterVolume: 0.7,
  musicEnabled: true,
  sfxEnabled: true,
  voiceEnabled: true,
  showHindi: true,
  showOdia: true,
  audioInstructions: true,
  textSize: 'normal',
  parentalSafeExploreAll: true,
};

export function getTodayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createInitialProgress(todayIso = getTodayIso()): PlayerProgress {
  return {
    playerName: 'Adventurer',
    coins: 100,
    xp: 0,
    stars: 0,
    streakDays: 1,
    lastPlayedDate: todayIso,
    dailyChallengeDate: todayIso,
    dailyChallengeCompleted: false,
    unlockedLetters: ['A', 'B', 'C'],
    worlds: {
      A: { visited: true, stars: 0, bestScore: 0, completedMiniGames: [] },
    },
    unlockedAchievements: [],
    miniGamesPlayedCount: 0,
    totalCorrectAnswers: 0,
    personalBestScore: 0,
    leaderboard: [
      { id: 'seed-1', playerName: 'Aarav', mode: 'explorer', score: 340, stars: 3, dateIso: todayIso },
      { id: 'seed-2', playerName: 'Ananya', mode: 'master', score: 420, stars: 3, dateIso: todayIso },
      { id: 'seed-3', playerName: 'Rohan', mode: 'kids', score: 260, stars: 3, dateIso: todayIso },
    ],
  };
}

export function getLevelFromXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 60)) + 1);
}

export function getXpProgressInLevel(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  percent: number;
} {
  const level = getLevelFromXp(xp);
  const currentFloor = Math.pow(level - 1, 2) * 60;
  const nextFloor = Math.pow(level, 2) * 60;
  const span = Math.max(1, nextFloor - currentFloor);
  const gained = Math.max(0, xp - currentFloor);
  return {
    level,
    currentLevelXp: gained,
    nextLevelXp: span,
    percent: Math.min(100, Math.round((gained / span) * 100)),
  };
}

export function getDailyChallenge(dateIso = getTodayIso()): {
  dateIso: string;
  letter: string;
  miniGameId: MiniGameId;
  bonusCoins: number;
  bonusXp: number;
} {
  let hash = 0;
  for (let i = 0; i < dateIso.length; i++) {
    hash = (hash * 31 + dateIso.charCodeAt(i)) >>> 0;
  }
  const world = ALPHABET_WORLDS[hash % ALPHABET_WORLDS.length];
  const game = MINI_GAMES[(hash >> 3) % MINI_GAMES.length];
  return {
    dateIso,
    letter: world.letter,
    miniGameId: game.id,
    bonusCoins: 80,
    bonusXp: 120,
  };
}

export function calculateStarRating(accuracyRatio: number): number {
  if (accuracyRatio >= 0.85) return 3;
  if (accuracyRatio >= 0.55) return 2;
  if (accuracyRatio > 0) return 1;
  return 0;
}

export function computeModeMultiplier(mode: DifficultyMode): number {
  if (mode === 'master') return 1.5;
  if (mode === 'explorer') return 1.25;
  return 1.0;
}

export function updateStreakOnSession(
  progress: PlayerProgress,
  todayIso = getTodayIso(),
): PlayerProgress {
  if (progress.lastPlayedDate === todayIso) {
    return progress;
  }
  const prev = new Date(progress.lastPlayedDate + 'T00:00:00Z').getTime();
  const curr = new Date(todayIso + 'T00:00:00Z').getTime();
  const diffDays = Math.round((curr - prev) / 86400000);
  const streakDays = diffDays === 1 ? progress.streakDays + 1 : 1;
  return {
    ...progress,
    lastPlayedDate: todayIso,
    streakDays,
    dailyChallengeDate: todayIso,
    dailyChallengeCompleted:
      progress.dailyChallengeDate === todayIso ? progress.dailyChallengeCompleted : false,
  };
}

export function applyMiniGameResult(
  prev: PlayerProgress,
  params: {
    letter: string;
    miniGameId: MiniGameId;
    mode: DifficultyMode;
    score: number;
    correctCount: number;
    totalCount: number;
    todayIso?: string;
  },
): { nextProgress: PlayerProgress; summary: RewardSummary } {
  const todayIso = params.todayIso ?? getTodayIso();
  const baseProgress = updateStreakOnSession(prev, todayIso);
  const letter = params.letter.toUpperCase();
  const gameMeta = MINI_GAMES.find((m) => m.id === params.miniGameId) ?? MINI_GAMES[0];
  const accuracy = params.totalCount > 0 ? params.correctCount / params.totalCount : 1;
  const starsEarned = Math.max(1, calculateStarRating(accuracy));
  const modeMult = computeModeMultiplier(params.mode);
  const streakBonus = Math.min(25, (baseProgress.streakDays - 1) * 5);

  const daily = getDailyChallenge(todayIso);
  const hitDaily =
    !baseProgress.dailyChallengeCompleted &&
    daily.letter === letter &&
    daily.miniGameId === params.miniGameId;

  let coinsEarned =
    Math.round(gameMeta.rewardCoins * modeMult * (0.5 + 0.5 * accuracy)) +
    streakBonus +
    (hitDaily ? daily.bonusCoins : 0);
  const xpEarned =
    Math.round(gameMeta.rewardXp * modeMult * (0.5 + 0.5 * accuracy)) +
    (hitDaily ? daily.bonusXp : 0);

  const existingWorld = baseProgress.worlds[letter] ?? {
    visited: true,
    stars: 0,
    bestScore: 0,
    completedMiniGames: [],
  };

  const completedSet = new Set<MiniGameId>(existingWorld.completedMiniGames);
  completedSet.add(params.miniGameId);

  const nextWorldStars = Math.max(existingWorld.stars, starsEarned);
  const addedStars = Math.max(0, nextWorldStars - existingWorld.stars);

  const nextWorlds = {
    ...baseProgress.worlds,
    [letter]: {
      visited: true,
      stars: nextWorldStars,
      bestScore: Math.max(existingWorld.bestScore, params.score),
      completedMiniGames: Array.from(completedSet),
    },
  };

  // Unlock next alphabet world progressively
  const currentWorldIdx = ALPHABET_WORLDS.findIndex((w) => w.letter === letter);
  const nextUnlockedSet = new Set(baseProgress.unlockedLetters);
  nextUnlockedSet.add(letter);
  let newlyUnlockedWorld: string | undefined;
  if (currentWorldIdx >= 0 && currentWorldIdx + 1 < ALPHABET_WORLDS.length) {
    const candidate = ALPHABET_WORLDS[currentWorldIdx + 1].letter;
    if (!nextUnlockedSet.has(candidate)) {
      nextUnlockedSet.add(candidate);
      newlyUnlockedWorld = candidate;
    }
  }

  const isNewBest = params.score > baseProgress.personalBestScore;
  const nextLeaderboard = [
    ...baseProgress.leaderboard,
    {
      id: `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      playerName: baseProgress.playerName || 'Adventurer',
      mode: params.mode,
      score: params.score,
      stars: starsEarned,
      dateIso: todayIso,
    },
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const candidateProgress: PlayerProgress = {
    ...baseProgress,
    coins: baseProgress.coins + coinsEarned,
    xp: baseProgress.xp + xpEarned,
    stars: baseProgress.stars + addedStars,
    dailyChallengeCompleted: baseProgress.dailyChallengeCompleted || hitDaily,
    unlockedLetters: Array.from(nextUnlockedSet),
    worlds: nextWorlds,
    miniGamesPlayedCount: baseProgress.miniGamesPlayedCount + 1,
    totalCorrectAnswers: baseProgress.totalCorrectAnswers + params.correctCount,
    personalBestScore: Math.max(baseProgress.personalBestScore, params.score),
    leaderboard: nextLeaderboard,
  };

  // Evaluate achievement unlocks
  const unlockedAchSet = new Set(candidateProgress.unlockedAchievements);
  const newlyUnlockedAchievements: AchievementDef[] = [];

  const worldsVisitedCount = Object.values(nextWorlds).filter((w) => w.visited).length;
  const worldsWithStars = Object.values(nextWorlds).filter((w) => w.stars > 0).length;
  const nextLevel = getLevelFromXp(candidateProgress.xp);

  const checks: Record<string, boolean> = {
    first_steps: candidateProgress.miniGamesPlayedCount >= 1,
    five_games: candidateProgress.miniGamesPlayedCount >= 5,
    world_hopper: worldsVisitedCount >= 5,
    halfway_atlas: worldsWithStars >= 13,
    az_legend: worldsWithStars >= 26,
    star_collector: candidateProgress.stars >= 25,
    coin_vault: candidateProgress.coins >= 500,
    sharp_mind: candidateProgress.totalCorrectAnswers >= 25,
    daily_hero: candidateProgress.dailyChallengeCompleted,
    level_five: nextLevel >= 5,
  };

  for (const ach of ACHIEVEMENTS) {
    if (!unlockedAchSet.has(ach.id) && checks[ach.id]) {
      unlockedAchSet.add(ach.id);
      newlyUnlockedAchievements.push(ach);
      coinsEarned += ach.rewardCoins;
      candidateProgress.coins += ach.rewardCoins;
    }
  }

  candidateProgress.unlockedAchievements = Array.from(unlockedAchSet);

  return {
    nextProgress: candidateProgress,
    summary: {
      title: `${gameMeta.title} Complete!`,
      subtitle: hitDaily
        ? `Daily Challenge Bonus Activated in ${letter} – ${ALPHABET_WORLDS[Math.max(0, currentWorldIdx)].name}!`
        : `Great work in ${letter} – ${ALPHABET_WORLDS[Math.max(0, currentWorldIdx)].name}!`,
      coinsEarned,
      xpEarned,
      starsEarned,
      score: params.score,
      isNewBest,
      newlyUnlockedAchievements,
      newlyUnlockedWorld,
    },
  };
}

export function loadProgress(): PlayerProgress {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createInitialProgress();
  }
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return createInitialProgress();
    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
    const base = createInitialProgress();
    return updateStreakOnSession({
      ...base,
      ...parsed,
      worlds: { ...base.worlds, ...(parsed.worlds ?? {}) },
      unlockedLetters: Array.isArray(parsed.unlockedLetters)
        ? parsed.unlockedLetters
        : base.unlockedLetters,
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
        ? parsed.unlockedAchievements
        : [],
      leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : base.leaderboard,
    });
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(progress: PlayerProgress): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage quota errors gracefully
  }
}

export function loadSettings(): GameSettings {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<GameSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
