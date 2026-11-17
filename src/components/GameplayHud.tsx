import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Globe2,
  Pause,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { getXpProgressInLevel } from '../game/progression';
import { Active3DChallenge, MobileControlVector } from '../three/WorldStage';
import {
  AlphabetWorld,
  DifficultyMode,
  GameSettings,
  MiniGameId,
  PlayerProgress,
} from '../types/game';

interface GameplayHudProps {
  world: AlphabetWorld;
  mode: DifficultyMode;
  progress: PlayerProgress;
  settings: GameSettings;
  activeChallenge: Active3DChallenge;
  raceScore: number;
  mobileInputRef: React.MutableRefObject<MobileControlVector>;
  onPronounce: () => void;
  onToggleMute: () => void;
  onOpenAtlas: () => void;
  onOpenMiniGames: () => void;
  onQuickLaunchMiniGame: (id: MiniGameId) => void;
  onCancel3DChallenge: () => void;
  onPause: () => void;
}

export const GameplayHud: React.FC<GameplayHudProps> = ({
  world,
  mode,
  progress,
  settings,
  activeChallenge,
  raceScore,
  mobileInputRef,
  onPronounce,
  onToggleMute,
  onOpenAtlas,
  onOpenMiniGames,
  onQuickLaunchMiniGame,
  onCancel3DChallenge,
  onPause,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [showFact, setShowFact] = useState(false);
  const xpInfo = getXpProgressInLevel(progress.xp);
  const isMuted = settings.masterVolume <= 0.01 || (!settings.sfxEnabled && !settings.voiceEnabled);

  const setDir = (dx: number, dz: number) => {
    mobileInputRef.current.dx = dx;
    mobileInputRef.current.dz = dz;
  };
  const setJump = (val: boolean) => {
    mobileInputRef.current.jump = val;
  };

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* Top Row: Left World/Score Cluster & Right Utility Cluster */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-Left World Badge */}
        <div
          className="pointer-events-auto rounded-2xl px-2.5 sm:px-3.5 py-2 sm:py-2.5 border border-white/15 shadow-lg max-w-[188px] sm:max-w-xs min-w-0"
          style={{ background: 'rgba(15, 23, 42, 0.88)' }}
        >
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-display text-lg sm:text-xl font-extrabold text-white shrink-0"
              style={{ backgroundColor: world.palette.accentHex }}
            >
              {world.letter}
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold text-xs sm:text-base text-white truncate">
                {world.letter} – {world.name}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-300 truncate">
                {world.primaryWord}
                {settings.showHindi ? ` · ${world.hindiWord.split(' ')[0]}` : ''}
                {settings.showOdia ? ` · ${world.odiaWord.split(' ')[0]}` : ''}
              </div>
            </div>
          </div>

          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-white/10 flex items-center gap-1.5 sm:gap-2.5 text-[10px] sm:text-[11px] font-mono-tabular text-slate-200 whitespace-nowrap">
            <span className="text-amber-300 font-bold">Lv.{xpInfo.level}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-amber-200">{progress.coins}c</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{progress.stars}★</span>
            <span aria-hidden="true" className="text-slate-600 hidden sm:inline">·</span>
            <span className="capitalize text-emerald-300 hidden sm:inline">{mode}</span>
          </div>
        </div>

        {/* Center Active 3D Mission Banner (if running collect_3d, find_hidden, alphabet_race) */}
        {activeChallenge.type !== 'explore' && (
          <div
            className="pointer-events-auto rounded-2xl px-4 py-2.5 border border-amber-400/50 shadow-xl flex items-center gap-3"
            style={{ background: 'rgba(15, 23, 42, 0.92)' }}
          >
            {activeChallenge.type === 'collect_3d' && activeChallenge.targetWord && (
              <div className="text-center">
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  3D Mission: Collect Letters
                </div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {activeChallenge.targetWord.split('').map((ch, idx) => {
                    const got = activeChallenge.collectedIndices?.includes(idx);
                    return (
                      <span
                        key={idx}
                        className={`w-6 h-7 rounded-md font-mono-tabular text-sm font-extrabold flex items-center justify-center ${
                          got
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 border border-white/15'
                        }`}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {activeChallenge.type === 'find_hidden' && (
              <div className="text-center">
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Find Hidden Gold Stars
                </div>
                <div className="font-mono-tabular text-base font-extrabold text-white mt-0.5">
                  {activeChallenge.hiddenFound ?? 0} / {activeChallenge.hiddenTotal ?? 4} Found
                </div>
              </div>
            )}

            {activeChallenge.type === 'alphabet_race' && (
              <div className="text-center">
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Alphabet Race · Round {(activeChallenge.raceRound ?? 0) + 1}/3
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  Steer through Gate{' '}
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-extrabold">
                    {activeChallenge.raceTargetLetter}
                  </span>{' '}
                  · {raceScore} pts
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onCancel3DChallenge}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              aria-label="Exit 3D Activity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top-Right Compact Action Cluster */}
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onPronounce();
            }}
            className="p-2 sm:p-2.5 rounded-xl border border-white/15 text-amber-300 hover:bg-slate-800 cursor-pointer"
            style={{ background: 'rgba(15, 23, 42, 0.88)' }}
            aria-label="Pronounce World Letter and Word"
            title="Hear Pronunciation (V)"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenAtlas();
            }}
            className="p-2 sm:p-2.5 rounded-xl border border-white/15 text-sky-300 hover:bg-slate-800 cursor-pointer"
            style={{ background: 'rgba(15, 23, 42, 0.88)' }}
            aria-label="Open A to Z World Atlas"
            title="All 26 Worlds (M)"
          >
            <Globe2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenMiniGames();
            }}
            className="p-2 sm:p-2.5 rounded-xl border border-white/15 text-emerald-300 hover:bg-slate-800 cursor-pointer"
            style={{ background: 'rgba(15, 23, 42, 0.88)' }}
            aria-label="Open Mini-Games Arcade"
            title="12 Mini-Games (G)"
          >
            <Gamepad2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="hidden sm:flex p-2.5 rounded-xl border border-white/15 text-slate-200 hover:bg-slate-800 cursor-pointer"
            style={{ background: 'rgba(15, 23, 42, 0.88)' }}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            className="p-2 sm:p-2.5 rounded-xl border border-white/15 text-white hover:bg-slate-800 cursor-pointer"
            style={{ background: 'rgba(15, 23, 42, 0.88)' }}
            aria-label="Pause Game"
            title="Pause (Esc / P)"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fun Fact Popover if toggled */}
      {showFact && (
        <div
          className="pointer-events-auto self-center max-w-md rounded-2xl p-4 border border-amber-400/40 shadow-2xl text-center"
          style={{ background: 'rgba(15, 23, 42, 0.94)' }}
        >
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            {world.letter} – {world.name} Discovery
          </div>
          <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed">
            {world.funFact}
          </p>
          <button
            type="button"
            onClick={() => setShowFact(false)}
            className="mt-3 px-4 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
          >
            Got It!
          </button>
        </div>
      )}

      {/* Bottom Row: On mobile, D-Pad & Jump sit cleanly on bottom row while Activity Dock sits right above them */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-end justify-between gap-2.5">
        <div className="flex items-end justify-between w-full sm:w-auto sm:contents">
          {/* Left: Compact Touch Pad for Android / Mobile & Mouse */}
          <div
            className="pointer-events-auto grid grid-cols-3 gap-1 p-1.5 rounded-2xl border border-white/15 sm:opacity-85 hover:opacity-100 sm:order-1"
            style={{ background: 'rgba(15, 23, 42, 0.82)' }}
            aria-label="Movement Touch Controls"
          >
            <div />
            <button
              type="button"
              onPointerDown={() => setDir(0, -1)}
              onPointerUp={() => setDir(0, 0)}
              onPointerLeave={() => setDir(0, 0)}
              className="w-10 h-10 rounded-xl bg-slate-800 active:bg-amber-400 active:text-slate-950 text-white flex items-center justify-center touch-none cursor-pointer"
              aria-label="Move Forward"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <div />
            <button
              type="button"
              onPointerDown={() => setDir(-1, 0)}
              onPointerUp={() => setDir(0, 0)}
              onPointerLeave={() => setDir(0, 0)}
              className="w-10 h-10 rounded-xl bg-slate-800 active:bg-amber-400 active:text-slate-950 text-white flex items-center justify-center touch-none cursor-pointer"
              aria-label="Move Left"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onPointerDown={() => setDir(0, 1)}
              onPointerUp={() => setDir(0, 0)}
              onPointerLeave={() => setDir(0, 0)}
              className="w-10 h-10 rounded-xl bg-slate-800 active:bg-amber-400 active:text-slate-950 text-white flex items-center justify-center touch-none cursor-pointer"
              aria-label="Move Backward"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onPointerDown={() => setDir(1, 0)}
              onPointerUp={() => setDir(0, 0)}
              onPointerLeave={() => setDir(0, 0)}
              className="w-10 h-10 rounded-xl bg-slate-800 active:bg-amber-400 active:text-slate-950 text-white flex items-center justify-center touch-none cursor-pointer"
              aria-label="Move Right"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Touch Jump Button */}
          <button
            type="button"
            onPointerDown={() => setJump(true)}
            onPointerUp={() => setJump(false)}
            onPointerLeave={() => setJump(false)}
            className="pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400 active:bg-amber-300 text-slate-950 font-display font-extrabold text-xs sm:text-sm shadow-lg border border-amber-200 flex items-center justify-center touch-none cursor-pointer sm:order-3"
            aria-label="Jump"
          >
            JUMP
          </button>
        </div>

        {/* Center: Collapsible Bottom Activity Dock */}
        <div className="pointer-events-auto flex flex-col items-center w-full sm:w-auto sm:max-w-[660px] sm:order-2">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            className="px-3 py-1 rounded-t-xl border border-b-0 border-white/15 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
            style={{ background: 'rgba(15, 23, 42, 0.88)' }}
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Show Activities
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Hide Dock
              </>
            )}
          </button>

          {!dockCollapsed && (
            <div
              className="flex items-center gap-1.5 sm:gap-2 p-2 rounded-2xl border border-white/15 shadow-xl overflow-x-auto max-w-full"
              style={{ background: 'rgba(15, 23, 42, 0.9)' }}
            >
              <button
                type="button"
                onClick={() => setShowFact((v) => !v)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>World Fact</span>
              </button>
              <button
                type="button"
                onClick={() => onQuickLaunchMiniGame('collect_3d')}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Collect 3D
              </button>
              <button
                type="button"
                onClick={() => onQuickLaunchMiniGame('find_hidden')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Hidden Stars
              </button>
              <button
                type="button"
                onClick={() => onQuickLaunchMiniGame('alphabet_race')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              >
                3D Race
              </button>
              <button
                type="button"
                onClick={() => onQuickLaunchMiniGame('spell_object')}
                className="hidden md:inline-flex px-3 py-2 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Spell Word
              </button>
              <button
                type="button"
                onClick={onOpenMiniGames}
                className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
              >
                All 12 Games
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
