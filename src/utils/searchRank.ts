/**
 * src/utils/searchRank.ts
 *
 * Local, ranked search over the loaded directory (no external service).
 * Pure — no React Native / '@/…' runtime imports — so it is unit-tested with
 * plain Node (tests/unit/search.test.mjs).
 *
 *  - every query word must match somewhere (order doesn't matter)
 *  - matches score by field: name/title > roles/topics > author > bio/description
 *  - word, prefix, substring and 1-typo (words ≥ 5 letters) matching
 *  - '#MachineLearning', 'machine learning' and 'machinelearning' are the same
 *  - common acronyms: ML, AI, NLP, CV, HCI, IoT, DB, SE
 */

// ---------------------------------------------------------------------------
// Types (structural, so the app's UserProfile / CurrentWork / Topic fit)
// ---------------------------------------------------------------------------

export type SearchFilter = 'all' | 'people' | 'collaborations' | 'work' | 'topics';

export interface SearchPerson {
  id: string;
  name: string;
  department?: string;
  designation?: string;
  batch?: string;
  bio?: string;
  interests?: string[];
}

export interface SearchWork {
  id: string;
  title: string;
  description?: string;
  authorName?: string;
  stage?: string;
  topics?: string[];
  postType?: 'work' | 'collaboration';
  lookingFor?: string[];
  collabStatus?: 'open' | 'closed';
  createdAt?: string;
}

export interface SearchTopic {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  description?: string;
}

export interface Hit<T> {
  item: T;
  score: number;
  /** Why it matched, e.g. "Looking for #MLEngineer" (null when the main field matched). */
  reason: string | null;
}

export interface RankedResults<P, W, T> {
  terms: string[];
  people: Hit<P>[];
  collaborations: Hit<W>[];
  work: Hit<W>[];
  topics: Hit<T>[];
  counts: Record<SearchFilter, number>;
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

const ACRONYMS: Record<string, string> = {
  ml: 'machinelearning',
  ai: 'artificialintelligence',
  nlp: 'naturallanguageprocessing',
  cv: 'computervision',
  hci: 'humancomputerinteraction',
  iot: 'internetofthings',
  db: 'database',
  se: 'softwareengineering',
  dl: 'deeplearning',
};

/** "#MachineLearning, C++" → "machine learning c++" */
export function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim();
}

const compact = (value: string) => value.replace(/\s+/g, '');

/** Query → unique words (keeps 1-letter words only if they are the whole query). */
export function tokenize(query: string): string[] {
  const words = normalize(query).split(' ').filter(Boolean);
  const meaningful = words.filter((w) => w.length > 1 || words.length === 1);
  return Array.from(new Set(meaningful));
}

/** Levenshtein distance capped at 2 (enough for "1 typo" checks). */
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

interface Field {
  label: string;
  value: string;
  weight: number;
  words: string[];
  compact: string;
}

const field = (label: string, value: string | null | undefined, weight: number): Field | null => {
  const norm = normalize(value);
  if (!norm) return null;
  return { label, value: String(value), weight, words: norm.split(' '), compact: compact(norm) };
};

/** 0..1 strength of one query word against one field. */
function strength(term: string, f: Field): number {
  const acronym = ACRONYMS[term];
  if (acronym && f.compact.includes(acronym)) return 1;
  if (f.words.includes(term)) return 1;
  if (term.length >= 2 && f.words.some((w) => w.startsWith(term))) return 0.8;
  if (term.length >= 3 && f.compact.includes(term)) return 0.6;
  if (term.length >= 5 && f.words.some((w) => w.length >= 4 && withinOneEdit(term, w))) return 0.5;
  return 0;
}

/**
 * Score an item: every term must match some field (AND). Returns null when it
 * doesn't match. `primary` fields (name/title) don't produce a "reason".
 */
