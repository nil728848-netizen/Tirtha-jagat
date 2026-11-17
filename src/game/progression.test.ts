import test from 'node:test';
import assert from 'node:assert/strict';
import { ALPHABET_WORLDS, MINI_GAMES } from '../data/worlds';
import {
  applyMiniGameResult,
  calculateStarRating,
  createInitialProgress,
  getDailyChallenge,
  getLevelFromXp,
  getXpProgressInLevel,
  updateStreakOnSession,
} from './progression';

test('dataset includes all 26 A-Z worlds and 12 mini-games', () => {
  assert.equal(ALPHABET_WORLDS.length, 26);
  const letters = ALPHABET_WORLDS.map((w) => w.letter).join('');
  assert.equal(letters, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  assert.equal(MINI_GAMES.length, 12);
});

test('XP level progression scales deterministically', () => {
  assert.equal(getLevelFromXp(0), 1);
  assert.equal(getLevelFromXp(60), 2);
  assert.equal(getLevelFromXp(240), 3);
  const info = getXpProgressInLevel(90);
  assert.equal(info.level, 2);
  assert.ok(info.percent > 0 && info.percent < 100);
});

test('star rating thresholds return 0..3 stars accurately', () => {
  assert.equal(calculateStarRating(1.0), 3);
  assert.equal(calculateStarRating(0.85), 3);
  assert.equal(calculateStarRating(0.6), 2);
  assert.equal(calculateStarRating(0.2), 1);
  assert.equal(calculateStarRating(0), 0);
});

test('applying mini-game result awards coins, XP, stars, unlocks next world and achievement', () => {
  const initial = createInitialProgress('2026-11-17');
  const { nextProgress, summary } = applyMiniGameResult(initial, {
    letter: 'C',
    miniGameId: 'find_alphabet',
    mode: 'explorer',
    score: 280,
    correctCount: 5,
    totalCount: 5,
    todayIso: '2026-11-17',
  });

  assert.equal(summary.starsEarned, 3);
  assert.ok(summary.coinsEarned > 0);
  assert.ok(summary.xpEarned > 0);
  assert.equal(summary.isNewBest, true);
  assert.equal(summary.newlyUnlockedWorld, 'D');
  assert.ok(nextProgress.unlockedLetters.includes('D'));
  assert.ok(nextProgress.unlockedAchievements.includes('first_steps'));
  assert.equal(nextProgress.worlds['C'].stars, 3);
});

test('streak increments on consecutive day and resets after gap', () => {
  const day1 = createInitialProgress('2026-11-17');
  const day2 = updateStreakOnSession(day1, '2026-11-18');
  assert.equal(day2.streakDays, 2);

  const day5 = updateStreakOnSession(day2, '2026-11-21');
  assert.equal(day5.streakDays, 1);
});

test('daily challenge returns valid world letter and mini-game id', () => {
  const daily = getDailyChallenge('2026-11-17');
  assert.ok(ALPHABET_WORLDS.some((w) => w.letter === daily.letter));
  assert.ok(MINI_GAMES.some((g) => g.id === daily.miniGameId));
});
