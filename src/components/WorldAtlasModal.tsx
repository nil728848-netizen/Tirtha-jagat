import React, { useState } from 'react';
import { Lock, Search, Star, Volume2, X } from 'lucide-react';
import { ALPHABET_WORLDS } from '../data/worlds';
import { AlphabetWorld, GameSettings, PlayerProgress } from '../types/game';

interface WorldAtlasModalProps {
  activeLetter: string;
  progress: PlayerProgress;
  settings: GameSettings;
  onSelectWorld: (world: AlphabetWorld) => void;
  onPronounceWorld: (world: AlphabetWorld) => void;
  onClose: () => void;
}

export const WorldAtlasModal: React.FC<WorldAtlasModalProps> = ({
  activeLetter,
  progress,
  settings,
  onSelectWorld,
  onPronounceWorld,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'mastered'>('all');

  const filtered = ALPHABET_WORLDS.filter((w) => {
    const wp = progress.worlds[w.letter];
    const isUnlocked =
      settings.parentalSafeExploreAll || progress.unlockedLetters.includes(w.letter);
    if (filter === 'unlocked' && !isUnlocked) return false;
    if (filter === 'mastered' && (!wp || wp.stars < 1)) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      w.letter.toLowerCase().includes(q) ||
      w.name.toLowerCase().includes(q) ||
      w.primaryWord.toLowerCase().includes(q) ||
      w.hindiWord.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85"
      role="dialog"
      aria-modal="true"
      aria-label="A to Z World Atlas"
    >
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">
              26 Alphabet Worlds (A–Z Atlas)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Travel instantly to any themed 3D world · Earn 3 Stars in each world!
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            aria-label="Close World Atlas"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-950/50 border-b border-white/10">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-800">
            {(['all', 'unlocked', 'mastered'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize cursor-pointer whitespace-nowrap ${
                  filter === tab
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab === 'all' ? 'All 26' : tab === 'unlocked' ? 'Accessible' : 'Starred'}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search A–Z world or word..."
              aria-label="Search alphabet worlds"
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* 26 Worlds Grid */}
        <div className="flex-1 p-4 sm:p-5 game-scroll">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((world) => {
              const wp = progress.worlds[world.letter];
              const stars = wp?.stars ?? 0;
              const isUnlocked =
                settings.parentalSafeExploreAll ||
                progress.unlockedLetters.includes(world.letter);
              const isCurrent = activeLetter === world.letter;

              return (
                <div
                  key={world.letter}
                  className={`flex flex-col justify-between p-3.5 rounded-xl border transition-colors ${
                    isCurrent
                      ? 'bg-slate-800 border-amber-400'
                      : 'bg-slate-800/60 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-extrabold text-2xl text-white shrink-0"
                        style={{ backgroundColor: world.palette.accentHex }}
                      >
                        {world.letter}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-white leading-tight">
                          {world.letter} – {world.name}
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {world.primaryWord}
                          {settings.showHindi && ` · ${world.hindiWord}`}
                        </p>
                        {settings.showOdia && (
                          <p className="text-[11px] text-amber-300/90 mt-0.5">
                            Odia: {world.odiaWord}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onPronounceWorld(world)}
                      className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-700 text-amber-300 cursor-pointer shrink-0"
                      aria-label={`Pronounce ${world.letter} for ${world.primaryWord}`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1" aria-label={`${stars} of 3 stars`}>
                      {[1, 2, 3].map((idx) => (
                        <Star
                          key={idx}
                          className={`w-4 h-4 ${
                            idx <= stars
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={!isUnlocked}
                      onClick={() => onSelectWorld(world)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                        !isUnlocked
                          ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          : isCurrent
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      {!isUnlocked ? (
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : isCurrent ? (
                        'Current World'
                      ) : (
                        'Travel Here'
                      )}
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