function scoreFields(terms: string[], fields: (Field | null)[], phrase: string, primary: Set<string>) {
  const list = fields.filter((f): f is Field => f !== null);
  let score = 0;
  let best: { f: Field; s: number } | null = null;
  let primaryHit = false;

  for (const term of terms) {
    let top: { f: Field; s: number } | null = null;
    for (const f of list) {
      const s = strength(term, f) * f.weight;
      if (s > 0 && (!top || s > top.s)) top = { f, s };
    }
    if (!top) return null;
    score += top.s;
    if (primary.has(top.f.label)) primaryHit = true;
    else if (!best || top.s > best.s) best = top;
  }

  // Whole-phrase bonus in a primary field (e.g. exact title / name match)
  const phraseKey = compact(phrase);
  if (phraseKey.length >= 3) {
    for (const f of list) {
      if (primary.has(f.label) && f.compact.includes(phraseKey)) {
        score += f.weight * 2;
        if (f.compact.startsWith(phraseKey)) score += f.weight;
        primaryHit = true;
        break;
      }
    }
  }

  const reason = !primaryHit && best ? `${best.f.label} ${best.f.value}`.trim() : null;
  return { score, reason };
}

const byScore = <T,>(a: Hit<T>, b: Hit<T>) => b.score - a.score;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function rankSearch<P extends SearchPerson, W extends SearchWork, T extends SearchTopic>(
  query: string,
  data: { people: P[]; works: W[]; topics: T[] },
): RankedResults<P, W, T> {
  const terms = tokenize(query);
  const empty = { all: 0, people: 0, collaborations: 0, work: 0, topics: 0 };
  if (terms.length === 0) {
    return { terms, people: [], collaborations: [], work: [], topics: [], counts: empty };
  }
  const phrase = normalize(query);

  const people: Hit<P>[] = [];
  for (const p of data.people) {
    const r = scoreFields(
      terms,
      [
        field('name', p.name, 10),
        ...(p.interests ?? []).map((i) => field('Interested in', i, 6)),
        field('', p.designation, 4),
        field('', p.department, 2),
        field('Batch', p.batch, 2),
        field('Bio:', p.bio, 2),
      ],
      phrase,
      new Set(['name']),
    );
    if (r) people.push({ item: p, score: r.score, reason: r.reason });
  }

  const collaborations: Hit<W>[] = [];
  const work: Hit<W>[] = [];
  for (const w of data.works) {
    const isCollab = w.postType === 'collaboration';
    const r = scoreFields(
      terms,
      [
        field('title', w.title, 10),
        ...(w.lookingFor ?? []).map((role) => field('Looking for', role, 7)),
        ...(w.topics ?? []).map((t) => field('Topic', t, 6)),
        field('By', w.authorName, 5),
        isCollab ? field('', 'collaboration collaborators team join', 3) : field('', 'research work', 2),
        field('Stage:', w.stage, 2),
        field('', w.description, 2),
      ],
      phrase,
      new Set(['title', '']),
    );
    if (!r) continue;
    // Open collaborations get a small boost — they need people now.
    const score = r.score + (isCollab && w.collabStatus !== 'closed' ? 1 : 0);
    (isCollab ? collaborations : work).push({ item: w, score, reason: r.reason });
  }

  const topics: Hit<T>[] = [];
  for (const t of data.topics) {
    const r = scoreFields(
      terms,
      [field('name', t.name, 10), field('', t.category, 4), field('', t.description, 1)],
      phrase,
      new Set(['name', '']),
    );
    if (r) topics.push({ item: t, score: r.score, reason: null });
  }

  people.sort(byScore);
  collaborations.sort(byScore);
  work.sort(byScore);
  topics.sort(byScore);

  const counts = {
    people: people.length,
    collaborations: collaborations.length,
    work: work.length,
    topics: topics.length,
    all: people.length + collaborations.length + work.length + topics.length,
  };
  return { terms, people, collaborations, work, topics, counts };
}

/**
 * Split text into highlighted / plain parts for the query terms
 * (word-prefix and substring matches, case-insensitive).
 */
export function highlightParts(text: string, terms: string[]): { text: string; match: boolean }[] {
  const usable = terms.filter((t) => t.length >= 2).sort((a, b) => b.length - a.length);
  if (!text || usable.length === 0) return [{ text, match: false }];
  const escaped = usable.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts: { text: string; match: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start), match: false });
    parts.push({ text: m[0], match: true });
    last = start + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), match: false });
  return parts.length ? parts : [{ text, match: false }];
}
