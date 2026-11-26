#!/usr/bin/env node
/**
 * scripts/qa/smoke-test.cjs — live PRODUCTION smoke test of the core flows.
 *
 *   npm run qa:smoke
 *
 * Signs in as the two demo accounts (requires `npm run demo:seed -- --yes`
 * first) and exercises real writes through the Firestore REST API with each
 * user's own ID token, so every request is evaluated by the deployed security
 * rules exactly as the app's requests are. Only demo-account data is touched
 * and everything created is removed at the end (the Nusrat <-> Tahsin
 * connection is returned to its seeded "accepted" state).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { encodeFields, decodeFields } = require('../demo/firebase-rest.cjs');

const ROOT = path.join(__dirname, '..', '..');
const PROJECT = 'cse-research-hub';
const DOCS = `projects/${PROJECT}/databases/(default)/documents`;
const BASE = `https://firestore.googleapis.com/v1/${DOCS}`;

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const credFile = path.join(ROOT, 'scripts', 'demo', '.demo-credentials.json');
if (!fs.existsSync(credFile)) {
  console.error('Demo accounts not found. Run: npm run demo:seed -- --yes');
  process.exit(1);
}
const { password } = JSON.parse(fs.readFileSync(credFile, 'utf8'));

let passed = 0;
let failed = 0;
function check(label, ok, detail = '') {
  if (ok) passed++; else failed++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
}

async function signIn(email) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.EXPO_PUBLIC_FIREBASE_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) },
  );
  const j = await res.json();
  if (!j.idToken) throw new Error(`Sign-in failed for ${email}: ${j.error && j.error.message}`);
  return { token: j.idToken, uid: j.localId };
}

const H = (u) => ({ Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' });
const name = (p) => `${DOCS}/${p}`;
const serverTime = (...fields) => fields.map((f) => ({ fieldPath: f, setToServerValue: 'REQUEST_TIME' }));

async function get(u, p) {
  const r = await fetch(`${BASE}/${p}`, { headers: H(u) });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, data: j.fields ? decodeFields(j.fields) : null };
}
async function commitAs(u, writes) {
  const r = await fetch(`${BASE}:commit`, { method: 'POST', headers: H(u), body: JSON.stringify({ writes }) });
  return r.status;
}
/** runQuery; `parent` targets a subcollection, e.g. 'users/<uid>' for users/<uid>/saved_items. */
async function query(u, structuredQuery, parent = '') {
  const url = parent ? `${BASE}/${parent}:runQuery` : `${BASE}:runQuery`;
  const r = await fetch(url, { method: 'POST', headers: H(u), body: JSON.stringify({ structuredQuery }) });
  const j = await r.json();
  return { status: r.status, docs: Array.isArray(j) ? j.filter((x) => x.document).map((x) => ({ id: x.document.name.split('/').pop(), data: decodeFields(x.document.fields) })) : [] };
}
const eq = (field, value) => ({ fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: value } } });
const participant = (p) => ({ uid: p.uid, displayName: p.displayName, photoURL: p.photoURL ?? null, designation: p.designation });

