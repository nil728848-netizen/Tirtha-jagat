import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Coins,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  X,
} from 'lucide-react';
import { ALPHABET_WORLDS, MINI_GAMES } from '../data/worlds';
import {
  ACHIEVEMENTS,
  getDailyChallenge,
  getXpProgressInLevel,
} from '../game/progression';
import {
  GameSettings,
  GraphicsQuality,
  PlayerProgress,
  RewardSummary,
  TextSize,
} from '../types/game';

/* ======================== DARK & GOLD CREDITS CARD ======================== */
export const DeveloperCreditsCard: React.FC = () => (
  <div
    className="p-6 sm:p-8 rounded-2xl border border-amber-400/40 text-center"
    style={{
      background:
        'radial-gradient(circle at 50% 0%, rgba(251, 191, 36, 0.14) 0%, rgba(15, 23, 42, 0.96) 65%)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
    }}
  >
    <p className="text-[11px] font-semibold tracking-[0.26em] text-amber-300/80 uppercase">
      Official Developer Identity
    </p>
    <h3 className="font-display text-lg sm:text-xl font-extrabold text-white mt-2">
      ALPHABET ADVENTURE – THE ULTIMATE A TO Z WORLD
    </h3>
    <div className="my-5 h-px w-28 mx-auto bg-amber-400/40" />
    <p className="text-xs tracking-[0.24em] text-slate-400 uppercase">DEVELOPED BY</p>
    <p className="font-display text-2xl sm:text-3xl font-extrabold tracking-wider text-amber-300 mt-1">
      TIRTHA JAGAT
    </p>
    <p className="text-xs tracking-[0.22em] text-slate-400 uppercase mt-4">FROM</p>
    <p className="text-sm sm:text-base font-bold tracking-[0.14em] text-amber-100 mt-1">
      NUAPADA, ODISHA, INDIA
    </p>
  </div>
);

