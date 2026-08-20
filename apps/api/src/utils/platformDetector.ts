// ============================================================
// DSATracker API — Platform Detection Utility
// Detects coding platform from a URL and extracts problem info.
// ============================================================

import { Platform } from '@dsa-tracker/types';

export interface DetectedProblem {
  platform: Platform;
  externalProblemId?: string;
  title?: string;
  slug?: string;
  problemUrl: string;
}

const PLATFORM_PATTERNS: {
  platform: Platform;
  pattern: RegExp;
  extract: (url: string, match: RegExpMatchArray) => Partial<DetectedProblem>;
}[] = [
  {
    platform: Platform.LEETCODE,
    pattern: /leetcode\.com\/problems?\/([\w-]+)/i,
    extract: (_url, match) => ({
      externalProblemId: match[1],
      slug: match[1],
      title: match[1]!.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }),
  },
  {
    platform: Platform.CODEFORCES,
    pattern: /codeforces\.com\/(?:problemset\/)?problem\/(\d+)\/([A-Z]\d?)/i,
    extract: (_url, match) => ({
      externalProblemId: `${match[1]}${match[2]}`,
      title: `Problem ${match[1]}${match[2]}`,
    }),
  },
  {
    platform: Platform.CODECHEF,
    pattern: /codechef\.com\/(?:problems|submit)\/([\w]+)/i,
    extract: (_url, match) => ({
      externalProblemId: match[1],
      title: match[1],
    }),
  },
  {
    platform: Platform.GFG,
    pattern: /geeksforgeeks\.org\/problems?\/([\w-]+)/i,
    extract: (_url, match) => ({
      externalProblemId: match[1],
      slug: match[1],
      title: match[1]!.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }),
  },
];

/**
 * Detect the platform and extract problem info from a URL.
 */
export function detectPlatformFromUrl(url: string): DetectedProblem | null {
  for (const { platform, pattern, extract } of PLATFORM_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return {
        platform,
        problemUrl: url,
        ...extract(url, match),
      };
    }
  }
  return null;
}

/**
 * Detect platform from a string name.
 */
export function detectPlatformFromName(name: string): Platform {
  const lower = name.toLowerCase().trim();
  if (lower.includes('leetcode') || lower === 'lc') return Platform.LEETCODE;
  if (lower.includes('codeforces') || lower === 'cf') return Platform.CODEFORCES;
  if (lower.includes('codechef') || lower === 'cc') return Platform.CODECHEF;
  if (lower.includes('geeksforgeeks') || lower.includes('gfg')) return Platform.GFG;
  return Platform.CUSTOM;
}
