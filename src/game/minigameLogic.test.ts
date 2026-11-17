import test from 'node:test';
import assert from 'node:assert/strict';
import { getWorldByLetter } from '../data/worlds';
import {
  canBuildWordFromBank,
  generateMatchPairs,
  generateMemoryDeck,
  generateMissingWordPuzzle,
  generateWordBuildBank,
  isValidEnglishBuildWord,
  scrambleWord,
} from './minigameLogic';

test('scrambleWord preserves exact multiset of letters and avoids identical match for multi-letter words', () => {
  const scrambled = scrambleWord('APPLE', 3);
  assert.equal(scrambled.length, 5);
  assert.deepEqual([...scrambled].sort(), ['A', 'E', 'L', 'P', 'P']);
  assert.notEqual(scrambled.join(''), 'APPLE');
});

test('generateMissingWordPuzzle masks characters and includes needed letters in choices', () => {
  const world = getWorldByLetter('A');
  const puzzle = generateMissingWordPuzzle(world, 'explorer', 0);
  assert.ok(puzzle.missingIndices.length >= 1);
  for (const idx of puzzle.missingIndices) {
    assert.equal(puzzle.maskedChars[idx], null);
    assert.ok(puzzle.choices.includes(puzzle.word[idx]));
  }
});

test('generateMatchPairs and generateMemoryDeck scale with difficulty mode', () => {
  const kidsPairs = generateMatchPairs('B', 'kids', 2);
  const masterPairs = generateMatchPairs('B', 'master', 2);
  assert.equal(kidsPairs.length, 4);
  assert.equal(masterPairs.length, 6);
  assert.equal(kidsPairs[0].letter, 'B');

  const deck = generateMemoryDeck('C', 'kids', 4);
  assert.equal(deck.length, 8);
});

test('word building validates bank letter availability and dictionary words', () => {
  const world = getWorldByLetter('S');
  const { bank, possibleWords } = generateWordBuildBank(world, 7);
  assert.equal(bank.length, 8);
  assert.ok(bank.includes('S'));
  assert.ok(possibleWords.length >= 1);

  assert.equal(canBuildWordFromBank('CAT', ['C', 'A', 'T', 'S']), true);
  assert.equal(canBuildWordFromBank('APPLE', ['C', 'A', 'T', 'S']), false);
  assert.equal(isValidEnglishBuildWord('CAT', ['C', 'A', 'T', 'S']), true);
});
