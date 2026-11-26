#!/usr/bin/env node
/**
 * scripts/demo/clean.cjs — remove ALL demo data from cse-research-hub.
 *
 *   npm run demo:clean            # dry run: shows what would be deleted
 *   npm run demo:clean -- --yes   # deletes
 *
 * Removes every document whose ID starts with `demo_`, plus anything that
 * involves a demo researcher (connections, notifications, research works and
 * saved items created while testing), and the demo sign-in accounts.
 * Real (non-demo) users, profiles and research are never deleted.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { commit, listDocs, deleteAuthUser } = require('./firebase-rest.cjs');
const { RESEARCHERS } = require('./demo-data.cjs');

const APPLY = process.argv.includes('--yes');
const isDemo = (v) => typeof v === 'string' && v.startsWith('demo_');

(async () => {
  console.log(`\nCSE Research Hub demo cleanup — ${APPLY ? 'DELETING' : 'DRY RUN (add -- --yes to delete)'}\n`);

  const [users, publicProfiles, works, connections, notifications, outbox, collabRequests, contactCards] = await Promise.all([
    listDocs('users'),
    listDocs('public_profiles'),
    listDocs('research_works'),
    listDocs('connections'),
    listDocs('notifications'),
    listDocs('admin_email_outbox'),
    listDocs('collab_requests'),
    listDocs('contact_cards'),
  ]);

  const demoWorkIds = new Set(works.filter((w) => isDemo(w.id) || isDemo(w.data.authorUid)).map((w) => w.id));
  const deletes = [];

  // Saved items: inside demo users (all) and inside real users (only those pointing at demo work)
  for (const u of users) {
    const saved = await listDocs(`users/${u.id}/saved_items`);
    for (const s of saved) {
      if (isDemo(u.id) || demoWorkIds.has(s.id) || isDemo(s.data.workAuthorUid)) {
        deletes.push(`users/${u.id}/saved_items/${s.id}`);
      }
    }
  }
  users.filter((u) => isDemo(u.id)).forEach((u) => deletes.push(`users/${u.id}`));
  publicProfiles.filter((p) => isDemo(p.id)).forEach((p) => deletes.push(`public_profiles/${p.id}`));
  outbox.filter((o) => isDemo(o.id)).forEach((o) => deletes.push(`admin_email_outbox/${o.id}`));
  demoWorkIds.forEach((id) => deletes.push(`research_works/${id}`));
  connections
    .filter((c) => c.id.includes('demo_') || (c.data.users || []).some(isDemo))
    .forEach((c) => deletes.push(`connections/${c.id}`));
  notifications
    .filter((n) => isDemo(n.id) || isDemo(n.data.actorUid) || isDemo(n.data.recipientUid))
    .forEach((n) => deletes.push(`notifications/${n.id}`));
  collabRequests
    .filter((r) => isDemo(r.data.applicantUid) || isDemo(r.data.authorUid) || demoWorkIds.has(r.data.workId))
    .forEach((r) => deletes.push(`collab_requests/${r.id}`));
  contactCards.filter((c) => isDemo(c.id)).forEach((c) => deletes.push(`contact_cards/${c.id}`));

  const count = (prefix) => deletes.filter((d) => d.startsWith(prefix)).length;
  console.log(`Documents to delete: ${deletes.length}`);
  ['users/', 'public_profiles/', 'research_works/', 'connections/', 'notifications/', 'admin_email_outbox/', 'collab_requests/', 'contact_cards/'].forEach((p) =>
    console.log(`  ${p.replace('/', '')}: ${p === 'users/' ? deletes.filter((d) => /^users\/[^/]+$/.test(d)).length : count(p)}`),
  );
  console.log(`  saved_items: ${deletes.filter((d) => d.includes('/saved_items/')).length}`);
  const loginable = RESEARCHERS.filter((r) => r.login);
  console.log(`Sign-in accounts to delete: ${loginable.map((r) => r.email).join(', ')}`);

  if (!APPLY) {
    console.log('\nDry run only — nothing was deleted.');
    return;
  }

  await commit(deletes.map((d) => ({ delete: d })));
  for (const r of loginable) {
    const removed = await deleteAuthUser(r.uid);
    console.log(`  auth ${r.email}: ${removed ? 'deleted' : 'not found'}`);
  }
  const credFile = path.join(__dirname, '.demo-credentials.json');
  if (fs.existsSync(credFile)) fs.unlinkSync(credFile);
  console.log(`\n✔ Removed ${deletes.length} demo documents and the demo sign-in accounts.`);
})().catch((err) => {
  console.error('\n✖ Cleanup failed:', err.message);
  process.exit(1);
});
