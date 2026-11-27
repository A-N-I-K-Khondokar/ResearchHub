// Unit tests for the pure contact helpers (src/utils/contact.ts).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { contactValueFor } from '../../src/utils/contact.ts';

describe('contactValueFor — copy only the number / handle / email / link', () => {
  it('WhatsApp text → just the international number', () => {
    assert.equal(contactValueFor('WhatsApp +880 1712-345678'), '+8801712345678');
    assert.equal(contactValueFor('wa.me/8801712345678'), '+8801712345678');
  });
  it('Telegram text → @handle', () => {
    assert.equal(contactValueFor('Telegram @lena_research'), '@lena_research');
    assert.equal(contactValueFor('https://t.me/lena_research'), '@lena_research');
  });
  it('Phone text → the number', () => {
    assert.equal(contactValueFor('Call me: +880 1812 000111'), '+8801812000111');
  });
  it('Email inside text → only the address', () => {
    assert.equal(contactValueFor('Email lena@uni.edu.bd anytime'), 'lena@uni.edu.bd');
  });
  it('Link → only the link', () => {
    assert.equal(contactValueFor('LinkedIn: linkedin.com/in/lena'), 'linkedin.com/in/lena');
  });
  it('Unknown text is returned trimmed; empty stays empty', () => {
    assert.equal(contactValueFor('  room 402, CSE building  '), 'room 402, CSE building');
    assert.equal(contactValueFor(null), '');
  });
});
