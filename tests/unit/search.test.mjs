/**
 * Unit tests for the local ranked search (src/utils/searchRank.ts).
 * Run: npm run test:unit
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankSearch, tokenize, normalize, highlightParts } from '../../src/utils/searchRank.ts';

const people = [
  { id: 'p1', name: 'Nusrat Jahan', designation: 'Graduate Researcher', department: 'CSE', interests: ['Natural Language Processing', 'Machine Learning'], bio: 'Works on Bangla OCR.' },
  { id: 'p2', name: 'Tahsin Rahman', designation: 'Lecturer', department: 'CSE', interests: ['Computer Vision'], bio: 'Mentions Nusrat once.' },
  { id: 'p3', name: 'Rakib Hasan', designation: 'Graduate Researcher', department: 'CSE', interests: ['Internet of Things'] },
];
const works = [
  { id: 'w1', title: 'OCR for Bangla handwriting', description: 'A dataset and baseline model.', authorName: 'Nusrat Jahan', topics: ['#BanglaNLP', '#OCR'], postType: 'work', stage: 'Experiment' },
  { id: 'w2', title: 'Campus intrusion detection', description: 'Anomaly detection on network flows.', authorName: 'Tahsin Rahman', topics: ['#Cybersecurity'], postType: 'collaboration', lookingFor: ['#MLEngineer', '#DataAnnotation'], collabStatus: 'open' },
  { id: 'w3', title: 'Soil sensor mesh', description: 'LoRa mesh for rice fields.', authorName: 'Rakib Hasan', topics: ['#IoT'], postType: 'collaboration', lookingFor: ['#HardwareEngineer'], collabStatus: 'closed' },
];
const topics = [
  { id: 't1', name: 'Machine Learning', category: 'AI', description: 'Learning from data' },
  { id: 't2', name: 'Natural Language Processing', category: 'AI', description: 'Text and speech' },
];
const run = (q) => rankSearch(q, { people, works, topics });

test('normalize / tokenize handle hashtags, CamelCase and punctuation', () => {
  assert.equal(normalize('#MachineLearning, C++'), 'machine learning c++');
  assert.deepEqual(tokenize('  Bangla   OCR bangla '), ['bangla', 'ocr']);
});

test('multi-word queries match in any order', () => {
  assert.deepEqual(run('bangla ocr').work.map((h) => h.item.id), ['w1']);
  assert.deepEqual(run('ocr bangla').work.map((h) => h.item.id), ['w1']);
});

test('every word must match (AND)', () => {
  assert.equal(run('bangla cybersecurity').counts.all, 0);
});

test('name matches rank above bio mentions', () => {
  const ids = run('nusrat').people.map((h) => h.item.id);
  assert.deepEqual(ids, ['p1', 'p2']);
  assert.equal(run('nusrat').people[0].reason, null);
  assert.match(run('nusrat').people[1].reason, /^Bio:/);
});

test('collaboration roles are searchable, with a reason', () => {
  for (const q of ['ML Engineer', '#MLEngineer', 'mlengineer', 'data annotation']) {
    const r = run(q);
    assert.deepEqual(r.collaborations.map((h) => h.item.id), ['w2'], q);
  }
  assert.match(run('data annotation').collaborations[0].reason, /^Looking for #DataAnnotation/);
});

test('"collaboration" finds collaboration posts, open ones first', () => {
  assert.deepEqual(run('collaboration').collaborations.map((h) => h.item.id), ['w2', 'w3']);
});

test('one typo is tolerated for longer words', () => {
  assert.ok(run('machin lerning').topics.some((h) => h.item.id === 't1'));
  assert.ok(run('hardwar').collaborations.length === 1);
});

test('acronyms expand (NLP, IoT, ML)', () => {
  assert.ok(run('nlp').people.some((h) => h.item.id === 'p1'));
  assert.ok(run('iot').people.some((h) => h.item.id === 'p3'));
  assert.ok(run('ml').topics.some((h) => h.item.id === 't1'));
});

test('counts per filter', () => {
  const r = run('cse');
  assert.equal(r.counts.people, 3);
  assert.equal(r.counts.all, r.counts.people + r.counts.collaborations + r.counts.work + r.counts.topics);
});

test('highlightParts marks the matching words', () => {
  const parts = highlightParts('OCR for Bangla handwriting', ['bangla', 'ocr']);
  assert.deepEqual(parts.filter((p) => p.match).map((p) => p.text), ['OCR', 'Bangla']);
  assert.equal(parts.map((p) => p.text).join(''), 'OCR for Bangla handwriting');
});

test('empty query returns nothing', () => {
  assert.equal(run('   ').counts.all, 0);
});
