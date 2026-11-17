import React, { useState } from 'react';
import { CheckCircle2, Play, Sparkles, X } from 'lucide-react';
import { MINI_GAMES } from '../data/worlds';
import { getDailyChallenge } from '../game/progression';
import { AlphabetWorld, DifficultyMode, MiniGameId, PlayerProgress } from '../types/game';

interface MiniGameHubModalProps {
  world: AlphabetWorld;
  mode: DifficultyMode;
  progress: PlayerProgress;
  onSelectGame: (gameId: MiniGameId) => void;
  onClose: () => void;
}

export const MiniGameHubModal: React.FC<MiniGameHubModalProps> = ({
  world,
  mode,
  progress,
  onSelectGame,
  onClose,
}) => {
  const [category, setCategory] = useState<'All' | 'Recognition' | 'Spelling' | '3D Action' | 'Brain'>('All');
  const daily = getDailyChallenge();
  const completedInWorld = new Set(progress.worlds[world.letter]?.completedMiniGames ?? []);

  const filtered = MINI_GAMES.filter(
    (g) => category === 'All' || g.category === category,
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85"
      role="dialog"
      aria-modal="true"
      aria-label="12 Educational Mini-Games"
    >
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">
              Mini-Games Arcade · {world.letter} – {world.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              12 playable activities tuned for <span className="text-amber-300 font-semibold capitalize">{mode} Mode</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            aria-label="Close Mini-Games Hub"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-1.5 px-5 py-3 bg-slate-950/50 border-b border-white/10">
          {(['All', 'Recognition', 'Spelling', '3D Action', 'Brain'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                category === cat
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="flex-1 p-4 sm:p-5 game-scroll">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((game, idx) => {
              const isCompleted = completedInWorld.has(game.id);
              const isDaily =
                !progress.dailyChallengeCompleted &&
                daily.letter === world.letter &&
                daily.miniGameId === game.id;

              return (
                <div
                  key={game.id}
                  className={`flex flex-col justify-between p-4 rounded-xl border transition-colors ${
                    isDaily
                      ? 'bg-slate-800 border-amber-400'
                      : 'bg-slate-800/70 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-1.5">
                      <span>
                        {String(idx + 1).padStart(2, '0')} · {game.category}
                      </span>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                        </span>
                      )}
                      {isDaily && (
                        <span className="flex items-center gap-1 text-amber-300 font-semibold">
                          <Sparkles className="w-3.5 h-3.5" /> Daily Bonus
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-bold text-base text-white">
                      {game.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {game.shortDesc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono-tabular text-amber-300">
                      +{game.rewardCoins} Coins · +{game.rewardXp} XP
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectGame(game.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer whitespace-nowrap"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
