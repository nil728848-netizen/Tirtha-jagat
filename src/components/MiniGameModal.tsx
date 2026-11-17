import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clock,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { ALPHABET_WORLDS, MINI_GAMES } from '../data/worlds';
import {
  deterministicShuffle,
  generateMatchPairs,
  generateMemoryDeck,
  generateMissingWordPuzzle,
  generateWordBuildBank,
  getWordsForMode,
  isValidEnglishBuildWord,
  scrambleWord,
} from '../game/minigameLogic';
import {
  AlphabetWorld,
  DifficultyMode,
  GameSettings,
  MiniGameId,
} from '../types/game';

interface MiniGameModalProps {
  gameId: MiniGameId;
  world: AlphabetWorld;
  mode: DifficultyMode;
  settings: GameSettings;
  onComplete: (result: {
    score: number;
    correctCount: number;
    totalCount: number;
  }) => void;
  onClose: () => void;
}

export const MiniGameModal: React.FC<MiniGameModalProps> = ({
  gameId,
  world,
  mode,
  settings,
  onComplete,
  onClose,
}) => {
  const meta = MINI_GAMES.find((m) => m.id === gameId) ?? MINI_GAMES[0];
  const worldWords = useMemo(() => getWordsForMode(world, mode), [world, mode]);

  // Common round & score state
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // Timed quiz / guess timer
  const [timeLeft, setTimeLeft] = useState(mode === 'master' ? 22 : 35);

  // Game-specific states
  // 2. Match Letter <-> Object
  const matchPairs = useMemo(
    () => generateMatchPairs(world.letter, mode, world.index + 5),
    [world, mode],
  );
  const shuffledRightMatch = useMemo(
    () => deterministicShuffle(matchPairs, world.index + 19),
    [matchPairs, world.index],
  );
  const [selectedLeftLetter, setSelectedLeftLetter] = useState<string | null>(null);
  const [matchedLetters, setMatchedLetters] = useState<string[]>([]);

  // 3. Complete Missing Words
  const missingPuzzle = useMemo(
    () => generateMissingWordPuzzle(world, mode, round),
    [world, mode, round],
  );
  const [filledSlots, setFilledSlots] = useState<Record<number, string>>({});

  // 4. Arrange Scrambled Letters
  const targetScrambleWord = useMemo(() => {
    const entry = worldWords[round % worldWords.length];
    return entry.word.toUpperCase().replace(/[^A-Z]/g, '');
  }, [worldWords, round]);
  const scrambledTiles = useMemo(
    () => scrambleWord(targetScrambleWord, round + world.index + 3),
    [targetScrambleWord, round, world.index],
  );
  const [pickedScrambleIndices, setPickedScrambleIndices] = useState<number[]>([]);

  // 5. Spell the Displayed Object
  const [typedSpell, setTypedSpell] = useState<string>('');

  // 7. Memory Card Matching
  const memoryDeck = useMemo(
    () => generateMemoryDeck(world.letter, mode, world.index + 11),
    [world, mode],
  );
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [clearedPairIds, setClearedPairIds] = useState<string[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);

  // 8. Word Building
  const wordBuild = useMemo(
    () => generateWordBuildBank(world, world.index + 7),
    [world],
  );
  const [builtInput, setBuiltInput] = useState('');
  const [foundWords, setFoundWords] = useState<string[]>([]);

  // Quiz & Find Alphabet & Guess Description round sets
  const quizQuestions = useMemo(() => {
    const neighbor1 = ALPHABET_WORLDS[(world.index + 1) % 26];
    const neighbor2 = ALPHABET_WORLDS[(world.index + 5) % 26];
    const neighbor3 = ALPHABET_WORLDS[(world.index + 11) % 26];
    return [world, neighbor1, neighbor2, neighbor3].map((w) => ({
      world: w,
      q: w.quiz[mode],
    }));
  }, [world, mode]);

  const findAlphabetRounds = useMemo(() => {
    const pool = [
      world,
      ALPHABET_WORLDS[(world.index + 3) % 26],
      ALPHABET_WORLDS[(world.index + 7) % 26],
      ALPHABET_WORLDS[(world.index + 13) % 26],
    ];
    return pool.map((w, idx) => {
      const entry = getWordsForMode(w, mode)[0];
      const distractors = deterministicShuffle(
        ALPHABET_WORLDS.filter((o) => o.letter !== w.letter).map((o) => o.letter),
        idx + world.index * 5,
      ).slice(0, mode === 'kids' ? 3 : 5);
      return {
        targetLetter: w.letter,
        word: entry.word,
        clue: entry.clue,
        hindi: entry.hindi,
        odia: entry.odia,
        options: deterministicShuffle([w.letter, ...distractors], idx + 29),
      };
    });
  }, [world, mode]);

  const guessRounds = useMemo(() => {
    const pool = [
      world,
      ALPHABET_WORLDS[(world.index + 2) % 26],
      ALPHABET_WORLDS[(world.index + 8) % 26],
      ALPHABET_WORLDS[(world.index + 15) % 26],
    ];
    return pool.map((w, idx) => {
      const entry = getWordsForMode(w, mode)[0];
      const distractors = deterministicShuffle(
        ALPHABET_WORLDS.filter((o) => o.letter !== w.letter).map(
          (o) => getWordsForMode(o, mode)[0].word,
        ),
        idx + 41,
      ).slice(0, 3);
      return {
        answer: entry.word,
        clue: entry.clue,
        hindi: entry.hindi,
        odia: entry.odia,
        letter: w.letter,
        options: deterministicShuffle([entry.word, ...distractors], idx + 53),
      };
    });
  }, [world, mode]);

  // Timer for timed_quiz
  useEffect(() => {
    if (gameId !== 'timed_quiz') return;
    if (timeLeft <= 0) {
      onComplete({
        score,
        correctCount,
        totalCount: quizQuestions.length,
      });
      return;
    }
    const t = window.setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [gameId, timeLeft, score, correctCount, quizQuestions.length, onComplete]);

  // Helper to advance round or finish
  const advanceOrFinish = (
    nextScore: number,
    nextCorrect: number,
    totalRounds: number,
  ) => {
    window.setTimeout(() => {
      setFeedback(null);
      if (round + 1 >= totalRounds) {
        onComplete({
          score: nextScore,
          correctCount: nextCorrect,
          totalCount: totalRounds,
        });
      } else {
        setRound((r) => r + 1);
        setFilledSlots({});
        setPickedScrambleIndices([]);
        setTypedSpell('');
      }
    }, 650);
  };

  // Speak initial instruction softly if enabled
  useEffect(() => {
    if (settings.audioInstructions) {
      soundEngine.speak(meta.title);
    }
  }, [meta.title, settings.audioInstructions]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85"
      role="dialog"
      aria-modal="true"
      aria-label={meta.title}
    >
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/10 bg-slate-950/50">
          <div>
            <div className="text-xs font-semibold text-amber-300">
              {world.letter} – {world.name} · <span className="capitalize">{mode}</span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-white">
              {meta.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {gameId === 'timed_quiz' && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 font-mono-tabular text-sm font-bold">
                <Clock className="w-4 h-4" />
                <span>{timeLeft}s</span>
              </div>
            )}
            <div className="font-mono-tabular text-sm font-bold text-emerald-400">
              {score} pts
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              aria-label="Close Mini-Game"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game Body */}
        <div className="flex-1 p-5 game-scroll space-y-5">
          {/* 1. FIND THE CORRECT ALPHABET */}
          {gameId === 'find_alphabet' && (() => {
            const cur = findAlphabetRounds[round];
            return (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Round {round + 1} of {findAlphabetRounds.length}</span>
                  <button
                    type="button"
                    onClick={() => soundEngine.speak(`${cur.targetLetter} for ${cur.word}`)}
                    className="flex items-center gap-1 text-amber-300 font-semibold cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" /> Hear Clue
                  </button>
                </div>

                <div className="p-5 rounded-xl bg-slate-800/80 border border-white/10 text-center">
                  <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                    Which letter starts this word?
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                    _{cur.word.slice(1)}
                  </div>
                  <p className="text-sm text-slate-300 mt-2">{cur.clue}</p>
                  {(settings.showHindi || settings.showOdia) && (
                    <p className="text-xs text-amber-300/90 mt-1">
                      {settings.showHindi ? `Hindi: ${cur.hindi}` : ''}
                      {settings.showHindi && settings.showOdia ? ' · ' : ''}
                      {settings.showOdia ? `Odia: ${cur.odia}` : ''}
                    </p>
                  )}
                </div>

                <div
                  className={`grid gap-3 ${
                    cur.options.length === 4 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
                  }`}
                >
                  {cur.options.map((ltr) => (
                    <button
                      key={ltr}
                      type="button"
                      disabled={feedback !== null}
                      onClick={() => {
                        const ok = ltr === cur.targetLetter;
                        if (ok) {
                          soundEngine.playCorrect();
                          const ns = score + 75;
                          const nc = correctCount + 1;
                          setScore(ns);
                          setCorrectCount(nc);
                          setFeedback({ ok: true, msg: `Correct! ${ltr} is for ${cur.word}.` });
                          advanceOrFinish(ns, nc, findAlphabetRounds.length);
                        } else {
                          soundEngine.playWrong();
                          setFeedback({ ok: false, msg: `That was ${ltr}. The word ${cur.word} starts with ${cur.targetLetter}.` });
                          advanceOrFinish(score, correctCount, findAlphabetRounds.length);
                        }
                      }}
                      className="py-4 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border border-white/15 font-display text-3xl font-extrabold text-white transition-colors cursor-pointer"
                    >
                      {ltr}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 2. MATCH LETTERS WITH OBJECTS */}
          {gameId === 'match_letter_object' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tap a Letter on the left, then tap its matching Word on the right</span>
                <span className="font-mono-tabular text-emerald-300">
                  {matchedLetters.length}/{matchPairs.length} Matched
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  {matchPairs.map((p) => {
                    const done = matchedLetters.includes(p.letter);
                    const active = selectedLeftLetter === p.letter;
                    return (
                      <button
                        key={p.letter}
                        type="button"
                        disabled={done}
                        onClick={() => {
                          soundEngine.playClick();
                          setSelectedLeftLetter(p.letter);
                        }}
                        className={`w-full py-3 px-4 rounded-xl font-display text-xl font-extrabold border text-center transition-colors cursor-pointer ${
                          done
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : active
                            ? 'bg-amber-400 text-slate-950 border-amber-300'
                            : 'bg-slate-800 text-white border-white/15 hover:border-amber-400/50'
                        }`}
                      >
                        {p.letter}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2.5">
                  {shuffledRightMatch.map((p) => {
                    const done = matchedLetters.includes(p.letter);
                    return (
                      <button
                        key={p.word}
                        type="button"
                        disabled={done}
                        onClick={() => {
                          if (!selectedLeftLetter) return;
                          if (selectedLeftLetter === p.letter) {
                            soundEngine.playCorrect();
                            const nextMatched = [...matchedLetters, p.letter];
                            setMatchedLetters(nextMatched);
                            setSelectedLeftLetter(null);
                            const ns = score + 60;
                            const nc = correctCount + 1;
                            setScore(ns);
                            setCorrectCount(nc);
                            setFeedback({ ok: true, msg: `${p.letter} matches ${p.word}!` });
                            if (nextMatched.length >= matchPairs.length) {
                              window.setTimeout(() => {
                                onComplete({
                                  score: ns,
                                  correctCount: matchPairs.length,
                                  totalCount: matchPairs.length,
                                });
                              }, 600);
                            }
                          } else {
                            soundEngine.playWrong();
                            setSelectedLeftLetter(null);
                            setFeedback({ ok: false, msg: 'Not quite! Try another pair.' });
                          }
                        }}
                        className={`w-full py-2.5 px-3 rounded-xl border text-left transition-colors cursor-pointer ${
                          done
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : 'bg-slate-800 text-white border-white/15 hover:border-sky-400'
                        }`}
                      >
                        <div className="font-bold text-sm">{p.word}</div>
                        {settings.showHindi && (
                          <div className="text-[11px] text-slate-400">{p.hindi}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. COMPLETE MISSING WORDS */}
          {gameId === 'complete_missing' && (() => {
            const totalRounds = 3;
            const nextEmptyIdx = missingPuzzle.missingIndices.find(
              (idx) => filledSlots[idx] === undefined,
            );
            return (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Word {round + 1} of {totalRounds}</span>
                  <button
                    type="button"
                    onClick={() => soundEngine.speak(missingPuzzle.word)}
                    className="flex items-center gap-1 text-amber-300 font-semibold cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" /> Pronounce Word
                  </button>
                </div>

                <div className="p-5 rounded-xl bg-slate-800/80 border border-white/10 text-center">
                  <p className="text-sm text-slate-300 mb-3">{missingPuzzle.clue}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {missingPuzzle.word.split('').map((ch, idx) => {
                      const isMissing = missingPuzzle.missingIndices.includes(idx);
                      const filled = filledSlots[idx];
                      return (
                        <div
                          key={idx}
                          className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl flex items-center justify-center font-mono-tabular text-xl sm:text-2xl font-extrabold border ${
                            !isMissing
                              ? 'bg-slate-900 border-white/15 text-white'
                              : filled
                              ? 'bg-amber-400 border-amber-300 text-slate-950'
                              : idx === nextEmptyIdx
                              ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                              : 'bg-slate-950 border-white/20 text-slate-500'
                          }`}
                        >
                          {isMissing ? filled ?? '_' : ch}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {missingPuzzle.choices.map((ltr, idx) => (
                    <button
                      key={`${ltr}-${idx}`}
                      type="button"
                      disabled={feedback !== null || nextEmptyIdx === undefined}
                      onClick={() => {
                        if (nextEmptyIdx === undefined) return;
                        const updated = { ...filledSlots, [nextEmptyIdx]: ltr };
                        setFilledSlots(updated);
                        soundEngine.playClick();

                        const allFilled = missingPuzzle.missingIndices.every(
                          (mIdx) => updated[mIdx] !== undefined,
                        );
                        if (allFilled) {
                          const built = missingPuzzle.word
                            .split('')
                            .map((c, i) => (missingPuzzle.missingIndices.includes(i) ? updated[i] : c))
                            .join('');
                          const ok = built === missingPuzzle.word;
                          if (ok) {
                            soundEngine.playCorrect();
                            const ns = score + 90;
                            const nc = correctCount + 1;
                            setScore(ns);
                            setCorrectCount(nc);
                            setFeedback({ ok: true, msg: `Awesome! ${missingPuzzle.word}` });
                            advanceOrFinish(ns, nc, totalRounds);
                          } else {
                            soundEngine.playWrong();
                            setFeedback({ ok: false, msg: `Correct spelling: ${missingPuzzle.word}` });
                            advanceOrFinish(score, correctCount, totalRounds);
                          }
                        }
                      }}
                      className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border border-white/15 font-mono-tabular text-lg font-bold text-white cursor-pointer"
                    >
                      {ltr}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFilledSlots({})}
                    className="px-3 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Clear
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 4. ARRANGE SCRAMBLED LETTERS */}
          {gameId === 'arrange_scrambled' && (() => {
            const totalRounds = 3;
            const currentWord = pickedScrambleIndices
              .map((i) => scrambledTiles[i])
              .join('');
            const entry = worldWords[round % worldWords.length];
            return (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Puzzle {round + 1} of {totalRounds}</span>
                  <button
                    type="button"
                    onClick={() => soundEngine.speak(targetScrambleWord)}
                    className="flex items-center gap-1 text-amber-300 font-semibold cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" /> Hear Word
                  </button>
                </div>

                <div className="p-5 rounded-xl bg-slate-800/80 border border-white/10 text-center">
                  <p className="text-sm text-slate-300 mb-3">Clue: {entry.clue}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2 min-h-[52px]">
                    {targetScrambleWord.split('').map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-10 h-12 rounded-xl flex items-center justify-center font-mono-tabular text-xl font-extrabold border ${
                          currentWord[idx]
                            ? 'bg-amber-400 text-slate-950 border-amber-300'
                            : 'bg-slate-950 text-slate-600 border-white/15'
                        }`}
                      >
                        {currentWord[idx] ?? ''}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {scrambledTiles.map((ch, idx) => {
                    const used = pickedScrambleIndices.includes(idx);
                    return (
                      <button
                        key={`${ch}-${idx}`}
                        type="button"
                        disabled={used || feedback !== null}
                        onClick={() => {
                          const nextPicked = [...pickedScrambleIndices, idx];
                          setPickedScrambleIndices(nextPicked);
                          soundEngine.playClick();
                          if (nextPicked.length === targetScrambleWord.length) {
                            const attempt = nextPicked.map((i) => scrambledTiles[i]).join('');
                            if (attempt === targetScrambleWord) {
                              soundEngine.playCorrect();
                              const ns = score + 100;
                              const nc = correctCount + 1;
                              setScore(ns);
                              setCorrectCount(nc);
                              setFeedback({ ok: true, msg: `Unscrambled: ${targetScrambleWord}!` });
                              advanceOrFinish(ns, nc, totalRounds);
                            } else {
                              soundEngine.playWrong();
                              setFeedback({ ok: false, msg: `That spelled ${attempt}. Answer: ${targetScrambleWord}` });
                              advanceOrFinish(score, correctCount, totalRounds);
                            }
                          }
                        }}
                        className={`w-12 h-12 rounded-xl font-mono-tabular text-lg font-extrabold border cursor-pointer ${
                          used
                            ? 'bg-slate-800/30 border-white/5 text-slate-600'
                            : 'bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border-white/15 text-white'
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setPickedScrambleIndices([])}
                    className="px-3 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 5. SPELL THE DISPLAYED OBJECT */}
          {gameId === 'spell_object' && (() => {
            const totalRounds = 3;
            const entry = worldWords[round % worldWords.length];
            const cleanTarget = entry.word.toUpperCase().replace(/[^A-Z]/g, '');
            const keyboardPool = deterministicShuffle(
              Array.from(new Set([...cleanTarget.split(''), 'E', 'A', 'R', 'S', 'T', 'N', 'O', 'L'])),
              round + world.index,
            );
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Object {round + 1} of {totalRounds}</span>
                  <button
                    type="button"
                    onClick={() => soundEngine.speak(cleanTarget)}
                    className="flex items-center gap-1 text-amber-300 font-semibold cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" /> Hear Pronunciation
                  </button>
                </div>

                <div className="p-5 rounded-xl bg-slate-800/80 border border-white/10 text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl font-display text-3xl font-extrabold text-white" style={{ backgroundColor: world.palette.accentHex }}>
                    {cleanTarget[0]}
                  </div>
                  <p className="text-base font-semibold text-white">{entry.clue}</p>
                  {settings.showHindi && (
                    <p className="text-xs text-amber-300">
                      Hindi: {entry.hindi} {settings.showOdia ? `· Odia: ${entry.odia}` : ''}
                    </p>
                  )}
                  <div className="pt-2 font-mono-tabular text-2xl font-extrabold tracking-[0.25em] text-amber-300 min-h-[36px]">
                    {typedSpell || '_'.repeat(cleanTarget.length)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {keyboardPool.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      disabled={feedback !== null}
                      onClick={() => {
                        const next = typedSpell + ch;
                        setTypedSpell(next);
                        soundEngine.playClick();
                        if (next.length >= cleanTarget.length) {
                          if (next === cleanTarget) {
                            soundEngine.playCorrect();
                            const ns = score + 100;
                            const nc = correctCount + 1;
                            setScore(ns);
                            setCorrectCount(nc);
                            setFeedback({ ok: true, msg: `Perfect spelling: ${cleanTarget}!` });
                            advanceOrFinish(ns, nc, totalRounds);
                          } else {
                            soundEngine.playWrong();
                            setFeedback({ ok: false, msg: `Spelled ${next} · Target was ${cleanTarget}` });
                            advanceOrFinish(score, correctCount, totalRounds);
                          }
                        }
                      }}
                      className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border border-white/15 font-mono-tabular font-bold text-white cursor-pointer"
                    >
                      {ch}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTypedSpell((s) => s.slice(0, -1))}
                    className="px-3 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                  >
                    Backspace
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 7. MEMORY CARD MATCHING */}
          {gameId === 'memory_match' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Flip two matching cards (Letter + Word)</span>
                <span className="font-mono-tabular text-amber-300">
                  Moves: {memoryMoves} · Pairs: {clearedPairIds.length}/{memoryDeck.length / 2}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {memoryDeck.map((card) => {
                  const isCleared = clearedPairIds.includes(card.pairId);
                  const isFlipped = isCleared || flippedUids.includes(card.uid);
                  return (
                    <button
                      key={card.uid}
                      type="button"
                      disabled={isFlipped || flippedUids.length >= 2}
                      onClick={() => {
                        soundEngine.playClick();
                        const nextFlipped = [...flippedUids, card.uid];
                        setFlippedUids(nextFlipped);
                        if (nextFlipped.length === 2) {
                          setMemoryMoves((m) => m + 1);
                          const c1 = memoryDeck.find((c) => c.uid === nextFlipped[0])!;
                          const c2 = memoryDeck.find((c) => c.uid === nextFlipped[1])!;
                          if (c1.pairId === c2.pairId) {
                            soundEngine.playCorrect();
                            const nextCleared = [...clearedPairIds, c1.pairId];
                            setClearedPairIds(nextCleared);
                            setFlippedUids([]);
                            const ns = score + 70;
                            setScore(ns);
                            setCorrectCount((c) => c + 1);
                            if (nextCleared.length >= memoryDeck.length / 2) {
                              window.setTimeout(() => {
                                onComplete({
                                  score: ns,
                                  correctCount: memoryDeck.length / 2,
                                  totalCount: memoryDeck.length / 2,
                                });
                              }, 550);
                            }
                          } else {
                            window.setTimeout(() => setFlippedUids([]), 650);
                          }
                        }
                      }}
                      className={`h-20 sm:h-24 rounded-xl border p-2 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                        isCleared
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                          : isFlipped
                          ? 'bg-amber-400 border-amber-300 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 border-white/15 text-slate-400'
                      }`}
                    >
                      {isFlipped ? (
                        <>
                          <span className="font-display font-extrabold text-base sm:text-lg leading-tight">
                            {card.label}
                          </span>
                          <span className="text-[11px] opacity-80 mt-0.5 truncate max-w-full">
                            {card.sublabel}
                          </span>
                        </>
                      ) : (
                        <Sparkles className="w-5 h-5 text-amber-300/60" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 8. WORD-BUILDING CHALLENGE */}
          {gameId === 'word_building' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Forge at least 3 valid words (3+ letters) from the bank!</span>
                <span className="font-mono-tabular text-emerald-300">
                  {foundWords.length}/3 Goal
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-white/10 text-center">
                <div className="font-mono-tabular text-2xl font-extrabold tracking-[0.2em] text-amber-300 min-h-[36px]">
                  {builtInput || 'TAP LETTERS'}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  {wordBuild.bank.map((ltr, idx) => (
                    <button
                      key={`${ltr}-${idx}`}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setBuiltInput((w) => w + ltr);
                      }}
                      className="w-11 h-11 rounded-xl bg-slate-900 hover:bg-amber-400 hover:text-slate-950 border border-white/20 font-mono-tabular font-bold text-white cursor-pointer"
                    >
                      {ltr}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setBuiltInput('')}
                    className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cand = builtInput.trim().toUpperCase();
                      if (foundWords.includes(cand)) {
                        setFeedback({ ok: false, msg: `${cand} already forged!` });
                        setBuiltInput('');
                        return;
                      }
                      if (isValidEnglishBuildWord(cand, wordBuild.bank)) {
                        soundEngine.playCorrect();
                        const nextFound = [...foundWords, cand];
                        setFoundWords(nextFound);
                        setBuiltInput('');
                        const ns = score + cand.length * 25;
                        setScore(ns);
                        setCorrectCount(nextFound.length);
                        setFeedback({ ok: true, msg: `Forged ${cand}!` });
                      } else {
                        soundEngine.playWrong();
                        setFeedback({ ok: false, msg: `${cand || 'Word'} not accepted from bank.` });
                        setBuiltInput('');
                      }
                    }}
                    className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer"
                  >
                    Submit Word
                  </button>
                </div>
              </div>

              {foundWords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {foundWords.map((w) => (
                    <span
                      key={w}
                      className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono-tabular text-xs font-bold"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={foundWords.length === 0}
                  onClick={() =>
                    onComplete({
                      score,
                      correctCount: Math.min(3, foundWords.length),
                      totalCount: 3,
                    })
                  }
                  className="px-5 py-2.5 rounded-xl bg-amber-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-extrabold text-sm cursor-pointer"
                >
                  Finish &amp; Claim Rewards ({foundWords.length} Words)
                </button>
              </div>
            </div>
          )}

          {/* 9. TIMED VOCABULARY QUIZ */}
          {gameId === 'timed_quiz' && (() => {
            const cur = quizQuestions[round % quizQuestions.length];
            return (
              <div className="space-y-4">
                <div className="text-xs text-slate-400">
                  Question {round + 1} of {quizQuestions.length} · {cur.world.letter} – {cur.world.name}
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-white/10">
                  <p className="text-base sm:text-lg font-bold text-white leading-snug">
                    {cur.q.prompt}
                  </p>
                </div>
                <div className="space-y-2.5">
                  {cur.q.options.map((opt, idx) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={feedback !== null}
                      onClick={() => {
                        const ok = idx === cur.q.correctIndex;
                        if (ok) {
                          soundEngine.playCorrect();
                          const ns = score + 85;
                          const nc = correctCount + 1;
                          setScore(ns);
                          setCorrectCount(nc);
                          setFeedback({ ok: true, msg: cur.q.explanation });
                          advanceOrFinish(ns, nc, quizQuestions.length);
                        } else {
                          soundEngine.playWrong();
                          setFeedback({ ok: false, msg: cur.q.explanation });
                          advanceOrFinish(score, correctCount, quizQuestions.length);
                        }
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border border-white/15 font-semibold text-sm text-white transition-colors cursor-pointer"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 12. GUESS OBJECT FROM DESCRIPTION */}
          {gameId === 'guess_description' && (() => {
            const cur = guessRounds[round % guessRounds.length];
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Riddle {round + 1} of {guessRounds.length}</span>
                  <span>Starts with: <strong className="text-amber-300">{cur.letter}</strong></span>
                </div>
                <div className="p-5 rounded-xl bg-slate-800/80 border border-white/10 space-y-2">
                  <p className="text-base sm:text-lg font-bold text-white">
                    &ldquo;{cur.clue}&rdquo;
                  </p>
                  {settings.showHindi && (
                    <p className="text-xs text-amber-300">
                      Translation Hint · Hindi: {cur.hindi} {settings.showOdia ? `· Odia: ${cur.odia}` : ''}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {cur.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={feedback !== null}
                      onClick={() => {
                        const ok = opt === cur.answer;
                        if (ok) {
                          soundEngine.playCorrect();
                          const ns = score + 80;
                          const nc = correctCount + 1;
                          setScore(ns);
                          setCorrectCount(nc);
                          setFeedback({ ok: true, msg: `Spot on! It is ${cur.answer}.` });
                          advanceOrFinish(ns, nc, guessRounds.length);
                        } else {
                          soundEngine.playWrong();
                          setFeedback({ ok: false, msg: `It was ${cur.answer}!` });
                          advanceOrFinish(score, correctCount, guessRounds.length);
                        }
                      }}
                      className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border border-white/15 font-display font-bold text-base text-white cursor-pointer"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-sm font-semibold flex items-center gap-2 ${
                feedback.ok
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                  : 'bg-rose-500/20 border-rose-400 text-rose-200'
              }`}
            >
              {feedback.ok && <Check className="w-4 h-4 shrink-0" />}
              <span>{feedback.msg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
