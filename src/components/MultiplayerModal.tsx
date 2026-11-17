import React, { useMemo, useState } from 'react';
import { Award, Globe, Play, RotateCcw, Swords, Trophy, Users, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { ALPHABET_WORLDS } from '../data/worlds';
import { deterministicShuffle } from '../game/minigameLogic';
import { DifficultyMode, PlayerProgress } from '../types/game';

interface MultiplayerModalProps {
  mode: DifficultyMode;
  progress: PlayerProgress;
  onClose: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  mode,
  progress,
  onClose,
}) => {
  const [tab, setTab] = useState<'battle' | 'leaderboard' | 'online'>('battle');
  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');
  const [battleActive, setBattleActive] = useState(false);
  const [roundIdx, setRoundIdx] = useState(0); // 0..5 (3 rounds per player = 6 turns)
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);
  const [battleSeed, setBattleSeed] = useState(1);

  const battleQuestions = useMemo(() => {
    const picks = deterministicShuffle(ALPHABET_WORLDS, battleSeed).slice(0, 6);
    return picks.map((w) => ({ world: w, q: w.quiz[mode] }));
  }, [mode, battleSeed]);

  const isFinished = battleActive && roundIdx >= battleQuestions.length;
  const activePlayer = roundIdx % 2 === 0 ? 1 : 2;
  const currentQ = battleQuestions[Math.min(roundIdx, battleQuestions.length - 1)];

  const resetBattle = () => {
    setBattleSeed((s) => s + 1);
    setRoundIdx(0);
    setP1Score(0);
    setP2Score(0);
    setLastOutcome(null);
    setBattleActive(true);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85"
      role="dialog"
      aria-modal="true"
      aria-label="Multiplayer and Leaderboard"
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Swords className="w-5 h-5 text-rose-400" />
            <h2 className="font-display text-xl font-extrabold text-white">
              Multiplayer Arena &amp; Leaderboard
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            aria-label="Close Multiplayer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-3 bg-slate-950/50 border-b border-white/10 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('battle')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
              tab === 'battle'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Local 2P Word Battle
          </button>
          <button
            type="button"
            onClick={() => setTab('leaderboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
              tab === 'leaderboard'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Leaderboard
          </button>
          <button
            type="button"
            onClick={() => setTab('online')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
              tab === 'online'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Online Rooms (Coming Soon)
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 game-scroll space-y-5">
          {tab === 'battle' && (
            <>
              {!battleActive ? (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-white/10">
                    <h3 className="font-display font-bold text-lg text-white">
                      Turn-Based 2-Player Quiz &amp; Word Duel
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                      Pass-and-play on the same device! Players alternate 3 rounds each in <span className="text-amber-300 font-semibold capitalize">{mode} Mode</span>.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="p1-name" className="block text-xs font-semibold text-sky-300 mb-1.5">
                        Player 1 Name
                      </label>
                      <input
                        id="p1-name"
                        type="text"
                        maxLength={18}
                        value={p1Name}
                        onChange={(e) => setP1Name(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-sm text-white focus:outline-none focus:border-sky-400"
                      />
                    </div>
                    <div>
                      <label htmlFor="p2-name" className="block text-xs font-semibold text-rose-300 mb-1.5">
                        Player 2 Name
                      </label>
                      <input
                        id="p2-name"
                        type="text"
                        maxLength={18}
                        value={p2Name}
                        onChange={(e) => setP2Name(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-sm text-white focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={resetBattle}
                    className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start 2-Player Battle</span>
                  </button>
                </div>
              ) : isFinished ? (
                <div className="p-6 rounded-2xl bg-slate-800/85 border border-amber-400/40 text-center space-y-4">
                  <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
                  <h3 className="font-display text-2xl font-extrabold text-white">
                    {p1Score === p2Score
                      ? 'It is a Grand Tie!'
                      : p1Score > p2Score
                      ? `${p1Name || 'Player 1'} Wins!`
                      : `${p2Name || 'Player 2'} Wins!`}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="p-3 rounded-xl bg-slate-900 border border-sky-400/30">
                      <div className="text-xs text-sky-300 font-semibold">{p1Name || 'Player 1'}</div>
                      <div className="font-mono-tabular text-2xl font-extrabold text-white mt-1">
                        {p1Score}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-rose-400/30">
                      <div className="text-xs text-rose-300 font-semibold">{p2Name || 'Player 2'}</div>
                      <div className="font-mono-tabular text-2xl font-extrabold text-white mt-1">
                        {p2Score}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetBattle}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Rematch</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Scoreboard */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`p-3 rounded-xl border ${
                        activePlayer === 1
                          ? 'bg-sky-500/20 border-sky-400'
                          : 'bg-slate-800/60 border-white/10'
                      }`}
                    >
                      <div className="text-xs text-sky-300 font-semibold">
                        {p1Name || 'Player 1'} {activePlayer === 1 ? '· YOUR TURN' : ''}
                      </div>
                      <div className="font-mono-tabular text-xl font-extrabold text-white">
                        {p1Score} pts
                      </div>
                    </div>
                    <div
                      className={`p-3 rounded-xl border ${
                        activePlayer === 2
                          ? 'bg-rose-500/20 border-rose-400'
                          : 'bg-slate-800/60 border-white/10'
                      }`}
                    >
                      <div className="text-xs text-rose-300 font-semibold">
                        {p2Name || 'Player 2'} {activePlayer === 2 ? '· YOUR TURN' : ''}
                      </div>
                      <div className="font-mono-tabular text-xl font-extrabold text-white">
                        {p2Score} pts
                      </div>
                    </div>
                  </div>

                  {/* Question Card */}
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-white/10">
                    <div className="text-xs text-amber-300 font-semibold mb-1">
                      Turn {roundIdx + 1} of {battleQuestions.length} · {currentQ.world.letter} – {currentQ.world.name}
                    </div>
                    <p className="text-base font-bold text-white">{currentQ.q.prompt}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentQ.q.options.map((opt, idx) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          const ok = idx === currentQ.q.correctIndex;
                          if (ok) {
                            soundEngine.playCorrect();
                            if (activePlayer === 1) setP1Score((s) => s + 100);
                            else setP2Score((s) => s + 100);
                            setLastOutcome(
                              `${activePlayer === 1 ? p1Name : p2Name} scored +100!`,
                            );
                          } else {
                            soundEngine.playWrong();
                            setLastOutcome(
                              `Missed! Correct answer: ${currentQ.q.options[currentQ.q.correctIndex]}`,
                            );
                          }
                          const nextR = roundIdx + 1;
                          setRoundIdx(nextR);
                          if (nextR >= battleQuestions.length) {
                            soundEngine.playVictory();
                          }
                        }}
                        className="p-3.5 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border border-white/15 text-left font-semibold text-sm text-white cursor-pointer"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {lastOutcome && (
                    <div className="text-xs font-semibold text-amber-300">{lastOutcome}</div>
                  )}
                </div>
              )}
            </>
          )}

          {tab === 'leaderboard' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Top Local Scores &amp; Personal Bests</span>
                <span className="text-amber-300 font-semibold">
                  Your Best: {progress.personalBestScore} pts
                </span>
              </div>
              <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-slate-800/60 overflow-hidden">
                {progress.leaderboard.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono-tabular font-bold text-amber-300 w-6">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-white">{entry.playerName}</div>
                        <div className="text-xs text-slate-400 capitalize">
                          {entry.mode} Mode · {entry.dateIso}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono-tabular font-extrabold text-emerald-400">
                        {entry.score} pts
                      </div>
                      <div className="text-[11px] text-amber-300">
                        {entry.stars} Stars
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'online' && (
            <div className="p-6 rounded-2xl bg-slate-800/75 border border-white/15 text-center space-y-4">
              <Globe className="w-12 h-12 text-sky-400 mx-auto" />
              <div>
                <span className="inline-block px-3 py-1 rounded-md bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                  Coming Soon
                </span>
                <h3 className="font-display text-xl font-extrabold text-white">
                  Online Multiplayer Rooms &amp; Friend Invites
                </h3>
                <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
                  Real-time cross-device room codes, child-safe preset emotes (no unmoderated public chat), and global seasonal tournaments are scheduled for an upcoming update. Meanwhile, challenge friends right now in <strong className="text-white">Local 2P Word Battle</strong>!
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTab('battle')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Play Local 2P Battle Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('leaderboard')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>View Leaderboard</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
