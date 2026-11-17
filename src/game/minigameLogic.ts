import { ALPHABET_WORLDS, getWorldByLetter } from '../data/worlds';
import { AlphabetWorld, DifficultyMode, WordEntry } from '../types/game';

export function getWordsForMode(world: AlphabetWorld, mode: DifficultyMode): WordEntry[] {
  if (mode === 'kids') return world.kidsWords;
  if (mode === 'explorer') return world.explorerWords;
  return world.masterWords;
}

export function deterministicShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = (seed + 1) * 9301 + 49297;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function scrambleWord(word: string, seed = 1): string[] {
  const clean = word.toUpperCase().replace(/[^A-Z]/g, '');
  const letters = clean.split('');
  if (letters.length <= 1) return letters;
  let shuffled = deterministicShuffle(letters, seed);
  if (shuffled.join('') === clean) {
    shuffled = [...letters.slice(1), letters[0]];
  }
  return shuffled;
}

export interface MissingWordPuzzle {
  word: string;
  clue: string;
  hindi: string;
  odia: string;
  maskedChars: (string | null)[];
  missingIndices: number[];
  choices: string[];
}

export function generateMissingWordPuzzle(
  world: AlphabetWorld,
  mode: DifficultyMode,
  roundIndex: number,
): MissingWordPuzzle {
  const pool = getWordsForMode(world, mode);
  const entry = pool[roundIndex % pool.length];
  const word = entry.word.toUpperCase().replace(/[^A-Z]/g, '');
  const chars = word.split('');
  const hideCount = mode === 'kids' ? 1 : mode === 'explorer' ? Math.min(2, Math.max(1, Math.floor(chars.length / 3))) : Math.min(3, Math.max(2, Math.floor(chars.length / 2)));

  const candidateIndices = chars.map((_, idx) => idx);
  const pickedIndices = deterministicShuffle(candidateIndices, roundIndex + world.index * 7)
    .slice(0, hideCount)
    .sort((a, b) => a - b);

  const missingSet = new Set(pickedIndices);
  const maskedChars = chars.map((ch, idx) => (missingSet.has(idx) ? null : ch));

  const neededLetters = pickedIndices.map((idx) => chars[idx]);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const distractors = deterministicShuffle(
    alphabet.filter((l) => !neededLetters.includes(l)),
    roundIndex + 13,
  ).slice(0, Math.max(3, 6 - neededLetters.length));

  const choices = deterministicShuffle([...neededLetters, ...distractors], roundIndex + 31);

  return {
    word,
    clue: entry.clue,
    hindi: entry.hindi,
    odia: entry.odia,
    maskedChars,
    missingIndices: pickedIndices,
    choices,
  };
}

export interface LetterObjectPair {
  letter: string;
  word: string;
  hindi: string;
  odia: string;
  clue: string;
}

export function generateMatchPairs(
  focusLetter: string,
  mode: DifficultyMode,
  seed: number,
): LetterObjectPair[] {
  const count = mode === 'kids' ? 4 : mode === 'explorer' ? 5 : 6;
  const focusWorld = getWorldByLetter(focusLetter);
  const others = deterministicShuffle(
    ALPHABET_WORLDS.filter((w) => w.letter !== focusWorld.letter),
    seed,
  ).slice(0, count - 1);

  const selected = [focusWorld, ...others];
  return selected.map((w) => {
    const words = getWordsForMode(w, mode);
    const entry = words[0];
    return {
      letter: w.letter,
      word: entry.word,
      hindi: entry.hindi,
      odia: entry.odia,
      clue: entry.clue,
    };
  });
}

export interface MemoryCardItem {
  uid: string;
  pairId: string;
  label: string;
  sublabel: string;
  kind: 'letter' | 'word';
}

export function generateMemoryDeck(
  focusLetter: string,
  mode: DifficultyMode,
  seed: number,
): MemoryCardItem[] {
  const pairCount = mode === 'kids' ? 4 : 6;
  const pairs = generateMatchPairs(focusLetter, mode, seed).slice(0, pairCount);
  const raw: MemoryCardItem[] = [];
  pairs.forEach((p) => {
    raw.push({
      uid: `${p.letter}-L`,
      pairId: p.letter,
      label: p.letter,
      sublabel: 'Letter',
      kind: 'letter',
    });
    raw.push({
      uid: `${p.letter}-W`,
      pairId: p.letter,
      label: p.word,
      sublabel: p.hindi,
      kind: 'word',
    });
  });
  return deterministicShuffle(raw, seed + 17);
}

