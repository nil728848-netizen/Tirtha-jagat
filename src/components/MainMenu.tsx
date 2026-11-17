import React, { useEffect } from 'react';
import {
  Award,
  BookOpen,
  Gamepad2,
  Globe2,
  Info,
  Play,
  Settings,
  Swords,
  Volume2,
} from 'lucide-react';
import { ALPHABET_WORLDS, MINI_GAMES } from '../data/worlds';
import { getDailyChallenge, getXpProgressInLevel } from '../game/progression';
import { AlphabetWorld, DifficultyMode, PlayerProgress } from '../types/game';

interface MainMenuProps {
  activeWorld: AlphabetWorld;
  mode: DifficultyMode;
  progress: PlayerProgress;
  onSelectMode: (mode: DifficultyMode) => void;
  onStartAdventure: () => void;
  onOpenAtlas: () => void;
  onOpenMiniGames: () => void;
  onOpenMultiplayer: () => void;
  onOpenProgress: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onLaunchDaily: (letter: string) => void;
  onPronounceActive: () => void;
}

const MODE_CARDS: {
  id: DifficultyMode;
  label: string;
  audience: string;
  summary: string;
}[] = [
  {
    id: 'kids',
    label: 'Kids Mode',
    audience: 'Phonics & Basics',
    summary: 'A for Apple · Picture matching · Voice & simple spelling',
  },
  {
    id: 'explorer',
    label: 'Explorer Mode',
    audience: 'Vocabulary & Logic',
    summary: 'Word puzzles · Missing letters · Science & world trivia',
  },
  {
    id: 'master',
    label: 'Master Mode',
    audience: 'Timed & Advanced',
    summary: 'Anagrams · Word building · Advanced quizzes & speed',
  },
];