/* ======================== PROGRESS & ACHIEVEMENTS MODAL ======================== */
export const ProgressModal: React.FC<{
  progress: PlayerProgress;
  onUpdateName: (name: string) => void;
  onClose: () => void;
}> = ({ progress, onUpdateName, onClose }) => {
  const xpInfo = getXpProgressInLevel(progress.xp);
  const daily = getDailyChallenge();
  const dailyWorld = ALPHABET_WORLDS.find((w) => w.letter === daily.letter) ?? ALPHABET_WORLDS[0];
  const dailyGame = MINI_GAMES.find((g) => g.id === daily.miniGameId) ?? MINI_GAMES[0];
  const worldsCompleted = Object.values(progress.worlds).filter((w) => w.stars > 0).length;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85"
      role="dialog"
      aria-modal="true"
      aria-label="Player Progress Dashboard"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-emerald-400" />
            <h2 className="font-display text-xl font-extrabold text-white">
              Explorer Profile &amp; Achievements
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            aria-label="Close Progress"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-5 game-scroll space-y-6">
          {/* Profile + XP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 p-4 rounded-xl bg-slate-800/80 border border-white/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label htmlFor="player-profile-name" className="text-xs text-slate-400 block">
                    Adventurer Name
                  </label>
                  <input
                    id="player-profile-name"
                    type="text"
                    maxLength={20}
                    value={progress.playerName}
                    onChange={(e) => onUpdateName(e.target.value)}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-base font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="text-right">
                  <div className="text-xs text-amber-300 font-semibold">Player Level</div>
                  <div className="font-display text-3xl font-extrabold text-white tabular-nums">
                    Level {xpInfo.level}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>XP Progress ({progress.xp} total XP)</span>
                  <span className="font-mono-tabular">
                    {xpInfo.currentLevelXp} / {xpInfo.nextLevelXp} XP
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all"
                    style={{ width: `${xpInfo.percent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-amber-400/30 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Daily Challenge
                </div>
                <div className="font-display font-bold text-base text-white mt-1">
                  {dailyWorld.letter} – {dailyWorld.name}
                </div>
                <div className="text-xs text-slate-300 mt-0.5">{dailyGame.title}</div>
              </div>
              <div className="mt-3 text-xs font-bold">
                {progress.dailyChallengeCompleted ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Completed Today!
                  </span>
                ) : (
                  <span className="text-amber-300">
                    Bonus: +{daily.bonusCoins} Coins · +{daily.bonusXp} XP
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stat Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/70 border border-white/10">
              <div className="text-xs text-slate-400">Coins</div>
              <div className="font-mono-tabular text-xl font-extrabold text-amber-300">
                {progress.coins}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/70 border border-white/10">
              <div className="text-xs text-slate-400">Stars Earned</div>
              <div className="font-mono-tabular text-xl font-extrabold text-white">
                {progress.stars} / 78
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/70 border border-white/10">
              <div className="text-xs text-slate-400">Worlds Starred</div>
              <div className="font-mono-tabular text-xl font-extrabold text-emerald-400">
                {worldsCompleted} / 26
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/70 border border-white/10">
              <div className="text-xs text-slate-400">Daily Streak</div>
              <div className="font-mono-tabular text-xl font-extrabold text-sky-300">
                {progress.streakDays} Days
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div>
            <h3 className="font-display font-bold text-base text-white mb-3">
              Achievement Badges ({progress.unlockedAchievements.length}/{ACHIEVEMENTS.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = progress.unlockedAchievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                      unlocked
                        ? 'bg-emerald-500/15 border-emerald-400/50'
                        : 'bg-slate-800/40 border-white/10 opacity-75'
                    }`}
                  >
                    <Trophy
                      className={`w-5 h-5 mt-0.5 shrink-0 ${
                        unlocked ? 'text-amber-400' : 'text-slate-600'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-white">{ach.title}</span>
                        <span className="text-[11px] font-mono-tabular text-amber-300">
                          +{ach.rewardCoins}c
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{ach.description}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {unlocked ? 'Unlocked!' : ach.requirementText}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ======================== SETTINGS & CREDITS MODAL ======================== */
export const SettingsModal: React.FC<{
  settings: GameSettings;
  initialTab?: 'general' | 'credits' | 'about';
  onChange: (next: GameSettings) => void;
  onResetProgress: () => void;
  onClose: () => void;
}> = ({ settings, initialTab = 'general', onChange, onResetProgress, onClose }) => {
  const [tab, setTab] = useState<'general' | 'about' | 'credits'>(initialTab);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85"
      role="dialog"
      aria-modal="true"
      aria-label="Game Settings and Credits"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="font-display text-xl font-extrabold text-white">
            Settings, Guide &amp; Credits
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-5 py-3 bg-slate-950/50 border-b border-white/10">
          {(
            [
              { id: 'general', label: 'Audio, Graphics & Safety' },
              { id: 'about', label: 'About & Android Guide' },
              { id: 'credits', label: 'Credits' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                tab === t.id
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-5 game-scroll space-y-5">
          {tab === 'general' && (
            <>
              {/* Graphics Quality */}
              <div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  3D Graphics Quality
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => onChange({ ...settings, graphicsQuality: q })}
                      className={`py-2.5 rounded-xl border text-xs font-bold capitalize cursor-pointer ${
                        settings.graphicsQuality === q
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-800 text-slate-200 border-white/15'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio & Volume */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-800/70 border border-white/10">
                <div className="flex items-center justify-between">
                  <label htmlFor="vol-slider" className="text-sm font-semibold text-white">
                    Master Volume ({Math.round(settings.masterVolume * 100)}%)
                  </label>
                  <input
                    id="vol-slider"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.masterVolume}
                    onChange={(e) =>
                      onChange({ ...settings, masterVolume: Number(e.target.value) })
                    }
                    className="w-40 accent-amber-400"
                  />
                </div>

                {[
                  { key: 'musicEnabled', label: 'Background Music' },
                  { key: 'sfxEnabled', label: 'Sound Effects' },
                  { key: 'voiceEnabled', label: 'Voice Pronunciation (Speech)' },
                  { key: 'audioInstructions', label: 'Audio Activity Instructions' },
                  { key: 'showHindi', label: 'Show Hindi Translations (हिन्दी)' },
                  { key: 'showOdia', label: 'Show Odia Translations (ଓଡ଼ିଆ)' },
                  {
                    key: 'parentalSafeExploreAll',
                    label: 'Allow Exploring All 26 Worlds Immediately',
                  },
                ].map((item) => {
                  const k = item.key as keyof GameSettings;
                  const val = Boolean(settings[k]);
                  return (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <span className="text-sm text-slate-200">{item.label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={val}
                        onClick={() => onChange({ ...settings, [k]: !val })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          val
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {val ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Accessibility Text Size */}
              <div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Accessibility Text Size
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'normal', label: 'Standard' },
                      { id: 'large', label: 'Large' },
                      { id: 'xlarge', label: 'Extra Large' },
                    ] as { id: TextSize; label: string }[]
                  ).map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => onChange({ ...settings, textSize: sz.id })}
                      className={`py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                        settings.textSize === sz.id
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-800 text-slate-200 border-white/15'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Reset */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Progress saves automatically on this device via LocalStorage.
                </span>
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold cursor-pointer"
                  >
                    Reset Save
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onResetProgress();
                      setConfirmReset(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                )}
              </div>
            </>
          )}

          {tab === 'about' && (
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-white/10">
                <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Child-Safe &amp; All-Age Design
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm">
                  Zero third-party advertisements, zero personal data collection, and zero unmoderated public chat. Designed for kids learning phonics, students building vocabulary, and adults enjoying timed anagrams &amp; trivia.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-white/10 space-y-2">
                <h3 className="font-display font-bold text-base text-white">
                  How to Play on Android &amp; Desktop
                </h3>
                <p className="text-xs sm:text-sm">
                  <strong className="text-amber-300">Android Mobile Browser:</strong> Open the game URL in Chrome on Android. Use the on-screen touch pad (bottom-left) to steer your 3D Explorer and tap Jump or 3D objects directly. Tip: Tap Chrome’s menu → <em>Add to Home screen</em> for a full-screen app experience!
                </p>
                <p className="text-xs sm:text-sm">
                  <strong className="text-amber-300">Desktop Browser:</strong> Move with <strong>W/A/S/D</strong> or <strong>Arrow Keys</strong>, press <strong>Space</strong> to Jump, click 3D Monuments to hear English/Hindi/Odia pronunciation, and press <strong>Esc / P</strong> to Pause.
                </p>
              </div>

              <DeveloperCreditsCard />
            </div>
          )}

          {tab === 'credits' && (
            <div className="space-y-4">
              <DeveloperCreditsCard />
              <p className="text-xs text-center text-slate-400">
                Crafted with Three.js, React, Web Audio API, and multilingual educational design.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ======================== REWARD & VICTORY MODAL ======================== */
export const RewardModal: React.FC<{
  summary: RewardSummary;
  onContinue: () => void;
}> = ({ summary, onContinue }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/88"
      role="dialog"
      aria-modal="true"
      aria-label="Mission Rewards"
    >
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-amber-400/40 shadow-2xl p-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((idx) => (
            <Star
              key={idx}
              className={`w-9 h-9 ${
                idx <= summary.starsEarned
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-700'
              }`}
            />
          ))}
        </div>

        <div>
          <h2 className="font-display text-2xl font-extrabold text-white">
            {summary.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">{summary.subtitle}</p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-800 border border-white/10">
            <div className="text-[11px] text-slate-400">Score</div>
            <div className="font-mono-tabular text-lg font-extrabold text-white">
              {summary.score}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 border border-white/10">
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" /> Coins
            </div>
            <div className="font-mono-tabular text-lg font-extrabold text-amber-300">
              +{summary.coinsEarned}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 border border-white/10">
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" /> XP
            </div>
            <div className="font-mono-tabular text-lg font-extrabold text-sky-300">
              +{summary.xpEarned}
            </div>
          </div>
        </div>

        {summary.newlyUnlockedWorld && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs font-bold text-emerald-200">
            World {summary.newlyUnlockedWorld} Unlocked in A–Z Atlas!
          </div>
        )}

        {summary.newlyUnlockedAchievements.length > 0 && (
          <div className="space-y-1.5 text-left">
            {summary.newlyUnlockedAchievements.map((a) => (
              <div
                key={a.id}
                className="p-2.5 rounded-xl bg-amber-400/15 border border-amber-400/40 text-xs text-amber-200 flex items-center gap-2"
              >
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Badge Unlocked: <strong>{a.title}</strong> (+{a.rewardCoins} Coins)
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-white/10 text-[11px] tracking-wider text-amber-200/80 uppercase">
          DEVELOPED BY TIRTHA JAGAT · NUAPADA, ODISHA, INDIA
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm cursor-pointer"
        >
          Continue Adventure
        </button>
      </div>
    </div>
  );
};