// Curated dictionary for Word-Building Challenge
const COMMON_BUILD_WORDS = new Set([
  'ACE', 'ACT', 'AGE', 'AGO', 'AID', 'AIM', 'AIR', 'ALE', 'ALL', 'AND', 'ANT', 'ANY', 'APE', 'ARC', 'ARE', 'ARK', 'ARM', 'ART', 'ASH', 'ASK', 'ATE',
  'BAD', 'BAG', 'BAN', 'BAR', 'BAT', 'BAY', 'BED', 'BEE', 'BEG', 'BET', 'BIG', 'BIN', 'BIT', 'BOA', 'BOB', 'BOW', 'BOX', 'BOY', 'BUD', 'BUG', 'BUN', 'BUS', 'BUT', 'BUY',
  'CAB', 'CAM', 'CAN', 'CAP', 'CAR', 'CAT', 'COB', 'COD', 'COG', 'COP', 'COT', 'COW', 'COY', 'CRY', 'CUB', 'CUE', 'CUP', 'CUR', 'CUT',
  'DAB', 'DAD', 'DAM', 'DAN', 'DAY', 'DEN', 'DEW', 'DID', 'DIE', 'DIG', 'DIM', 'DIN', 'DIP', 'DOE', 'DOG', 'DON', 'DOT', 'DRY', 'DUB', 'DUD', 'DUE', 'DUG', 'DUO', 'DYE',
  'EAR', 'EAT', 'EEL', 'EGG', 'EGO', 'ELK', 'ELM', 'END', 'ERA', 'EVE', 'EWE', 'EYE',
  'FAB', 'FAD', 'FAN', 'FAR', 'FAT', 'FAX', 'FED', 'FEE', 'FEN', 'FEW', 'FIB', 'FIG', 'FIN', 'FIR', 'FIT', 'FIX', 'FLU', 'FLY', 'FOB', 'FOE', 'FOG', 'FOR', 'FOX', 'FRY', 'FUN', 'FUR',
  'GAB', 'GAG', 'GAL', 'GAP', 'GAS', 'GAY', 'GEL', 'GEM', 'GET', 'GIG', 'GIN', 'GOD', 'GOT', 'GUM', 'GUN', 'GUT', 'GUY', 'GYM',
  'HAD', 'HAG', 'HAM', 'HAS', 'HAT', 'HAY', 'HEM', 'HEN', 'HER', 'HEW', 'HEX', 'HEY', 'HID', 'HIM', 'HIP', 'HIS', 'HIT', 'HOB', 'HOD', 'HOG', 'HOP', 'HOT', 'HOW', 'HUB', 'HUE', 'HUG', 'HUM', 'HUT',
  'ICE', 'ICY', 'ILL', 'IMP', 'INK', 'INN', 'ION', 'IRE', 'IRK', 'ITS', 'IVY',
  'JAB', 'JAG', 'JAM', 'JAR', 'JAW', 'JAY', 'JET', 'JIG', 'JOB', 'JOG', 'JOT', 'JOY', 'JUG', 'JUT',
  'KEG', 'KEN', 'KEY', 'KID', 'KIN', 'KIT',
  'LAB', 'LAC', 'LAD', 'LAG', 'LAP', 'LAW', 'LAX', 'LAY', 'LEA', 'LED', 'LEG', 'LET', 'LID', 'LIE', 'LIP', 'LIT', 'LOB', 'LOG', 'LOT', 'LOW', 'LUG', 'LYE',
  'MAD', 'MAN', 'MAP', 'MAR', 'MAT', 'MAW', 'MAX', 'MAY', 'MEN', 'MET', 'MID', 'MIX', 'MOB', 'MOD', 'MOM', 'MOP', 'MOW', 'MUD', 'MUG', 'MUM',
  'NAB', 'NAG', 'NAP', 'NAY', 'NET', 'NEW', 'NIB', 'NIL', 'NIP', 'NIT', 'NOD', 'NOR', 'NOT', 'NOW', 'NUB', 'NUN', 'NUT',
  'OAF', 'OAK', 'OAR', 'OAT', 'ODD', 'ODE', 'OFF', 'OFT', 'OIL', 'OLD', 'OLE', 'ONE', 'OPT', 'ORB', 'ORE', 'OUR', 'OUT', 'OVA', 'OWE', 'OWL', 'OWN',
  'PAD', 'PAL', 'PAN', 'PAP', 'PAR', 'PAT', 'PAW', 'PAY', 'PEA', 'PEG', 'PEN', 'PEP', 'PER', 'PET', 'PEW', 'PIE', 'PIG', 'PIN', 'PIT', 'PLY', 'POD', 'POP', 'POT', 'POW', 'PRO', 'PRY', 'PUB', 'PUG', 'PUN', 'PUP', 'PUS', 'PUT',
  'RAD', 'RAG', 'RAM', 'RAN', 'RAP', 'RAT', 'RAW', 'RAY', 'RED', 'REF', 'REP', 'RIB', 'RID', 'RIG', 'RIM', 'RIP', 'ROB', 'ROD', 'ROE', 'ROT', 'ROW', 'RUB', 'RUG', 'RUM', 'RUN', 'RUT', 'RYE',
  'SAC', 'SAD', 'SAG', 'SAP', 'SAT', 'SAW', 'SAY', 'SEA', 'SET', 'SEW', 'SHE', 'SHY', 'SIN', 'SIP', 'SIR', 'SIS', 'SIT', 'SIX', 'SKI', 'SKY', 'SLY', 'SOB', 'SOD', 'SON', 'SOP', 'SOW', 'SOY', 'SPA', 'SPY', 'STY', 'SUB', 'SUM', 'SUN', 'SUP',
  'TAB', 'TAD', 'TAG', 'TAN', 'TAP', 'TAR', 'TAT', 'TAX', 'TEA', 'TEN', 'THE', 'THY', 'TIC', 'TIE', 'TIN', 'TIP', 'TOE', 'TON', 'TOO', 'TOP', 'TOT', 'TOW', 'TOY', 'TRY', 'TUB', 'TUG', 'TWO',
  'URN', 'USE',
  'VAN', 'VAT', 'VET', 'VEX', 'VIA', 'VIE', 'VOW',
  'WAD', 'WAG', 'WAN', 'WAR', 'WAS', 'WAX', 'WAY', 'WEB', 'WED', 'WEE', 'WET', 'WHO', 'WHY', 'WIG', 'WIN', 'WIT', 'WOE', 'WOK', 'WON', 'WOO', 'WOW',
  'YAK', 'YAM', 'YAP', 'YAW', 'YEA', 'YES', 'YET', 'YEW', 'YIN', 'YIP', 'YOU', 'YOW',
  'ZAP', 'ZED', 'ZEE', 'ZEN', 'ZIG', 'ZIP', 'ZIT', 'ZOO',
  'ABLE', 'ACHE', 'ACID', 'ACRE', 'AGED', 'AIDE', 'ALLY', 'ALOE', 'ALSO', 'AMID', 'ANEW', 'APEX', 'ARCH', 'AREA', 'ARMY', 'ARTS', 'ATOM', 'AUNT', 'AUTO',
  'BABY', 'BACK', 'BAKE', 'BALD', 'BALE', 'BALL', 'BAND', 'BANE', 'BANK', 'BARE', 'BARK', 'BARN', 'BASE', 'BASH', 'BASK', 'BATH', 'BEAD', 'BEAK', 'BEAM', 'BEAN', 'BEAR', 'BEAT', 'BECK', 'BEEF', 'BEEN', 'BEER', 'BEET', 'BELL', 'BELT', 'BEND', 'BENT', 'BERG', 'BEST', 'BETA', 'BIAS', 'BIKE', 'BILE', 'BILL', 'BIND', 'BIRD', 'BITE', 'BLOW', 'BLUE', 'BLUR', 'BOAR', 'BOAT', 'BODY', 'BOIL', 'BOLD', 'BOLT', 'BOND', 'BONE', 'BOOK', 'BOOM', 'BOOT', 'BORE', 'BORN', 'BOSS', 'BOTH', 'BOWL', 'BRAG', 'BRAN', 'BRAT', 'BRAY', 'BRED', 'BREW', 'BRIM', 'BROW', 'BUCK', 'BUFF', 'BULB', 'BULK', 'BULL', 'BUMP', 'BUNK', 'BURN', 'BURP', 'BURY', 'BUSH', 'BUST', 'BUSY', 'BUZZ',
  'CAFE', 'CAGE', 'CAKE', 'CALF', 'CALL', 'CALM', 'CAME', 'CAMP', 'CANE', 'CAPE', 'CARD', 'CARE', 'CARP', 'CART', 'CASE', 'CASH', 'CAST', 'CAVE', 'CELL', 'CHAT', 'CHEF', 'CHEW', 'CHIN', 'CHIP', 'CHOP', 'CHOW', 'CITE', 'CITY', 'CLAD', 'CLAM', 'CLAN', 'CLAP', 'CLAW', 'CLAY', 'CLIP', 'CLOG', 'CLUB', 'CLUE', 'COAL', 'COAT', 'COAX', 'CODE', 'COIL', 'COIN', 'COLD', 'COLT', 'COMB', 'COME', 'CONE', 'COOK', 'COOL', 'COOP', 'COPE', 'COPY', 'CORD', 'CORE', 'CORK', 'CORN', 'COST', 'COSY', 'COVE', 'CRAB', 'CRAG', 'CRAM', 'CREW', 'CRIB', 'CROP', 'CROW', 'CUBE', 'CUFF', 'CULT', 'CURB', 'CURE', 'CURL', 'CUTE',
  'DAME', 'DAMP', 'DARE', 'DARK', 'DARN', 'DART', 'DASH', 'DATA', 'DATE', 'DAWN', 'DAYS', 'DAZE', 'DEAD', 'DEAF', 'DEAL', 'DEAN', 'DEAR', 'DEBT', 'DECK', 'DEED', 'DEEM', 'DEEP', 'DEER', 'DEFT', 'DELI', 'DELL', 'DEMO', 'DENT', 'DENY', 'DESK', 'DIAL', 'DICE', 'DIET', 'DIME', 'DINE', 'DING', 'DINT', 'DIRE', 'DIRT', 'DISC', 'DISH', 'DISK', 'DIVE', 'DOCK', 'DOER', 'DOES', 'DOLE', 'DOLL', 'DOME', 'DONE', 'DOOM', 'DOOR', 'DOSE', 'DOTE', 'DOVE', 'DOWN', 'DOZE', 'DRAB', 'DRAG', 'DRAM', 'DRAW', 'DREW', 'DRIP', 'DROP', 'DRUM', 'DUAL', 'DUCK', 'DUCT', 'DUDE', 'DUEL', 'DUET', 'DUKE', 'DULL', 'DULY', 'DUMB', 'DUMP', 'DUNE', 'DUNG', 'DUNK', 'DUSK', 'DUST', 'DUTY',
  'EACH', 'EARL', 'EARN', 'EARS', 'EASE', 'EAST', 'EASY', 'ECHO', 'EDGE', 'EDIT', 'EELS', 'EGGS', 'ELSE', 'EMIT', 'ENDS', 'ENVY', 'EPIC', 'EURO', 'EVEN', 'EVER', 'EVIL', 'EXAM', 'EXIT', 'EYES',
  'FACE', 'FACT', 'FADE', 'FAIL', 'FAIR', 'FAKE', 'FALL', 'FAME', 'FANG', 'FARE', 'FARM', 'FAST', 'FATE', 'FAWN', 'FEAR', 'FEAT', 'FEED', 'FEEL', 'FEET', 'FELL', 'FELT', 'FERN', 'FEST', 'FEUD', 'FILE', 'FILL', 'FILM', 'FIND', 'FINE', 'FIRE', 'FIRM', 'FISH', 'FIST', 'FIVE', 'FLAG', 'FLAP', 'FLAT', 'FLAW', 'FLEA', 'FLED', 'FLEE', 'FLEW', 'FLEX', 'FLIP', 'FLIT', 'FLOW', 'FOAM', 'FOIL', 'FOLD', 'FOLK', 'FOND', 'FONT', 'FOOD', 'FOOL', 'FOOT', 'FORD', 'FORE', 'FORK', 'FORM', 'FORT', 'FOUL', 'FOUR', 'FOWL', 'FRAY', 'FREE', 'FRET', 'FROG', 'FROM', 'FUEL', 'FULL', 'FUME', 'FUND', 'FURY', 'FUSE', 'FUSS', 'FUZZ',
  'GAIN', 'GAIT', 'GALA', 'GALE', 'GAME', 'GANG', 'GAPE', 'GARB', 'GASH', 'GASP', 'GATE', 'GAVE', 'GAZE', 'GEAR', 'GEMS', 'GENE', 'GENT', 'GERM', 'GIFT', 'GILD', 'GILL', 'GIRL', 'GIST', 'GIVE', 'GLAD', 'GLEE', 'GLEN', 'GLOW', 'GLUE', 'GNAT', 'GNAW', 'GOAL', 'GOAT', 'GOES', 'GOLD', 'GOLF', 'GONE', 'GOOD', 'GORE', 'GORY', 'GOWN', 'GRAB', 'GRAD', 'GRAM', 'GRAY', 'GREW', 'GREY', 'GRID', 'GRIM', 'GRIN', 'GRIP', 'GRIT', 'GROW', 'GRUB', 'GULF', 'GULL', 'GULP', 'GUMS', 'GURU', 'GUSH', 'GUST', 'GUYS',
  'HACK', 'HAIL', 'HAIR', 'HALE', 'HALF', 'HALL', 'HALO', 'HALT', 'HAND', 'HANG', 'HARE', 'HARK', 'HARM', 'HARP', 'HART', 'HASH', 'HAST', 'HATE', 'HAUL', 'HAVE', 'HAWK', 'HAZE', 'HAZY', 'HEAD', 'HEAL', 'HEAP', 'HEAR', 'HEAT', 'HEED', 'HEEL', 'HEIR', 'HELD', 'HELL', 'HELM', 'HELP', 'HEMP', 'HERB', 'HERD', 'HERE', 'HERO', 'HERS', 'HIDE', 'HIGH', 'HIKE', 'HILL', 'HILT', 'HIND', 'HINT', 'HIRE', 'HISS', 'HIVE', 'HOAX', 'HOBO', 'HOLD', 'HOLE', 'HOLY', 'HOME', 'HONE', 'HOOD', 'HOOF', 'HOOK', 'HOOP', 'HOOT', 'HOPE', 'HORN', 'HOSE', 'HOST', 'HOUR', 'HOWL', 'HUCK', 'HUFF', 'HUGE', 'HULL', 'HUMP', 'HUNG', 'HUNK', 'HUNT', 'HURL', 'HURT', 'HUSH', 'HUSK', 'HYMN',
  'ICON', 'IDEA', 'IDLE', 'IDOL', 'INCH', 'INFO', 'INTO', 'IRON', 'ISLE', 'ITEM',
  'JACK', 'JADE', 'JAIL', 'JARS', 'JAZZ', 'JEAN', 'JEEP', 'JEER', 'JELL', 'JERK', 'JEST', 'JETS', 'JIVE', 'JOBS', 'JOIN', 'JOKE', 'JOLT', 'JOTS', 'JOYS', 'JUDO', 'JUMP', 'JUNE', 'JUNK', 'JURY', 'JUST',
  'KALE', 'KEEN', 'KEEP', 'KELP', 'KEMP', 'KEPT', 'KEYS', 'KICK', 'KIDS', 'KILL', 'KILN', 'KILT', 'KIND', 'KING', 'KINK', 'KISS', 'KITE', 'KITH', 'KNEE', 'KNEW', 'KNIT', 'KNOB', 'KNOT', 'KNOW',
  'LACE', 'LACK', 'LACY', 'LADS', 'LADY', 'LAID', 'LAIR', 'LAKE', 'LAMB', 'LAME', 'LAMP', 'LAND', 'LANE', 'LANK', 'LAPS', 'LARD', 'LARK', 'LASH', 'LASS', 'LAST', 'LATE', 'LAUD', 'LAVA', 'LAWN', 'LAWS', 'LAYS', 'LAZE', 'LAZY', 'LEAD', 'LEAF', 'LEAK', 'LEAN', 'LEAP', 'LEFT', 'LEGS', 'LEND', 'LENS', 'LENT', 'LESS', 'LEST', 'LEVY', 'LIAR', 'LICE', 'LICK', 'LIDS', 'LIED', 'LIEN', 'LIES', 'LIFE', 'LIFT', 'LIKE', 'LILT', 'LILY', 'LIMB', 'LIME', 'LIMP', 'LINE', 'LING', 'LINK', 'LINT', 'LION', 'LIPS', 'LIST', 'LIVE', 'LOAD', 'LOAF', 'LOAM', 'LOAN', 'LOBE', 'LOCK', 'LOFT', 'LOGO', 'LOGS', 'LONE', 'LONG', 'LOOK', 'LOOM', 'LOOP', 'LOOT', 'LORD', 'LORE', 'LOSE', 'LOSS', 'LOST', 'LOTS', 'LOUD', 'LOVE', 'LUCK', 'LUGE', 'LULL', 'LUMP', 'LUNG', 'LURE', 'LURK', 'LUSH', 'LUST', 'LUTE', 'LYNX',
  'MACE', 'MADE', 'MAID', 'MAIL', 'MAIN', 'MAKE', 'MALE', 'MALL', 'MALT', 'MAMA', 'MANE', 'MANY', 'MAPS', 'MARE', 'MARK', 'MARS', 'MASH', 'MASK', 'MASS', 'MAST', 'MATE', 'MATH', 'MAUL', 'MAZE', 'MEAD', 'MEAL', 'MEAN', 'MEAT', 'MEEK', 'MEET', 'MELD', 'MELT', 'MEMO', 'MEND', 'MENU', 'MERE', 'MESH', 'MESS', 'MICA', 'MICE', 'MILD', 'MILE', 'MILK', 'MILL', 'MIME', 'MIND', 'MINE', 'MINI', 'MINK', 'MINT', 'MIRE', 'MISS', 'MIST', 'MITE', 'MITT', 'MOAN', 'MOAT', 'MOCK', 'MODE', 'MOLD', 'MOLE', 'MOLT', 'MONK', 'MOOD', 'MOON', 'MOOR', 'MOOT', 'MORE', 'MORN', 'MOSS', 'MOST', 'MOTH', 'MOVE', 'MUCH', 'MUCK', 'MUFF', 'MUGS', 'MULE', 'MULL', 'MUSE', 'MUSH', 'MUSK', 'MUST', 'MUTE', 'MUTT', 'MYTH',
  'NAIL', 'NAME', 'NAPE', 'NAVY', 'NEAR', 'NEAT', 'NECK', 'NEED', 'NEON', 'NEST', 'NETS', 'NEWS', 'NEWT', 'NEXT', 'NICE', 'NICK', 'NINE', 'NODE', 'NONE', 'NOOK', 'NOON', 'NORM', 'NOSE', 'NOTE', 'NOUN', 'NOVA', 'NUDE', 'NUMB',
  'OAKS', 'OARS', 'OATH', 'OATS', 'OBEY', 'ODDS', 'ODOR', 'OFFS', 'OGLE', 'OILS', 'OILY', 'OKAY', 'OMEN', 'OMIT', 'ONCE', 'ONLY', 'ONTO', 'OOZE', 'OPAL', 'OPEN', 'OPUS', 'ORAL', 'ORBS', 'ORCA', 'ORES', 'OURS', 'OUST', 'OVAL', 'OVEN', 'OVER', 'OWED', 'OWES', 'OWLS', 'OWNS',
  'PACE', 'PACK', 'PACT', 'PADS', 'PAGE', 'PAID', 'PAIL', 'PAIN', 'PAIR', 'PALE', 'PALM', 'PALS', 'PANE', 'PANG', 'PANS', 'PANT', 'PAPA', 'PARK', 'PART', 'PASS', 'PAST', 'PATH', 'PAVE', 'PAWL', 'PAWN', 'PAWS', 'PAYS', 'PEAK', 'PEAL', 'PEAR', 'PEAS', 'PEAT', 'PECK', 'PEEK', 'PEEL', 'PEEP', 'PEER', 'PELT', 'PEND', 'PENS', 'PENT', 'PERK', 'PERM', 'PEST', 'PETS', 'PEWS', 'PICK', 'PIED', 'PIER', 'PIES', 'PIGS', 'PIKE', 'PILE', 'PILL', 'PINE', 'PING', 'PINK', 'PINS', 'PINT', 'PIPE', 'PITH', 'PITY', 'PLAN', 'PLAY', 'PLEA', 'PLOD', 'PLOP', 'PLOT', 'PLOW', 'PLOY', 'PLUG', 'PLUM', 'PLUS', 'POCK', 'PODS', 'POEM', 'POET', 'POKE', 'POLE', 'POLL', 'POLO', 'POMP', 'POND', 'PONY', 'POOL', 'POOR', 'POPE', 'POPS', 'PORE', 'PORK', 'PORT', 'POSE', 'POSH', 'POST', 'POSY', 'POTS', 'POUR', 'POUT', 'PRAY', 'PREP', 'PREY', 'PROD', 'PROF', 'PROM', 'PROP', 'PROW', 'PUFF', 'PUGS', 'PUKE', 'PULL', 'PULP', 'PUMA', 'PUMP', 'PUNK', 'PUNS', 'PUNT', 'PUPIL', 'PUPS', 'PURE', 'PURR', 'PUSH', 'PUTS', 'PUTT',
  'QUAD', 'QUAY', 'QUIT', 'QUIZ',
  'RACE', 'RACK', 'RAFT', 'RAGE', 'RAGS', 'RAID', 'RAIL', 'RAIN', 'RAKE', 'RAMP', 'RAMS', 'RANG', 'RANK', 'RANT', 'RAPS', 'RAPT', 'RARE', 'RASH', 'RASP', 'RATE', 'RATS', 'RAVE', 'RAYS', 'RAZE', 'READ', 'REAL', 'REAM', 'REAP', 'REAR', 'REED', 'REEF', 'REEK', 'REEL', 'REIN', 'RELY', 'REND', 'RENT', 'REST', 'RICE', 'RICH', 'RICK', 'RIDE', 'RIFE', 'RIFF', 'RIFT', 'RIGS', 'RILE', 'RILL', 'RIME', 'RIND', 'RING', 'RINK', 'RIOT', 'RIPE', 'RISE', 'RISK', 'RITE', 'ROAD', 'ROAM', 'ROAN', 'ROAR', 'ROBE', 'ROBS', 'ROCK', 'RODE', 'RODS', 'ROLE', 'ROLL', 'ROOF', 'ROOK', 'ROOM', 'ROOT', 'ROPE', 'ROSE', 'ROSY', 'ROTE', 'ROUT', 'ROVE', 'ROWS', 'RUBS', 'RUBY', 'RUCK', 'RUDE', 'RUFF', 'RUGS', 'RUIN', 'RULE', 'RUMP', 'RUNG', 'RUNS', 'RUNT', 'RUSE', 'RUSH', 'RUST', 'RUTS',
  'SACK', 'SAFE', 'SAGA', 'SAGE', 'SAID', 'SAIL', 'SAKE', 'SALE', 'SALT', 'SAME', 'SAND', 'SANE', 'SANG', 'SANK', 'SANS', 'SAPS', 'SASH', 'SAVE', 'SAWS', 'SAYS', 'SCAB', 'SCAM', 'SCAN', 'SCAR', 'SCAT', 'SEAL', 'SEAM', 'SEAR', 'SEAS', 'SEAT', 'SECT', 'SEED', 'SEEK', 'SEEM', 'SEEN', 'SEEP', 'SELF', 'SELL', 'SEMI', 'SEND', 'SENT', 'SERF', 'SETS', 'SHAM', 'SHED', 'SHIN', 'SHIP', 'SHOD', 'SHOE', 'SHOO', 'SHOP', 'SHOT', 'SHOW', 'SHUN', 'SHUT', 'SICK', 'SIDE', 'SIFT', 'SIGH', 'SIGN', 'SILK', 'SILL', 'SILO', 'SILT', 'SING', 'SINK', 'SINS', 'SIPS', 'SIRE', 'SIRS', 'SITE', 'SITS', 'SIZE', 'SKEW', 'SKID', 'SKIM', 'SKIN', 'SKIP', 'SKIS', 'SKIT', 'SLAB', 'SLAG', 'SLAM', 'SLAP', 'SLAT', 'SLAW', 'SLAY', 'SLED', 'SLEW', 'SLID', 'SLIM', 'SLIP', 'SLIT', 'SLOB', 'SLOG', 'SLOP', 'SLOT', 'SLOW', 'SLUG', 'SLUM', 'SLUR', 'SMOG', 'SMUG', 'SNAG', 'SNAP', 'SNIP', 'SNOB', 'SNOW', 'SNUB', 'SNUG', 'SOAK', 'SOAP', 'SOAR', 'SOBS', 'SOCK', 'SODA', 'SODS', 'SOFA', 'SOFT', 'SOIL', 'SOLD', 'SOLE', 'SOLO', 'SOME', 'SONG', 'SONS', 'SOON', 'SOOT', 'SORE', 'SORT', 'SOUL', 'SOUP', 'SOUR', 'SOWN', 'SOWS', 'SOYA', 'SPAN', 'SPAR', 'SPAT', 'SPEC', 'SPED', 'SPIN', 'SPIT', 'SPOT', 'SPRY', 'SPUD', 'SPUN', 'SPUR', 'STAB', 'STAG', 'STAR', 'STAT', 'STAY', 'STEM', 'STEP', 'STEW', 'STIR', 'STOP', 'STOW', 'STUB', 'STUD', 'STUN', 'SUCH', 'SUDS', 'SUED', 'SUES', 'SUET', 'SUIT', 'SULK', 'SUMO', 'SUMP', 'SUMS', 'SUNG', 'SUNK', 'SUNS', 'SURE', 'SURF', 'SWAB', 'SWAM', 'SWAN', 'SWAP', 'SWAT', 'SWAY', 'SWIG', 'SWIM', 'SWUM', 'SYNC',
  'TABS', 'TACK', 'TACO', 'TACT', 'TAGS', 'TAIL', 'TAKE', 'TALE', 'TALK', 'TALL', 'TAME', 'TAMP', 'TANG', 'TANK', 'TANS', 'TAPE', 'TAPS', 'TARE', 'TARP', 'TARS', 'TART', 'TASK', 'TAUT', 'TAXI', 'TEAK', 'TEAL', 'TEAM', 'TEAR', 'TEAS', 'TEAT', 'TECH', 'TEEM', 'TEEN', 'TELL', 'TEMP', 'TEND', 'TENS', 'TENT', 'TERM', 'TERN', 'TEST', 'TEXT', 'THAN', 'THAT', 'THAW', 'THEE', 'THEM', 'THEN', 'THEY', 'THIN', 'THIS', 'THOU', 'THUD', 'THUG', 'THUS', 'TICK', 'TIDE', 'TIDY', 'TIED', 'TIER', 'TIES', 'TIFF', 'TILE', 'TILL', 'TILT', 'TIME', 'TINE', 'TING', 'TINS', 'TINT', 'TINY', 'TIPS', 'TIRE', 'TOAD', 'TOCK', 'TOED', 'TOES', 'TOFF', 'TOFU', 'TOGS', 'TOIL', 'TOLD', 'TOLL', 'TOMB', 'TOME', 'TONE', 'TONG', 'TONS', 'TOOK', 'TOOL', 'TOOT', 'TOPS', 'TORE', 'TORN', 'TORT', 'TOSS', 'TOTE', 'TOTS', 'TOUR', 'TOUT', 'TOWN', 'TOWS', 'TOYS', 'TRAM', 'TRAP', 'TRAY', 'TREE', 'TREK', 'TRIM', 'TRIO', 'TRIP', 'TROD', 'TROT', 'TRUE', 'TSAR', 'TUBA', 'TUBE', 'TUBS', 'TUCK', 'TUFT', 'TUGS', 'TUNA', 'TUNE', 'TURF', 'TURN', 'TUSK', 'TUTU', 'TWIG', 'TWIN', 'TWIT', 'TWOS', 'TYPE',
  'UGLY', 'UNDO', 'UNIT', 'UNTO', 'UPON', 'URGE', 'URNS', 'USED', 'USER', 'USES',
  'VAIN', 'VALE', 'VAMP', 'VANE', 'VANS', 'VARY', 'VASE', 'VAST', 'VATS', 'VEAL', 'VEER', 'VEIL', 'VEIN', 'VELD', 'VEND', 'VENT', 'VERB', 'VERY', 'VEST', 'VETO', 'VETS', 'VIAL', 'VICE', 'VIEW', 'VILE', 'VINE', 'VISA', 'VISE', 'VOID', 'VOLT', 'VOTE', 'VOWS',
  'WADE', 'WADS', 'WAFT', 'WAGE', 'WAGS', 'WAIF', 'WAIL', 'WAIT', 'WAKE', 'WALK', 'WALL', 'WAND', 'WANE', 'WANT', 'WARD', 'WARE', 'WARM', 'WARN', 'WARP', 'WARS', 'WART', 'WARY', 'WASH', 'WASP', 'WATT', 'WAVE', 'WAVY', 'WAXY', 'WAYS', 'WEAK', 'WEAL', 'WEAN', 'WEAR', 'WEBS', 'WEDS', 'WEED', 'WEEK', 'WEEP', 'WELD', 'WELL', 'WELT', 'WEND', 'WENT', 'WEPT', 'WERE', 'WEST', 'WETS', 'WHAT', 'WHEE', 'WHEN', 'WHET', 'WHEW', 'WHEY', 'WHIM', 'WHIP', 'WHIR', 'WHIT', 'WHIZ', 'WHOM', 'WICK', 'WIDE', 'WIFE', 'WIGS', 'WILD', 'WILE', 'WILL', 'WILT', 'WILY', 'WIMP', 'WIND', 'WINE', 'WING', 'WINK', 'WINS', 'WIPE', 'WIRE', 'WIRY', 'WISE', 'WISH', 'WISP', 'WITS', 'WOES', 'WOKE', 'WOLF', 'WOMB', 'WONK', 'WONS', 'WOOD', 'WOOF', 'WOOL', 'WOOS', 'WORD', 'WORE', 'WORK', 'WORM', 'WORN', 'WORT', 'WOVE', 'WREN', 'WRIT',
  'YACK', 'YAKS', 'YAMS', 'YANK', 'YAPS', 'YARD', 'YARN', 'YAWN', 'YAWS', 'YEAH', 'YEAR', 'YEAS', 'YELL', 'YELP', 'YENS', 'YESES', 'YETI', 'YEWS', 'YIELD', 'YOGA', 'YOGI', 'YOKE', 'YOLK', 'YORE', 'YOUR', 'YOWL', 'YOYO', 'YUCK', 'YULE',
  'ZANY', 'ZAPS', 'ZEAL', 'ZEBU', 'ZEDS', 'ZEES', 'ZERO', 'ZEST', 'ZETA', 'ZIGS', 'ZINC', 'ZING', 'ZIPS', 'ZITS', 'ZONE', 'ZOOM', 'ZOOS',
  'APPLE', 'HOUSE', 'TIGER', 'ZEBRA', 'TRAIN', 'OCEAN', 'PLANT', 'SPACE', 'WATER', 'EARTH', 'LIGHT', 'MUSIC', 'SMILE', 'HEART', 'BRAIN', 'CLOUD', 'DREAM', 'EAGLE', 'FLAME', 'GRAPE', 'HONEY', 'IVORY', 'JEWEL', 'LEMON', 'MAGIC', 'NOBLE', 'ORBIT', 'PEARL', 'QUEEN', 'RIVER', 'STONE', 'WORLD', 'YOUTH', 'ZESTY', 'ANGEL', 'BRAVE', 'CHARM', 'DANCE', 'FAITH', 'GLORY', 'HAPPY', 'IDEAL', 'JOLLY', 'KARMA', 'LUCKY', 'MERRY', 'NORTH', 'OLIVE', 'PEACE', 'QUEST', 'ROYAL', 'SOLAR', 'TRUST', 'UNITY', 'VIVID', 'WHALE', 'XENON', 'YACHT',
]);

