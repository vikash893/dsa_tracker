// ============================================================
// DSATracker API — Application Constants
// ============================================================

/** Default topics for questions (configurable by Super Admin via SystemSetting) */
export const DEFAULT_TOPICS = [
  'Array',
  'String',
  'Hashing',
  'Two Pointer',
  'Sliding Window',
  'Binary Search',
  'Stack',
  'Queue',
  'Linked List',
  'Tree',
  'BST',
  'Graph',
  'Dynamic Programming',
  'Greedy',
  'Backtracking',
  'Heap',
  'Trie',
  'Bit Manipulation',
  'Math',
  'Recursion',
  'Sorting',
  'Matrix',
  'Segment Tree',
  'Disjoint Set',
  'Design',
] as const;

/** Default scoring configuration */
export const DEFAULT_SCORING = {
  difficultyPoints: {
    EASY: 10,
    MEDIUM: 25,
    HARD: 50,
    EXPERT: 80,
  },
  bonuses: {
    streakBonus: 2,           // extra points per streak day
    weeklyCompletionBonus: 50,
    accuracyBonus: 20,        // >90% accuracy
    speedBonus: 15,           // under expected time
    firstAttemptBonus: 10,
  },
  penalties: {
    lateSubmission: -5,
  },
} as const;

/** XP thresholds for leveling */
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5
  1750,   // Level 6
  2750,   // Level 7
  4000,   // Level 8
  5500,   // Level 9
  7500,   // Level 10
  10000,  // Level 11
  13000,  // Level 12
  16500,  // Level 13
  20500,  // Level 14
  25000,  // Level 15
  30000,  // Level 16
  36000,  // Level 17
  43000,  // Level 18
  51000,  // Level 19
  60000,  // Level 20
] as const;

/** Pagination defaults */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

/** Token expiration defaults */
export const TOKEN_CONFIG = {
  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
  PASSWORD_RESET_EXPIRY_HOURS: 1,
  INVITATION_EXPIRY_DAYS: 7,
} as const;

/** Bcrypt salt rounds */
export const BCRYPT_SALT_ROUNDS = 12;
