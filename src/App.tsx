import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Settings, Globe2, Home } from 'lucide-react';
import { soundEngine } from './audio/soundEngine';
import { DeveloperSplash } from './components/DeveloperSplash';
import { GameplayHud } from './components/GameplayHud';
import { MainMenu } from './components/MainMenu';
import { MiniGameHubModal } from './components/MiniGameHubModal';
import { MiniGameModal } from './components/MiniGameModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import {
  ProgressModal,
  RewardModal,
  SettingsModal,
} from './components/ProgressAndSettingsModals';
import { WorldAtlasModal } from './components/WorldAtlasModal';
import { ALPHABET_WORLDS, getWorldByLetter } from './data/worlds';
import { deterministicShuffle, getWordsForMode } from './game/minigameLogic';
import {
  applyMiniGameResult,
  createInitialProgress,
  getDailyChallenge,
  loadProgress,
  loadSettings,
  saveProgress,
  saveSettings,
} from './game/progression';
import {
  Active3DChallenge,
  MobileControlVector,
  WorldStage,
} from './three/WorldStage';
import {
  AlphabetWorld,
  DifficultyMode,
  GameSettings,
  MiniGameId,
  PlayerProgress,
  RewardSummary,
} from './types/game';

type ScreenState = 'splash' | 'title' | 'playing' | 'paused';
type ActiveModal =
  | null
  | 'atlas'
  | 'minigame_hub'
  | 'multiplayer'
  | 'progress'
  | 'settings'
  | 'about';