// Add all world vocabulary words automatically
for (const w of ALPHABET_WORLDS) {
  [...w.kidsWords, ...w.explorerWords, ...w.masterWords].forEach((entry) => {
    const clean = entry.word.toUpperCase().replace(/[^A-Z]/g, '');
    if (clean.length >= 3) COMMON_BUILD_WORDS.add(clean);
  });
}

export function canBuildWordFromBank(candidate: string, bank: string[]): boolean {
  const clean = candidate.toUpperCase().replace(/[^A-Z]/g, '');
  if (clean.length < 3) return false;
  const counts = new Map<string, number>();
  for (const ch of bank) {
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  for (const ch of clean) {
    const cur = counts.get(ch) ?? 0;
    if (cur <= 0) return false;
    counts.set(ch, cur - 1);
  }
  return true;
}

export function isValidEnglishBuildWord(candidate: string, bank: string[]): boolean {
  const clean = candidate.toUpperCase().replace(/[^A-Z]/g, '');
  return canBuildWordFromBank(clean, bank) && COMMON_BUILD_WORDS.has(clean);
}

export function generateWordBuildBank(world: AlphabetWorld, seed: number): {
  bank: string[];
  possibleWords: string[];
} {
  // Always seed from a rich 8-letter vowel-balanced bank containing world.letter
  const anchor = world.letter;
  const baseConsonants = ['R', 'S', 'T', 'L', 'N', 'P', 'C', 'M', 'D', 'B', 'G', 'H'];
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  const pickedVowels = deterministicShuffle(vowels, seed).slice(0, 3);
  if (!pickedVowels.includes(anchor) && vowels.includes(anchor)) {
    pickedVowels[0] = anchor;
  }
  const pickedConsonants = deterministicShuffle(
    baseConsonants.filter((c) => c !== anchor),
    seed + 5,
  ).slice(0, vowels.includes(anchor) ? 5 : 4);

  const bank = deterministicShuffle(
    vowels.includes(anchor)
      ? [...pickedVowels, ...pickedConsonants]
      : [anchor, ...pickedVowels, ...pickedConsonants],
    seed + 11,
  );

  const possibleWords: string[] = [];
  COMMON_BUILD_WORDS.forEach((word) => {
    if (canBuildWordFromBank(word, bank)) {
      possibleWords.push(word);
    }
  });

  return {
    bank,
    possibleWords: possibleWords.sort(),
  };
}
