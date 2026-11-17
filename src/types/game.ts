export type DifficultyMode = 'kids' | 'explorer' | 'master';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export type TextSize = 'normal' | 'large' | 'xlarge';

export type BiomeType =
  | 'orchard'
  | 'stadium'
  | 'cozy'
  | 'savannah'
  | 'ocean'
  | 'meadow'
  | 'glacier'
  | 'royal'
  | 'cosmos'
  | 'jungle'
  | 'music'
  | 'highland';

export type MiniGameId =
  | 'find_alphabet'
  | 'match_letter_object'
  | 'complete_missing'
  | 'arrange_scrambled'
  | 'spell_object'
  | 'find_hidden'
  | 'memory_match'
  | 'word_building'
  | 'timed_quiz'
  | 'alphabet_race'
  | 'collect_3d'
  | 'guess_description';

export interface WorldPalette {
  skyTop: string;
  skyHorizon: string;
  fog: string;
  ground: string;
  groundAccent: string;
  primary: string;
  secondary: string;
  accentHex: string;
}

export interface WordEntry {
  word: string;
  clue: string;
  hindi: string;
  odia: string;
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AlphabetWorld {
  letter: string;
  index: number;
  name: string;
  primaryWord: string;
  tagline: string;
  funFact: string;
  hindiWord: string;
  odiaWord: string;
  phonetic: string;
  biome: BiomeType;
  propType: string;
  palette: WorldPalette;
  kidsWords: WordEntry[];
  explorerWords: WordEntry[];
  masterWords: WordEntry[];
  quiz: Record<DifficultyMode, QuizQuestion>;
}

export interface MiniGameMeta {
  id: MiniGameId;
  title: string;
  shortDesc: string;
  category: 'Recognition' | 'Spelling' | '3D Action' | 'Brain';
  recommendedModes: DifficultyMode[];
  rewardCoins: number;
  rewardXp: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  requirementText: string;
  rewardCoins: number;
}

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  masterVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  voiceEnabled: boolean;
  showHindi: boolean;
  showOdia: boolean;
  audioInstructions: boolean;
  textSize: TextSize;
  parentalSafeExploreAll: boolean;
}

export interface WorldProgress {
  visited: boolean;
  stars: number; // 0 to 3
  bestScore: number;
  completedMiniGames: MiniGameId[];
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  mode: DifficultyMode;
  score: number;
  stars: number;
  dateIso: string;
}

export interface PlayerProgress {
  playerName: string;
  coins: number;
  xp: number;
  stars: number;
  streakDays: number;
  lastPlayedDate: string;
  dailyChallengeDate: string;
  dailyChallengeCompleted: boolean;
  unlockedLetters: string[];
  worlds: Record<string, WorldProgress>;
  unlockedAchievements: string[];
  miniGamesPlayedCount: number;
  totalCorrectAnswers: number;
  personalBestScore: number;
  leaderboard: LeaderboardEntry[];
}

export interface RewardSummary {
  title: string;
  subtitle: string;
  coinsEarned: number;
  xpEarned: number;
  starsEarned: number;
  score: number;
  isNewBest: boolean;
  newlyUnlockedAchievements: AchievementDef[];
  newlyUnlockedWorld?: string;
}