export default function App() {
  const autostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const [screen, setScreen] = useState<ScreenState>(autostart ? 'playing' : 'splash');
  const [activeWorld, setActiveWorld] = useState<AlphabetWorld>(ALPHABET_WORLDS[0]);
  const [mode, setMode] = useState<DifficultyMode>('kids');
  const [progress, setProgress] = useState<PlayerProgress>(() => loadProgress());
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [modal, setModal] = useState<ActiveModal>(null);
  const [activeMiniGame, setActiveMiniGame] = useState<MiniGameId | null>(null);
  const [rewardSummary, setRewardSummary] = useState<RewardSummary | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 3D Challenge State (for collect_3d, find_hidden, alphabet_race)
  const [active3DChallenge, setActive3DChallenge] = useState<Active3DChallenge>({
    type: 'explore',
  });
  const [raceScore, setRaceScore] = useState(0);
  const raceScoreRef = useRef(0);

  const mobileInputRef = useRef<MobileControlVector>({ dx: 0, dz: 0, jump: false });

  // Sync body dataset state for testability and game shell hygiene
  useEffect(() => {
    const bodyState =
      rewardSummary !== null
        ? 'gameover'
        : screen === 'splash'
        ? 'title'
        : screen;
    document.body.dataset.state = bodyState;
  }, [screen, rewardSummary]);

  // Sync accessibility text-size attribute & sound settings
  useEffect(() => {
    document.documentElement.dataset.textSize = settings.textSize;
    soundEngine.updateSettings(settings);
    saveSettings(settings);
  }, [settings]);

  // Persist player progress
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 2600);
  }, []);

  const pronounceWorld = useCallback(
    (w: AlphabetWorld) => {
      soundEngine.unlock();
      soundEngine.speakWorldPhrase(w.letter, w.primaryWord, w.hindiWord, w.odiaWord);
      showToast(
        `${w.letter} for ${w.primaryWord}${
          settings.showHindi ? ` · ${w.hindiWord}` : ''
        }`,
      );
    },
    [settings.showHindi, showToast],
  );

  const handleStartAdventure = useCallback(() => {
    soundEngine.unlock();
    soundEngine.startMusic();
    setScreen('playing');
    setModal(null);
    setActive3DChallenge({ type: 'explore' });
    pronounceWorld(activeWorld);
  }, [activeWorld, pronounceWorld]);

  const handleSelectWorld = useCallback(
    (w: AlphabetWorld) => {
      soundEngine.unlock();
      setActiveWorld(w);
      setActive3DChallenge({ type: 'explore' });
      setModal(null);
      setProgress((prev) => {
        const existing = prev.worlds[w.letter] ?? {
          visited: true,
          stars: 0,
          bestScore: 0,
          completedMiniGames: [],
        };
        return {
          ...prev,
          worlds: {
            ...prev.worlds,
            [w.letter]: { ...existing, visited: true },
          },
        };
      });
      if (screen !== 'playing') {
        soundEngine.startMusic();
        setScreen('playing');
      }
      pronounceWorld(w);
    },
    [pronounceWorld, screen],
  );

  const completeMiniGame = useCallback(
    (
      gameId: MiniGameId,
      result: { score: number; correctCount: number; totalCount: number },
    ) => {
      soundEngine.playVictory();
      setActiveMiniGame(null);
      setActive3DChallenge({ type: 'explore' });
      setProgress((prev) => {
        const { nextProgress, summary } = applyMiniGameResult(prev, {
          letter: activeWorld.letter,
          miniGameId: gameId,
          mode,
          score: result.score,
          correctCount: result.correctCount,
          totalCount: result.totalCount,
        });
        setRewardSummary(summary);
        return nextProgress;
      });
    },
    [activeWorld.letter, mode],
  );

  const launchMiniGame = useCallback(
    (gameId: MiniGameId) => {
      soundEngine.unlock();
      setModal(null);
      if (screen !== 'playing') {
        soundEngine.startMusic();
        setScreen('playing');
      }

      if (gameId === 'collect_3d') {
        const wordEntry = getWordsForMode(activeWorld, mode)[0];
        const clean = wordEntry.word.toUpperCase().replace(/[^A-Z]/g, '');
        setActiveMiniGame(null);
        setActive3DChallenge({
          type: 'collect_3d',
          targetWord: clean,
          collectedIndices: [],
        });
        showToast(`Walk or click glowing orbs to spell ${clean}!`);
      } else if (gameId === 'find_hidden') {
        setActiveMiniGame(null);
        setActive3DChallenge({
          type: 'find_hidden',
          hiddenTotal: mode === 'kids' ? 3 : 4,
          hiddenFound: 0,
        });
        showToast('Spot & click all hidden Golden Stars around the 3D world!');
      } else if (gameId === 'alphabet_race') {
        setActiveMiniGame(null);
        setRaceScore(0);
        raceScoreRef.current = 0;
        const distractors = deterministicShuffle(
          ALPHABET_WORLDS.filter((w) => w.letter !== activeWorld.letter).map(
            (w) => w.letter,
          ),
          activeWorld.index + 1,
        ).slice(0, 2);
        const options = deterministicShuffle(
          [activeWorld.letter, ...distractors],
          activeWorld.index + 9,
        );
        setActive3DChallenge({
          type: 'alphabet_race',
          raceRound: 0,
          raceTargetLetter: activeWorld.letter,
          raceOptions: options,
        });
        showToast(`Steer Left/Right (A/D) into Gate ${activeWorld.letter}!`);
      } else {
        setActiveMiniGame(gameId);
      }
    },
    [activeWorld, mode, screen, showToast],
  );

  // Global keyboard shortcuts during play (Escape/P Pause, V Pronounce, M Atlas, G Mini-Games)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (screen === 'playing' && !activeMiniGame && !modal && !rewardSummary) {
        if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
          e.preventDefault();
          soundEngine.stopMusic();
          setScreen('paused');
        } else if (e.key.toLowerCase() === 'v') {
          pronounceWorld(activeWorld);
        } else if (e.key.toLowerCase() === 'm') {
          setModal('atlas');
        } else if (e.key.toLowerCase() === 'g') {
          setModal('minigame_hub');
        }
      } else if (screen === 'paused' && (e.key === 'Escape' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        soundEngine.startMusic();
        setScreen('playing');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMiniGame, activeWorld, modal, pronounceWorld, rewardSummary, screen]);

  // 3D Challenge callbacks
  const handleCollectOrb = useCallback(
    (letter: string, _isTarget: boolean, slotIdx?: number) => {
      if (active3DChallenge.type === 'explore') {
        soundEngine.speak(letter);
        setProgress((prev) => ({
          ...prev,
          coins: prev.coins + 5,
          xp: prev.xp + 8,
        }));
        showToast(`Collected ${letter}! +5 Coins`);
        return;
      }

      if (
        active3DChallenge.type === 'collect_3d' &&
        active3DChallenge.targetWord &&
        slotIdx !== undefined
      ) {
        const current = new Set(active3DChallenge.collectedIndices ?? []);
        current.add(slotIdx);
        const arr = Array.from(current);
        soundEngine.speak(letter);

        if (arr.length >= active3DChallenge.targetWord.length) {
          completeMiniGame('collect_3d', {
            score: arr.length * 60,
            correctCount: arr.length,
            totalCount: arr.length,
          });
        } else {
          setActive3DChallenge({
            ...active3DChallenge,
            collectedIndices: arr,
          });
        }
      }
    },
    [active3DChallenge, completeMiniGame, showToast],
  );

  const handleFindHidden = useCallback(
    (foundCount: number) => {
      const total = active3DChallenge.hiddenTotal ?? 4;
      if (foundCount >= total) {
        completeMiniGame('find_hidden', {
          score: total * 80,
          correctCount: total,
          totalCount: total,
        });
      } else {
        setActive3DChallenge({
          ...active3DChallenge,
          hiddenFound: foundCount,
        });
        showToast(`Star Found! ${foundCount} of ${total}`);
      }
    },
    [active3DChallenge, completeMiniGame, showToast],
  );

  const handleRaceGateHit = useCallback(
    (hitLetter: string) => {
      const round = active3DChallenge.raceRound ?? 0;
      const hitCorrect = hitLetter === active3DChallenge.raceTargetLetter;
      if (hitCorrect) {
        soundEngine.playCorrect();
        raceScoreRef.current += 100;
        setRaceScore(raceScoreRef.current);
      } else {
        soundEngine.playWrong();
      }

      const nextRound = round + 1;
      if (nextRound >= 3) {
        const correctGuess = Math.max(1, Math.round(raceScoreRef.current / 100));
        completeMiniGame('alphabet_race', {
          score: raceScoreRef.current + 50,
          correctCount: correctGuess,
          totalCount: 3,
        });
      } else {
        const targetWorld = ALPHABET_WORLDS[(activeWorld.index + nextRound) % 26];
        const distractors = deterministicShuffle(
          ALPHABET_WORLDS.filter((w) => w.letter !== targetWorld.letter).map(
            (w) => w.letter,
          ),
          nextRound + 17,
        ).slice(0, 2);
        const options = deterministicShuffle(
          [targetWorld.letter, ...distractors],
          nextRound + 29,
        );
        setActive3DChallenge({
          type: 'alphabet_race',
          raceRound: nextRound,
          raceTargetLetter: targetWorld.letter,
          raceOptions: options,
        });
      }
    },
    [active3DChallenge, activeWorld.index, completeMiniGame],
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* Persistent Three.js 3D Viewport */}
      <WorldStage
        world={activeWorld}
        gameState={
          rewardSummary || modal || activeMiniGame
            ? 'paused'
            : screen
        }
        graphicsQuality={settings.graphicsQuality}
        activeChallenge={active3DChallenge}
        mobileInputRef={mobileInputRef}
        onCollectOrb={handleCollectOrb}
        onFindHidden={handleFindHidden}
        onRaceGateHit={handleRaceGateHit}
        onInspectLandmark={() => pronounceWorld(activeWorld)}
      />

      {/* Screen 1: Developer Splash Intro */}
      {screen === 'splash' && (
        <DeveloperSplash onContinue={() => setScreen('title')} />
      )}

      {/* Screen 2: Animated Main Menu */}
      {screen === 'title' && (
        <MainMenu
          activeWorld={activeWorld}
          mode={mode}
          progress={progress}
          onSelectMode={setMode}
          onStartAdventure={handleStartAdventure}
          onOpenAtlas={() => setModal('atlas')}
          onOpenMiniGames={() => setModal('minigame_hub')}
          onOpenMultiplayer={() => setModal('multiplayer')}
          onOpenProgress={() => setModal('progress')}
          onOpenSettings={() => setModal('settings')}
          onOpenAbout={() => setModal('about')}
          onLaunchDaily={(letter) => {
            const w = getWorldByLetter(letter);
            const daily = getDailyChallenge();
            setActiveWorld(w);
            soundEngine.startMusic();
            setScreen('playing');
            launchMiniGame(daily.miniGameId);
          }}
          onPronounceActive={() => pronounceWorld(activeWorld)}
        />
      )}

      {/* Screen 3: Active 3D Exploration & Mini-Game HUD */}
      {screen === 'playing' && (
        <GameplayHud
          world={activeWorld}
          mode={mode}
          progress={progress}
          settings={settings}
          activeChallenge={active3DChallenge}
          raceScore={raceScore}
          mobileInputRef={mobileInputRef}
          onPronounce={() => pronounceWorld(activeWorld)}
          onToggleMute={() =>
            setSettings((s) => ({
              ...s,
              masterVolume: s.masterVolume > 0.01 ? 0 : 0.7,
            }))
          }
          onOpenAtlas={() => setModal('atlas')}
          onOpenMiniGames={() => setModal('minigame_hub')}
          onQuickLaunchMiniGame={launchMiniGame}
          onCancel3DChallenge={() => setActive3DChallenge({ type: 'explore' })}
          onPause={() => {
            soundEngine.stopMusic();
            setScreen('paused');
          }}
        />
      )}

      {/* Screen 4: Pause Modal */}
      {screen === 'paused' && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/82"
          role="dialog"
          aria-modal="true"
          aria-label="Game Paused"
        >
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/15 p-6 text-center space-y-4 shadow-2xl">
            <h2 className="font-display text-2xl font-extrabold text-white">
              Adventure Paused
            </h2>
            <p className="text-xs text-slate-400">
              {activeWorld.letter} – {activeWorld.name} · <span className="capitalize">{mode} Mode</span>
            </p>
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  soundEngine.startMusic();
                  setScreen('playing');
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Game</span>
              </button>
              <button
                type="button"
                onClick={() => setModal('atlas')}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Globe2 className="w-4 h-4 text-sky-400" />
                <span>Switch World (A–Z)</span>
              </button>
              <button
                type="button"
                onClick={() => setModal('settings')}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Settings &amp; Credits</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActive3DChallenge({ type: 'explore' });
                  setScreen('playing');
                  soundEngine.startMusic();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset World Activity</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActive3DChallenge({ type: 'explore' });
                  setScreen('title');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return to Main Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal === 'atlas' && (
        <WorldAtlasModal
          activeLetter={activeWorld.letter}
          progress={progress}
          settings={settings}
          onSelectWorld={handleSelectWorld}
          onPronounceWorld={pronounceWorld}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'minigame_hub' && (
        <MiniGameHubModal
          world={activeWorld}
          mode={mode}
          progress={progress}
          onSelectGame={launchMiniGame}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'multiplayer' && (
        <MultiplayerModal
          mode={mode}
          progress={progress}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'progress' && (
        <ProgressModal
          progress={progress}
          onUpdateName={(name) =>
            setProgress((p) => ({ ...p, playerName: name }))
          }
          onClose={() => setModal(null)}
        />
      )}

      {(modal === 'settings' || modal === 'about') && (
        <SettingsModal
          settings={settings}
          initialTab={modal === 'about' ? 'about' : 'general'}
          onChange={setSettings}
          onResetProgress={() => {
            const fresh = createInitialProgress();
            setProgress(fresh);
            saveProgress(fresh);
            showToast('Progress reset to fresh adventure.');
          }}
          onClose={() => setModal(null)}
        />
      )}

      {activeMiniGame && (
        <MiniGameModal
          gameId={activeMiniGame}
          world={activeWorld}
          mode={mode}
          settings={settings}
          onComplete={(res) => completeMiniGame(activeMiniGame, res)}
          onClose={() => setActiveMiniGame(null)}
        />
      )}

      {rewardSummary && (
        <RewardModal
          summary={rewardSummary}
          onContinue={() => setRewardSummary(null)}
        />
      )}

      {/* Subtle Non-Intrusive Toast Feedback */}
      {toastMsg && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl border border-amber-400/40 text-xs sm:text-sm font-semibold text-amber-200 shadow-lg pointer-events-none"
          style={{ background: 'rgba(15, 23, 42, 0.94)' }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