(async () => {
  console.log('\nCSE Research Hub — production smoke test (demo accounts)\n');
  const tahsin = await signIn('demo.tahsin@researchhub.test');
  const nusrat = await signIn('demo.nusrat@researchhub.test');
  check('Sign in (email/password, verified)', true, 'demo.tahsin + demo.nusrat');

  const tProfile = (await get(tahsin, `users/${tahsin.uid}`)).data;
  const nProfile = (await get(nusrat, `users/${nusrat.uid}`)).data;
  check('Read own private profile', Boolean(tProfile && nProfile));
  check('Account is approved', tProfile?.approvalStatus === 'approved' && nProfile?.approvalStatus === 'approved');

  // ---- Privacy & escalation (must be denied) -------------------------------
  check('Privacy: cannot read another user\'s private profile', (await get(nusrat, `users/${tahsin.uid}`)).status === 403);
  check('Escalation: cannot create own admin record',
    (await commitAs(nusrat, [{ update: { name: name(`admins/${nusrat.uid}`), fields: encodeFields({ uid: nusrat.uid, email: 'x@researchhub.test', role: 'admin' }) } }])) === 403);

  // ---- Directory -------------------------------------------------------------
  const dir = await query(nusrat, { from: [{ collectionId: 'public_profiles' }], limit: 100 });
  check('Directory: list public profiles', dir.status === 200 && dir.docs.length > 0, `${dir.docs.length} researchers`);
  check('Directory: no email / studentId exposed', dir.docs.every((d) => !('email' in d.data) && !('studentId' in d.data)));

  // ---- Publish research work -------------------------------------------------
  const workId = `demo_qa_${crypto.randomBytes(4).toString('hex')}`;
  const work = {
    authorUid: tahsin.uid, authorName: tProfile.displayName, authorPhotoURL: tProfile.photoURL ?? null,
    authorDepartment: tProfile.department, authorDesignation: tProfile.designation,
    title: 'QA smoke test work', description: 'Automated production smoke test entry — removed at the end of the run.',
    tags: ['#MachineLearning'], stage: 'Experiment', externalUrl: null, status: 'published',
  };
  const pub = await commitAs(tahsin, [{
    update: { name: name(`research_works/${workId}`), fields: encodeFields(work) },
    updateTransforms: serverTime('createdAt', 'updatedAt'),
    currentDocument: { exists: false },
  }]);
  check('Share Current Work: publish', pub === 200);
  const forged = await commitAs(nusrat, [{
    update: { name: name(`research_works/demo_qa_forged`), fields: encodeFields({ ...work, authorUid: nusrat.uid }) },
    updateTransforms: serverTime('createdAt', 'updatedAt'),
    currentDocument: { exists: false },
  }]);
  check('Share: forged author snapshot is denied', forged === 403);

  const feed = await query(nusrat, {
    from: [{ collectionId: 'research_works' }], where: eq('status', 'published'),
    orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }], limit: 20,
  });
  check('Home feed shows the new work to another researcher', feed.docs.some((d) => d.id === workId), `${feed.docs.length} in feed`);
  const tamper = await commitAs(nusrat, [{
    update: { name: name(`research_works/${workId}`), fields: encodeFields({ title: 'Hijacked' }) },
    updateMask: { fieldPaths: ['title'] }, currentDocument: { exists: true },
  }]);
  check('Non-author cannot edit the work', tamper === 403);

  // ---- Saved items -----------------------------------------------------------
  const saved = await commitAs(nusrat, [{
    update: { name: name(`users/${nusrat.uid}/saved_items/${workId}`), fields: encodeFields({
      workId, workTitle: work.title, workAuthorUid: tahsin.uid, workAuthorName: work.authorName, workStage: work.stage,
    }) },
    updateTransforms: serverTime('savedAt'),
  }]);
  check('Saved Items: bookmark', saved === 200);
  const savedList = await query(nusrat, { from: [{ collectionId: 'saved_items' }] }, `users/${nusrat.uid}`);
  check('Saved Items: listed for owner', savedList.docs.some((d) => d.id === workId));
  check('Saved Items: private to owner', (await get(tahsin, `users/${nusrat.uid}/saved_items/${workId}`)).status === 403);

  // ---- Connection request -> notification -> accept -> notification ----------
  const connId = [nusrat.uid, tahsin.uid].sort().join('_');
  await commitAs(nusrat, [{ delete: name(`connections/${connId}`) }]); // start from "not connected"
  const reqNotifId = `demo_qa_${crypto.randomBytes(4).toString('hex')}`;
  const request = await commitAs(nusrat, [
    {
      update: { name: name(`connections/${connId}`), fields: encodeFields({
        users: [nusrat.uid, tahsin.uid].sort(), requesterUid: nusrat.uid, recipientUid: tahsin.uid,
        requester: participant(nProfile), recipient: participant(tProfile), status: 'pending', respondedAt: null,
      }) },
      updateTransforms: serverTime('createdAt', 'updatedAt'),
      currentDocument: { exists: false },
    },
    {
      update: { name: name(`notifications/${reqNotifId}`), fields: encodeFields({
        recipientUid: tahsin.uid, actorUid: nusrat.uid, actorName: nProfile.displayName,
        actorPhotoURL: nProfile.photoURL ?? null, type: 'connection_request', connectionId: connId, read: false,
      }) },
      updateTransforms: serverTime('createdAt'),
    },
  ]);
  check('Connect: send request + notification (atomic)', request === 200);
  const dup = await commitAs(tahsin, [{
    update: { name: name(`connections/${connId}`), fields: encodeFields({ status: 'pending' }) },
    updateMask: { fieldPaths: ['status'] }, currentDocument: { exists: true },
  }]);
  check('Connect: duplicate / reverse request is denied', dup === 403);

  const tNotifs = await query(tahsin, {
    from: [{ collectionId: 'notifications' }], where: eq('recipientUid', tahsin.uid),
    orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }], limit: 50,
  });
  check('Notifications: recipient receives the request', tNotifs.docs.some((d) => d.id === reqNotifId));

  const accNotifId = `demo_qa_${crypto.randomBytes(4).toString('hex')}`;
  const accept = await commitAs(tahsin, [
    {
      update: { name: name(`connections/${connId}`), fields: encodeFields({ status: 'accepted' }) },
      updateMask: { fieldPaths: ['status'] },
      updateTransforms: serverTime('respondedAt', 'updatedAt'),
      currentDocument: { exists: true },
    },
    {
      update: { name: name(`notifications/${accNotifId}`), fields: encodeFields({
        recipientUid: nusrat.uid, actorUid: tahsin.uid, actorName: tProfile.displayName,
        actorPhotoURL: tProfile.photoURL ?? null, type: 'connection_accepted', connectionId: connId, read: false,
      }) },
      updateTransforms: serverTime('createdAt'),
    },
  ]);
  check('Connect: accept + acceptance notification (atomic)', accept === 200);
  const nNotifs = await query(nusrat, {
    from: [{ collectionId: 'notifications' }], where: eq('recipientUid', nusrat.uid),
    orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }], limit: 50,
  });
  check('Notifications: requester sees "accepted"', nNotifs.docs.some((d) => d.id === accNotifId));
  const conn = await get(nusrat, `connections/${connId}`);
  check('Connection status is accepted for both', conn.data?.status === 'accepted');

  // ---- Clean up -------------------------------------------------------------
  const cleanup = [
    await commitAs(nusrat, [{ delete: name(`users/${nusrat.uid}/saved_items/${workId}`) }]),
    await commitAs(tahsin, [{ delete: name(`research_works/${workId}`) }]),
    await commitAs(tahsin, [{ delete: name(`notifications/${reqNotifId}`) }]),
    await commitAs(nusrat, [{ delete: name(`notifications/${accNotifId}`) }]),
  ];
  check('Clean up (author delete, owner unsave, recipients delete notifications)', cleanup.every((s) => s === 200));

  console.log(`\n${failed === 0 ? '✔' : '✖'} ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((err) => {
  console.error('\n✖ Smoke test error:', err.message);
  process.exit(1);
});
