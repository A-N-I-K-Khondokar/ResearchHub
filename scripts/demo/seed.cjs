#!/usr/bin/env node
/**
 * scripts/demo/seed.cjs — seed fictional `demo_` researchers into cse-research-hub.
 *
 *   npm run demo:seed            # dry run: prints what would be written
 *   npm run demo:seed -- --yes   # writes (safe to re-run; only demo_ documents)
 *
 * Creates: users + public_profiles for demo researchers, research_works,
 * connections + notifications (incl. incoming requests to every real approved
 * account), and 2 sign-in accounts whose password is stored in the git-ignored
 * scripts/demo/.demo-credentials.json. Never modifies existing non-demo documents.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { commit, listDocs, upsertAuthUser } = require('./firebase-rest.cjs');
const { DEPT, RESEARCHERS, WORKS } = require('./demo-data.cjs');

const APPLY = process.argv.includes('--yes');
const CRED_FILE = path.join(__dirname, '.demo-credentials.json');
const MAX_REAL_TARGETS = 5;

const daysAgo = (d, extraMinutes = 0) => new Date(Date.now() - d * 86400000 - extraMinutes * 60000);
const connectionIdFor = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
const participant = (p) => ({ uid: p.uid, displayName: p.displayName, photoURL: p.photoURL ?? null, designation: p.designation });

function loadOrCreatePassword() {
  if (fs.existsSync(CRED_FILE)) return JSON.parse(fs.readFileSync(CRED_FILE, 'utf8')).password;
  const password = `Demo-${crypto.randomBytes(6).toString('base64url')}-9!`;
  return password;
}

function userDoc(r, adminUid) {
  const created = daysAgo(r.daysAgo);
  const approved = r.approvalStatus === 'approved';
  return {
    uid: r.uid,
    email: r.email || `${r.uid.replace('_', '.')}@researchhub.test`,
    displayName: r.displayName,
    photoURL: null,
    department: DEPT,
    program: r.program ?? null,
    batch: r.batch ?? null,
    studentId: r.studentId ?? null,
    designation: r.designation,
    bio: r.bio ?? null,
    researchInterests: r.researchInterests,
    socialLinks: r.socialLinks || {},
    approvalStatus: r.approvalStatus,
    requestedAt: created,
    approvedAt: approved ? daysAgo(Math.max(r.daysAgo - 1, 0)) : null,
    approvedBy: r.approvalStatus === 'pending' ? null : adminUid,
    rejectionReason: r.rejectionReason ?? null,
    createdAt: created,
    updatedAt: created,
  };
}

function publicProfile(u) {
  return {
    uid: u.uid, displayName: u.displayName, photoURL: u.photoURL, department: u.department,
    program: u.program, batch: u.batch, designation: u.designation, bio: u.bio,
    researchInterests: u.researchInterests, socialLinks: u.socialLinks, updatedAt: u.updatedAt,
  };
}

function connection(requester, recipient, status, ageDays) {
  const at = daysAgo(ageDays);
  return {
    id: connectionIdFor(requester.uid, recipient.uid),
    data: {
      users: [requester.uid, recipient.uid].sort(),
      requesterUid: requester.uid,
      recipientUid: recipient.uid,
      requester: participant(requester),
      recipient: participant(recipient),
      status,
      createdAt: at,
      updatedAt: at,
      respondedAt: status === 'pending' ? null : daysAgo(Math.max(ageDays - 0.5, 0)),
    },
  };
}

function notification(id, type, actor, recipientUid, connectionId, ageDays, read = false) {
  return {
    id,
    data: {
      recipientUid, actorUid: actor.uid, actorName: actor.displayName, actorPhotoURL: actor.photoURL ?? null,
      type, connectionId, read, createdAt: daysAgo(ageDays, 5),
    },
  };
}

(async () => {
  console.log(`\nCSE Research Hub demo seed — ${APPLY ? 'APPLYING' : 'DRY RUN (add -- --yes to write)'}\n`);

  const admins = await listDocs('admins');
  const adminUid = admins[0]?.id || 'demo_seed';
  const allUsers = await listDocs('users');
  const realApproved = allUsers
    .filter((u) => !u.id.startsWith('demo_') && u.data.approvalStatus === 'approved')
    .slice(0, MAX_REAL_TARGETS)
    .map((u) => ({ uid: u.id, displayName: u.data.displayName, photoURL: u.data.photoURL ?? null, designation: u.data.designation }));

  console.log(`Administrator record: ${admins.length ? 'found' : 'NOT found (approvedBy = demo_seed)'}`);
  console.log(`Real approved accounts that will receive demo requests: ${realApproved.length}`);
  realApproved.forEach((u) => console.log(`  - ${u.displayName} (${u.uid.slice(0, 6)}…)`));

  const users = RESEARCHERS.map((r) => userDoc(r, adminUid));
  const byUid = Object.fromEntries(users.map((u) => [u.uid, u]));
  const writes = [];

  users.forEach((u) => {
    writes.push({ set: `users/${u.uid}`, data: u });
    if (u.approvalStatus === 'approved') writes.push({ set: `public_profiles/${u.uid}`, data: publicProfile(u) });
  });

  WORKS.forEach(([id, authorUid, title, description, tags, stage, url, age, status]) => {
    const a = byUid[authorUid];
    const at = daysAgo(age, 30);
    writes.push({
      set: `research_works/${id}`,
      data: {
        authorUid, authorName: a.displayName, authorPhotoURL: a.photoURL, authorDepartment: a.department,
        authorDesignation: a.designation, title, description, tags, stage, externalUrl: url,
        status: status || 'published', createdAt: at, updatedAt: at,
      },
    });
  });

  const conns = [];
  const notifs = [];
  // Demo <-> demo network (log in as Tahsin/Nusrat to see these)
  conns.push(connection(byUid.demo_nusrat, byUid.demo_tahsin, 'accepted', 10));
  notifs.push(notification('demo_notif_acc_tahsin_nusrat', 'connection_accepted', byUid.demo_tahsin, 'demo_nusrat', connectionIdFor('demo_nusrat', 'demo_tahsin'), 9.5, true));
  const c1 = connection(byUid.demo_maliha, byUid.demo_tahsin, 'pending', 1);
  conns.push(c1);
  notifs.push(notification('demo_notif_req_maliha_tahsin', 'connection_request', byUid.demo_maliha, 'demo_tahsin', c1.id, 1));
  const c2 = connection(byUid.demo_farhan, byUid.demo_nusrat, 'pending', 2);
  conns.push(c2);
  notifs.push(notification('demo_notif_req_farhan_nusrat', 'connection_request', byUid.demo_farhan, 'demo_nusrat', c2.id, 2));

  // Every real approved account: 2 incoming requests + 1 accepted connection
  realApproved.forEach((real) => {
    const a = connection(byUid.demo_farhan, real, 'pending', 0.2);
    const b = connection(byUid.demo_sadia, real, 'pending', 1.5);
    const c = connection(real, byUid.demo_rakib, 'accepted', 3);
    conns.push(a, b, c);
    notifs.push(notification(`demo_notif_req_farhan_${real.uid}`, 'connection_request', byUid.demo_farhan, real.uid, a.id, 0.2));
    notifs.push(notification(`demo_notif_req_sadia_${real.uid}`, 'connection_request', byUid.demo_sadia, real.uid, b.id, 1.5));
    notifs.push(notification(`demo_notif_acc_rakib_${real.uid}`, 'connection_accepted', byUid.demo_rakib, real.uid, c.id, 2.5));
  });

  conns.forEach((c) => writes.push({ set: `connections/${c.id}`, data: c.data }));
  notifs.forEach((n) => writes.push({ set: `notifications/${n.id}`, data: n.data }));

  const loginable = RESEARCHERS.filter((r) => r.login);
  console.log(`\nWill write ${writes.length} documents:`);
  console.log(`  users: ${users.length} (approved ${users.filter((u) => u.approvalStatus === 'approved').length}, pending ${users.filter((u) => u.approvalStatus === 'pending').length}, rejected ${users.filter((u) => u.approvalStatus === 'rejected').length})`);
  console.log(`  public_profiles: ${users.filter((u) => u.approvalStatus === 'approved').length}, research_works: ${WORKS.length}, connections: ${conns.length}, notifications: ${notifs.length}`);
  console.log(`  sign-in accounts: ${loginable.map((r) => r.email).join(', ')}`);

  if (!APPLY) {
    console.log('\nDry run only — nothing was written.');
    return;
  }

  const password = loadOrCreatePassword();
  for (const r of loginable) {
    const result = await upsertAuthUser({ localId: r.uid, email: r.email, password, displayName: r.displayName });
    console.log(`  auth ${r.email}: ${result}`);
  }
  fs.writeFileSync(
    CRED_FILE,
    JSON.stringify({ note: 'Demo sign-in accounts (fictional). Removed by npm run demo:clean.', password, accounts: loginable.map((r) => r.email) }, null, 2) + '\n',
    { mode: 0o600 },
  );

  await commit(writes);
  console.log(`\n✔ Seeded ${writes.length} demo documents.`);
  console.log(`✔ Sign-in password saved to scripts/demo/.demo-credentials.json (git-ignored).`);
})().catch((err) => {
  console.error('\n✖ Seed failed:', err.message);
  process.exit(1);
});
