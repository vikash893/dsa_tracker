// ============================================================
// DSATracker API — File Parser Utility
// Parses Excel/CSV for question import.
// ============================================================

import { Difficulty } from '@dsa-tracker/types';
import { detectPlatformFromName, detectPlatformFromUrl } from './platformDetector.js';

export interface ParsedQuestion {
  title: string;
  platform: string;
  url?: string;
  difficulty?: string;
  topic?: string;
  company?: string;
  points?: number;
  externalProblemId?: string;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  errors: { row: number; message: string }[];
  totalRows: number;
}

/**
 * Parse CSV content into question objects.
 * Expected columns: title, platform, url, difficulty, topic, company, points
 */
export function parseCsvContent(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return { questions: [], errors: [{ row: 0, message: 'File must have a header row and at least one data row' }], totalRows: 0 };
  }

  const header = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
  const titleIdx = header.indexOf('title');
  const platformIdx = header.indexOf('platform');
  const urlIdx = header.indexOf('url');
  const diffIdx = header.indexOf('difficulty');
  const topicIdx = header.indexOf('topic');
  const companyIdx = header.indexOf('company');
  const pointsIdx = header.indexOf('points');

  if (titleIdx === -1) {
    return { questions: [], errors: [{ row: 0, message: 'Missing required column: title' }], totalRows: 0 };
  }

  const questions: ParsedQuestion[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]!);
    const title = cols[titleIdx]?.trim();
    if (!title) {
      errors.push({ row: i + 1, message: 'Missing title' });
      continue;
    }

    const url = urlIdx >= 0 ? cols[urlIdx]?.trim() : undefined;
    let platform = platformIdx >= 0 ? cols[platformIdx]?.trim() : undefined;

    // Auto-detect platform from URL if not provided
    if (!platform && url) {
      const detected = detectPlatformFromUrl(url);
      if (detected) platform = detected.platform;
    }

    const difficulty = diffIdx >= 0 ? cols[diffIdx]?.trim()?.toUpperCase() : undefined;
    if (difficulty && !Object.values(Difficulty).includes(difficulty as Difficulty)) {
      errors.push({ row: i + 1, message: `Invalid difficulty: ${difficulty}` });
    }

    questions.push({
      title,
      platform: platform ? detectPlatformFromName(platform) : 'CUSTOM',
      url: url || undefined,
      difficulty: difficulty || undefined,
      topic: topicIdx >= 0 ? cols[topicIdx]?.trim() : undefined,
      company: companyIdx >= 0 ? cols[companyIdx]?.trim() : undefined,
      points: pointsIdx >= 0 ? parseInt(cols[pointsIdx] || '0') || undefined : undefined,
    });
  }

  return { questions, errors, totalRows: lines.length - 1 };
}

/**
 * Parse a single CSV line handling quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