export const MainMenu: React.FC<MainMenuProps> = ({
  activeWorld,
  mode,
  progress,
  onSelectMode,
  onStartAdventure,
  onOpenAtlas,
  onOpenMiniGames,
  onOpenMultiplayer,
  onOpenProgress,
  onOpenSettings,
  onOpenAbout,
  onLaunchDaily,
  onPronounceActive,
}) => {
  const xpInfo = getXpProgressInLevel(progress.xp);
  const daily = getDailyChallenge();
  const dailyWorld = ALPHABET_WORLDS.find((w) => w.letter === daily.letter) ?? ALPHABET_WORLDS[0];
  const dailyGame = MINI_GAMES.find((g) => g.id === daily.miniGameId) ?? MINI_GAMES[0];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
        e.preventDefault();
        onStartAdventure();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStartAdventure]);

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between pointer-events-none"
      style={{
        background:
          'linear-gradient(90deg, rgba(9, 13, 28, 0.88) 0%, rgba(9, 13, 28, 0.72) 44%, rgba(9, 13, 28, 0.06) 100%)',
      }}
    >
      {/* Top Safe Strip: Player Telemetry & Quick Audio */}
      <div className="flex items-center justify-between px-4 sm:px-8 pt-4 pb-2 pointer-events-auto">
        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
          <span className="font-bold text-amber-300 tabular-nums">Lv.{xpInfo.level}</span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="tabular-nums font-semibold">{progress.coins} Coins</span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="tabular-nums font-semibold">{progress.stars} Stars</span>
          <span aria-hidden="true" className="text-slate-500 hidden sm:inline">·</span>
          <span className="hidden sm:inline tabular-nums text-emerald-300">
            {progress.streakDays}d Streak
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPronounceActive}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900/85 hover:bg-slate-800 text-amber-300 border border-white/15 cursor-pointer whitespace-nowrap"
            aria-label={`Hear pronunciation for ${activeWorld.letter} for ${activeWorld.primaryWord}`}
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">{activeWorld.letter} · {activeWorld.primaryWord}</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-slate-100 border border-white/15 cursor-pointer"
            aria-label="Open Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenAbout}
            className="p-2 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-slate-100 border border-white/15 cursor-pointer"
            aria-label="About and Credits"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Region (Left-aligned so 3D world centerpiece shines on right) */}
      <div className="flex-1 flex items-center px-4 sm:px-8 overflow-y-auto game-scroll py-2">
        <div className="w-full max-w-2xl pointer-events-auto space-y-5">
          {/* Bespoke SVG Title Lockup */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="38" height="38" rx="10" fill="#F59E0B" />
                <rect x="5" y="5" width="32" height="32" rx="7" fill="#0F172A" />
                <text
                  x="21"
                  y="27"
                  textAnchor="middle"
                  fill="#FBBF24"
                  fontWeight="800"
                  fontSize="18"
                  fontFamily="Bricolage Grotesque, sans-serif"
                >
                  A-Z
                </text>
              </svg>
              <span className="text-xs font-semibold tracking-[0.2em] text-amber-300 uppercase">
                The Ultimate A to Z World
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.05] text-balance">
              ALPHABET ADVENTURE
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-lg">
              Explore 26 living 3D worlds, master English vocabulary with Hindi &amp; Odia support, and conquer 12 interactive mini-games.
            </p>
          </div>

          {/* 3 Selectable Difficulty Modes */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Difficulty Mode
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {MODE_CARDS.map((card) => {
                const active = mode === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => onSelectMode(card.id)}
                    aria-pressed={active}
                    className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                      active
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-900/85 text-slate-100 border-white/15 hover:border-amber-400/50'
                    }`}
                  >
                    <div className="font-display font-bold text-sm leading-tight">
                      {card.label}
                    </div>
                    <div
                      className={`text-[11px] mt-0.5 font-medium ${
                        active ? 'text-slate-900/80' : 'text-amber-300'
                      }`}
                    >
                      {card.audience}
                    </div>
                    <div
                      className={`text-[11px] mt-1 leading-snug hidden sm:block ${
                        active ? 'text-slate-900/90' : 'text-slate-400'
                      }`}
                    >
                      {card.summary}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Start CTA + World Destination */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-start="true"
              onClick={onStartAdventure}
              className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-base tracking-wide transition-colors cursor-pointer shadow-lg shadow-emerald-950/50 whitespace-nowrap"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Play {activeWorld.letter} – {activeWorld.name}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAtlas}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-sm border border-white/20 cursor-pointer whitespace-nowrap"
            >
              <Globe2 className="w-4 h-4 text-sky-400" />
              <span>All 26 Worlds (A–Z)</span>
            </button>
          </div>

          {/* Secondary Feature Dock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={onOpenMiniGames}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-xs sm:text-sm font-semibold text-slate-100 cursor-pointer whitespace-nowrap"
            >
              <Gamepad2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Mini-Games</span>
            </button>
            <button
              type="button"
              onClick={onOpenMultiplayer}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-xs sm:text-sm font-semibold text-slate-100 cursor-pointer whitespace-nowrap"
            >
              <Swords className="w-4 h-4 text-rose-400 shrink-0" />
              <span>2P Battle</span>
            </button>
            <button
              type="button"
              onClick={onOpenProgress}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-xs sm:text-sm font-semibold text-slate-100 cursor-pointer whitespace-nowrap"
            >
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Progress</span>
            </button>
            <button
              type="button"
              onClick={() => onLaunchDaily(dailyWorld.letter)}
              title={`Daily Bonus: ${dailyWorld.letter} – ${dailyGame.title}`}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-400/35 text-xs sm:text-sm font-semibold text-amber-200 cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                {progress.dailyChallengeCompleted
                  ? 'Daily Done'
                  : `Daily: ${dailyWorld.letter}`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Menu Footer with Official Developer Credit */}
      <footer className="px-4 sm:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-slate-300/85 pointer-events-auto border-t border-white/10 bg-slate-950/75">
        <div>
          Controls: WASD / Arrows Move · Space Jump · Click 3D Objects to Pronounce
        </div>
        <div className="font-semibold tracking-wide text-amber-300">
          DEVELOPED BY TIRTHA JAGAT · FROM NUAPADA, ODISHA, INDIA
        </div>
      </footer>
    </div>
  );
};
