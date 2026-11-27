/**
 * src/utils/contact.ts
 *
 * Turns a free-text "preferred contact" (e.g. "WhatsApp +8801712345678",
 * "Telegram @nusrat", "linkedin.com/in/tahsin", "+880 1712-345678") into a
 * tappable action. Pure — no React Native imports — so it is easy to test.
 */

export type ContactActionKind = 'whatsapp' | 'telegram' | 'email' | 'phone' | 'link';

export interface ContactAction {
  kind: ContactActionKind;
  /** Button label, e.g. "Open WhatsApp". */
  label: string;
  url: string;
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const URL_RE = /\b((?:https?:\/\/|www\.)[^\s]+|(?:[a-z0-9-]+\.)+(?:com|org|net|io|me|edu|bd|dev|ac\.bd)(?:\/[^\s]*)?)/i;
const PHONE_RE = /(\+?\d[\d\s().-]{6,}\d)/;

const digitsOf = (s: string) => s.replace(/\D/g, '');

function phoneDigits(text: string): string | null {
  const match = text.match(PHONE_RE);
  if (!match) return null;
  const digits = digitsOf(match[1]);
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function contactActionFor(raw: string | null | undefined): ContactAction | null {
  const text = (raw ?? '').trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  // WhatsApp: wa.me link, or the word "WhatsApp" with a number
  const waLink = text.match(/(?:https?:\/\/)?wa\.me\/(\d{8,15})/i);
  if (waLink) return { kind: 'whatsapp', label: 'Open WhatsApp', url: `https://wa.me/${waLink[1]}` };
  if (/whats\s?app|\bwa\b/.test(lower)) {
    const digits = phoneDigits(text);
    if (digits) return { kind: 'whatsapp', label: 'Open WhatsApp', url: `https://wa.me/${digits}` };
  }

  // Telegram: t.me link, or the word "Telegram" with a @handle / handle
  const tgLink = text.match(/(?:https?:\/\/)?(?:t|telegram)\.me\/([A-Za-z0-9_]{4,32})/i);
  if (tgLink) return { kind: 'telegram', label: 'Open Telegram', url: `https://t.me/${tgLink[1]}` };
  if (/telegram|\btg\b/.test(lower)) {
    const handle = text.match(/@([A-Za-z0-9_]{4,32})/) ?? text.match(/(?:telegram|tg)\s*[:\-]?\s*([A-Za-z][A-Za-z0-9_]{3,31})\b/i);
    if (handle) return { kind: 'telegram', label: 'Open Telegram', url: `https://t.me/${handle[1]}` };
  }

  const email = text.match(EMAIL_RE);
  if (email) return { kind: 'email', label: 'Send email', url: `mailto:${email[0]}` };

  const link = text.match(URL_RE);
  if (link) {
    const url = /^https?:\/\//i.test(link[1]) ? link[1] : `https://${link[1]}`;
    return { kind: 'link', label: 'Open link', url };
  }

  const digits = phoneDigits(text);
  if (digits) {
    const plus = /\+\s*\d/.test(text) ? '+' : '';
    return { kind: 'phone', label: 'Call', url: `tel:${plus}${digits}` };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Guided editor helpers: method + value  <->  stored `preferredContact` text
// ---------------------------------------------------------------------------

export type ContactMethod = 'whatsapp' | 'telegram' | 'phone' | 'linkedin' | 'other';

export const CONTACT_METHODS: { id: ContactMethod; label: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'phone', label: 'Phone' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'other', label: 'Other' },
];

/** Bangladesh local numbers (01XXXXXXXXX) become +8801XXXXXXXXX. */
export function normalizePhone(value: string): string {
  let digits = digitsOf(value);
  if (/^01\d{9}$/.test(digits)) digits = `880${digits.slice(1)}`;
  return digits;
}

const cleanHandle = (v: string) => v.trim().replace(/^@+/, '').replace(/^(?:https?:\/\/)?(?:t|telegram)\.me\//i, '');
const cleanLinkedIn = (v: string) =>
  v.trim().replace(/^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\//i, '').replace(/\/+$/, '');

/** Returns a user-facing error, or null when the value is fine (empty = fine). */
export function validateContact(method: ContactMethod, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  switch (method) {
    case 'whatsapp':
    case 'phone': {
      const d = normalizePhone(v);
      return d.length >= 8 && d.length <= 15 ? null : 'Enter a valid number, e.g. 01712345678 or +8801712345678';
    }
    case 'telegram':
      return /^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(cleanHandle(v)) ? null : 'Usernames are 4–32 letters, numbers or _';
    case 'linkedin':
      return /^[A-Za-z0-9-_%]{3,100}$/.test(cleanLinkedIn(v)) ? null : 'Enter your LinkedIn username, e.g. tahsin-rahman';
    default:
      return v.length <= 180 ? null : 'Keep it under 180 characters';
  }
}

/** Build the text saved in the contact card (null when empty). */
export function composeContact(method: ContactMethod, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  switch (method) {
    case 'whatsapp':
      return `WhatsApp +${normalizePhone(v)}`;
    case 'phone':
      return `Phone +${normalizePhone(v)}`;
    case 'telegram':
      return `Telegram @${cleanHandle(v)}`;
    case 'linkedin':
      return `linkedin.com/in/${cleanLinkedIn(v)}`;
    default:
      return v;
  }
}

/** Best-effort reverse of composeContact, so existing cards open pre-filled. */
export function parseContact(text: string | null | undefined): { method: ContactMethod; value: string } {
  const t = (text ?? '').trim();
  if (!t) return { method: 'whatsapp', value: '' };
  const action = contactActionFor(t);
  if (action?.kind === 'whatsapp') return { method: 'whatsapp', value: `+${action.url.split('/').pop()}` };
  if (action?.kind === 'telegram') return { method: 'telegram', value: action.url.split('/').pop() ?? '' };
  if (action?.kind === 'phone') return { method: 'phone', value: action.url.replace('tel:', '') };
  const li = t.match(/linkedin\.com\/in\/([^\s/]+)/i);
  if (li) return { method: 'linkedin', value: li[1] };
  return { method: 'other', value: t };
}

/**
 * The bare value to copy / show for a contact string: "+8801712345678",
 * "@handle", "name@uni.edu" or the URL — never the surrounding words
 * ("WhatsApp +880 1712-345678" → "+8801712345678").
 */
export function contactValueFor(raw: string | null | undefined): string {
  const text = (raw ?? '').trim();
  if (!text) return '';
  const action = contactActionFor(text);
  if (action?.kind === 'whatsapp') return `+${action.url.split('/').pop()}`;
  if (action?.kind === 'phone') return action.url.replace(/^tel:/, '');
  if (action?.kind === 'telegram') return `@${action.url.split('/').pop()}`;
  if (action?.kind === 'email') return action.url.replace(/^mailto:/, '');
  if (action?.kind === 'link') {
    const link = text.match(URL_RE);
    return link ? link[1] : text;
  }
  return text;
}

