/**
 * tests/firestore/firestore.rules.test.mjs
 *
 * Automated behavioral security test suite for Cloud Firestore Security Rules.
 * Targets the local emulator running project "demo-cse-research-hub".
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ID = 'demo-cse-research-hub';
const RULES_PATH = resolve(__dirname, '../../firestore.rules');
const rules = readFileSync(RULES_PATH, 'utf8');

let testEnv;

// Test user UIDs
const ALICE_UID = 'user_alice_verified';
const ALICE_EMAIL = 'alice@gmail.com';

const BOB_UID = 'user_bob_unverified';
const BOB_EMAIL = 'bob@gmail.com';

const CHARLIE_UID = 'user_charlie_approved';
const CHARLIE_EMAIL = 'charlie@cse.university.edu';

const DAVID_UID = 'user_david_suspended';
const DAVID_EMAIL = 'david@gmail.com';

const EVE_UID = 'user_eve_rejected';
const EVE_EMAIL = 'eve@gmail.com';

const ADMIN_UID = 'admin_super_user';
const ADMIN_EMAIL = 'admin@cse.university.edu';

const BOT_UID = 'bot_notification_service';
const BOT_EMAIL = 'outbox-bot@cse.university.edu';

function getValidProfile(uid, email, overrides = {}) {
  return {
    uid,
    email,
    displayName: 'Scholar Name',
    photoURL: 'https://example.com/avatar.jpg',
    department: 'Computer Science and Engineering',
    program: 'B.Sc. in CSE',
    batch: 'Batch 14',
    studentId: '190104001',
    designation: 'Undergraduate Researcher',
    bio: 'Focusing on distributed systems and NLP.',
    researchInterests: ['Machine Learning', 'Systems'],
    socialLinks: { github: 'https://github.com/scholar' },
    approvalStatus: 'pending',
    requestedAt: serverTimestamp(),
    approvedAt: null,
    approvedBy: null,
    rejectionReason: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function getValidAdminRequest(requestId, uid, email, overrides = {}) {
  return {
    requestId,
    uid,
    userEmail: email,
    userName: 'Scholar Name',
    department: 'Computer Science and Engineering',
    batch: 'Batch 14',
    status: 'pending',
    submittedAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    reviewNotes: null,
    ...overrides,
  };
}

function getValidOutbox(uid, email, overrides = {}) {
  return {
    uid,
    userEmail: email,
    displayName: 'Scholar Name',
    department: 'Computer Science and Engineering',
    designation: 'Undergraduate Researcher',
    program: 'B.Sc. in CSE',
    batch: 'Batch 14',
    researchInterests: ['Machine Learning', 'Systems'],
    deliveryStatus: 'queued',
    createdAt: serverTimestamp(),
    sentAt: null,
    attemptCount: 0,
    lastAttemptAt: null,
    lastError: null,
    ...overrides,
  };
}

describe('Firestore Security Rules Suite — CSE Research Hub', () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules,
      },
    });
  });

  after(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();

    // Seed administrative credentials and benchmark profiles using security rules bypass
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      // 1. Seed administrator record in /admins
      await setDoc(doc(db, 'admins', ADMIN_UID), {
        uid: ADMIN_UID,
        email: ADMIN_EMAIL,
        role: 'superadmin',
        addedAt: Timestamp.now(),
        addedBy: 'bootstrap-console',
      });

      // 2. Seed pre-existing approved profile for Charlie
      await setDoc(doc(db, 'users', CHARLIE_UID), {
        uid: CHARLIE_UID,
        email: CHARLIE_EMAIL,
        displayName: 'Charlie Approved',
        photoURL: null,
        department: 'Computer Science and Engineering',
        program: 'M.Sc. in CSE',
        batch: 'Batch 12',
        studentId: '170104002',
        designation: 'Graduate Researcher',
        bio: 'Approved scholar profile.',
        researchInterests: ['Networks', 'Security'],
        socialLinks: {},
        approvalStatus: 'approved',
        requestedAt: Timestamp.now(),
        approvedAt: Timestamp.now(),
        approvedBy: ADMIN_UID,
        rejectionReason: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 3. Seed suspended profile for David
      await setDoc(doc(db, 'users', DAVID_UID), {
        uid: DAVID_UID,
        email: DAVID_EMAIL,
        displayName: 'David Suspended',
        photoURL: null,
        department: 'Computer Science and Engineering',
        program: null,
        batch: 'Batch 13',
        studentId: null,
        designation: 'Former Researcher',
        bio: 'Suspended profile.',
        researchInterests: ['Robotics'],
        socialLinks: {},
        approvalStatus: 'suspended',
        requestedAt: Timestamp.now(),
        approvedAt: null,
        approvedBy: ADMIN_UID,
        rejectionReason: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 4. Seed rejected profile for Eve
      await setDoc(doc(db, 'users', EVE_UID), {
        uid: EVE_UID,
        email: EVE_EMAIL,
        displayName: 'Eve Rejected',
        photoURL: null,
        department: 'Computer Science and Engineering',
        program: null,
        batch: 'Batch 15',
        studentId: null,
        designation: 'Applicant',
        bio: 'Rejected applicant.',
        researchInterests: ['AI'],
        socialLinks: {},
        approvalStatus: 'rejected',
        requestedAt: Timestamp.now(),
        approvedAt: null,
        approvedBy: ADMIN_UID,
        rejectionReason: 'Invalid department enrollment.',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 5. Seed notification service account in /notification_services
      await setDoc(doc(db, 'notification_services', BOT_UID), {
        uid: BOT_UID,
        email: BOT_EMAIL,
        serviceName: 'Gmail Notification Dispatcher',
        registeredAt: Timestamp.now(),
      });
    });
  });

  // -------------------------------------------------------------------------
  // 1. Authentication and Profile Creation (TEST-01 to TEST-07)
  // -------------------------------------------------------------------------
  describe('1. Authentication and Profile Creation', () => {
    it('TEST-01: Unauthenticated profile creation → DENY', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      const userRef = doc(db, 'users', ALICE_UID);
      await assertFails(setDoc(userRef, getValidProfile(ALICE_UID, ALICE_EMAIL)));
    });

    it('TEST-02: Email-unverified user profile creation → DENY', async () => {
      const db = testEnv.authenticatedContext(BOB_UID, { email: BOB_EMAIL, email_verified: false }).firestore();
      const userRef = doc(db, 'users', BOB_UID);
      await assertFails(setDoc(userRef, getValidProfile(BOB_UID, BOB_EMAIL)));
    });

    it('TEST-03: Verified user creates their own pending profile with matching outbox in atomic batch → ALLOW', async () => {
      const db = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', ALICE_UID), getValidProfile(ALICE_UID, ALICE_EMAIL));
      batch.set(doc(db, 'admin_email_outbox', ALICE_UID), getValidOutbox(ALICE_UID, ALICE_EMAIL));
      await assertSucceeds(batch.commit());
    });

    it('TEST-04: User creates a profile for another UID → DENY', async () => {
      const db = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const userRef = doc(db, 'users', 'another_victim_uid');
      await assertFails(setDoc(userRef, getValidProfile('another_victim_uid', 'victim@gmail.com')));
    });

    it('TEST-05: User creates a profile with approvalStatus: approved → DENY', async () => {
      const db = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const userRef = doc(db, 'users', ALICE_UID);
      await assertFails(setDoc(userRef, getValidProfile(ALICE_UID, ALICE_EMAIL, { approvalStatus: 'approved' })));
    });

    it('TEST-06: User creates a profile with unexpected fields → DENY', async () => {
      const db = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const userRef = doc(db, 'users', ALICE_UID);
      await assertFails(setDoc(userRef, getValidProfile(ALICE_UID, ALICE_EMAIL, { hackerField: 'injected_data' })));
    });

    it('TEST-07: User attempts to overwrite an existing profile → DENY', async () => {
      // First creation succeeds via mandatory atomic batch
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const batch = writeBatch(aliceDb);
      batch.set(doc(aliceDb, 'users', ALICE_UID), getValidProfile(ALICE_UID, ALICE_EMAIL));
      batch.set(doc(aliceDb, 'admin_email_outbox', ALICE_UID), getValidOutbox(ALICE_UID, ALICE_EMAIL));
      await assertSucceeds(batch.commit());

      // Second attempt to create/overwrite identical document must fail
      const userRef = doc(aliceDb, 'users', ALICE_UID);
      await assertFails(setDoc(userRef, getValidProfile(ALICE_UID, ALICE_EMAIL)));
    });
  });

  // -------------------------------------------------------------------------
  // 2. Profile Updates (TEST-08 to TEST-13)
  // -------------------------------------------------------------------------
  describe('2. Profile Updates', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'users', ALICE_UID), {
          ...getValidProfile(ALICE_UID, ALICE_EMAIL),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          requestedAt: Timestamp.now(),
        });
      });
    });

    it('TEST-08: User updates permitted academic profile fields → ALLOW', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const userRef = doc(aliceDb, 'users', ALICE_UID);
      await assertSucceeds(
        updateDoc(userRef, {
          bio: 'Updated bio highlighting new publications.',
          displayName: 'Alice K. Scholar',
          researchInterests: ['AI', 'Computer Vision'],
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-09: User adds an unexpected field on update → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const userRef = doc(aliceDb, 'users', ALICE_UID);
      await assertFails(
        updateDoc(userRef, {
          unexpectedKey: 'malicious payload',
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-10: User changes UID or email on update → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const userRef = doc(aliceDb, 'users', ALICE_UID);
      await assertFails(
        updateDoc(userRef, {
          email: 'newemail@gmail.com',
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-11: User changes approvalStatus → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const userRef = doc(aliceDb, 'users', ALICE_UID);
      await assertFails(
        updateDoc(userRef, {
          approvalStatus: 'approved',
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-12: User changes approvedAt or approvedBy → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const userRef = doc(aliceDb, 'users', ALICE_UID);
      await assertFails(
        updateDoc(userRef, {
          approvedBy: ALICE_UID,
          approvedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-13: User adds an administrator role → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const userRef = doc(aliceDb, 'users', ALICE_UID);
      await assertFails(
        updateDoc(userRef, {
          role: 'admin',
          updatedAt: serverTimestamp(),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // 3. Profile Reads (TEST-14 to TEST-17)
  // -------------------------------------------------------------------------
  describe('3. Profile Reads', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'users', ALICE_UID), {
          ...getValidProfile(ALICE_UID, ALICE_EMAIL),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          requestedAt: Timestamp.now(),
        });
      });
    });

    it('TEST-14: User reads their own pending profile → ALLOW', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const userRef = doc(aliceDb, 'users', ALICE_UID);
      await assertSucceeds(getDoc(userRef));
    });

    it('TEST-15: Pending user reads another pending profile → DENY', async () => {
      // Bob is an unapproved/pending user; attempts to read Alice's pending profile
      const bobDb = testEnv.authenticatedContext(BOB_UID, { email: BOB_EMAIL, email_verified: true }).firestore();
      const userRef = doc(bobDb, 'users', ALICE_UID);
      await assertFails(getDoc(userRef));
    });

    it('TEST-16: Approved user reads another approved profile → ALLOW', async () => {
      // Charlie is an approved researcher; reads their own or another approved profile
      const charlieDb = testEnv.authenticatedContext(CHARLIE_UID, { email: CHARLIE_EMAIL, email_verified: true }).firestore();
      const userRef = doc(charlieDb, 'users', CHARLIE_UID);
      await assertSucceeds(getDoc(userRef));
    });

    it('TEST-17: Approved user reads a suspended or rejected profile → DENY', async () => {
      const charlieDb = testEnv.authenticatedContext(CHARLIE_UID, { email: CHARLIE_EMAIL, email_verified: true }).firestore();
      // Charlie tries to read David (suspended) and Eve (rejected)
      await assertFails(getDoc(doc(charlieDb, 'users', DAVID_UID)));
      await assertFails(getDoc(doc(charlieDb, 'users', EVE_UID)));
    });
  });

  // -------------------------------------------------------------------------
  // 4. Administrator Authorization (TEST-18 to TEST-22)
  // -------------------------------------------------------------------------
  describe('4. Administrator Authorization', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'users', ALICE_UID), {
          ...getValidProfile(ALICE_UID, ALICE_EMAIL),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          requestedAt: Timestamp.now(),
        });
      });
    });

    it('TEST-18: Non-admin reads administrator records → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      await assertFails(getDoc(doc(aliceDb, 'admins', ADMIN_UID)));
    });

    it('TEST-19: Non-admin performs profile approval → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const targetRef = doc(aliceDb, 'users', CHARLIE_UID);
      await assertFails(
        updateDoc(targetRef, {
          approvalStatus: 'approved',
          approvedBy: ALICE_UID,
          approvedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-20: Existing administrator approves a pending user → ALLOW', async () => {
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const userRef = doc(adminDb, 'users', ALICE_UID);
      await assertSucceeds(
        updateDoc(userRef, {
          approvalStatus: 'approved',
          approvedBy: ADMIN_UID,
          approvedAt: serverTimestamp(),
          rejectionReason: null,
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-21: Administrator modifies academic profile fields through approval operation → DENY', async () => {
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const userRef = doc(adminDb, 'users', ALICE_UID);
      // Attempting to modify bio or name during approval must fail due to affectedKeys allowlist
      await assertFails(
        updateDoc(userRef, {
          approvalStatus: 'approved',
          approvedBy: ADMIN_UID,
          approvedAt: serverTimestamp(),
          rejectionReason: null,
          displayName: 'Admin Overwrote Name',
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-22: Unauthenticated user accesses administrator records → DENY', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(unauthDb, 'admins', ADMIN_UID)));
    });
  });

  // -------------------------------------------------------------------------
  // 5. Admin Requests (TEST-23 to TEST-28)
  // -------------------------------------------------------------------------
  describe('5. Admin Requests', () => {
    const REQ_ID = 'req_alice_001';

    it('TEST-23: Verified user submits their own request → ALLOW', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const reqRef = doc(aliceDb, 'admin_requests', REQ_ID);
      await assertSucceeds(setDoc(reqRef, getValidAdminRequest(REQ_ID, ALICE_UID, ALICE_EMAIL)));
    });

    it('TEST-24: User submits a request for another UID → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const reqRef = doc(aliceDb, 'admin_requests', 'req_impersonated');
      await assertFails(setDoc(reqRef, getValidAdminRequest('req_impersonated', BOB_UID, BOB_EMAIL)));
    });

    it('TEST-25: User overwrites an existing request → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const reqRef = doc(aliceDb, 'admin_requests', REQ_ID);
      await assertSucceeds(setDoc(reqRef, getValidAdminRequest(REQ_ID, ALICE_UID, ALICE_EMAIL)));

      // Overwrite attempt
      await assertFails(setDoc(reqRef, getValidAdminRequest(REQ_ID, ALICE_UID, ALICE_EMAIL)));
    });

    it('TEST-26: Applicant modifies a submitted request → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const reqRef = doc(aliceDb, 'admin_requests', REQ_ID);
      await setDoc(reqRef, getValidAdminRequest(REQ_ID, ALICE_UID, ALICE_EMAIL));

      await assertFails(
        updateDoc(reqRef, {
          department: 'Modified Department',
        })
      );
    });

    it('TEST-27: Another user reads the applicant request → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const reqRef = doc(aliceDb, 'admin_requests', REQ_ID);
      await setDoc(reqRef, getValidAdminRequest(REQ_ID, ALICE_UID, ALICE_EMAIL));

      const bobDb = testEnv.authenticatedContext(BOB_UID, { email: BOB_EMAIL, email_verified: true }).firestore();
      await assertFails(getDoc(doc(bobDb, 'admin_requests', REQ_ID)));
    });

    it('TEST-28: Administrator reviews a pending request → ALLOW', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const reqRef = doc(aliceDb, 'admin_requests', REQ_ID);
      await setDoc(reqRef, getValidAdminRequest(REQ_ID, ALICE_UID, ALICE_EMAIL));

      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      await assertSucceeds(
        updateDoc(doc(adminDb, 'admin_requests', REQ_ID), {
          status: 'approved',
          reviewedAt: serverTimestamp(),
          reviewedBy: ADMIN_UID,
          reviewNotes: 'Verified enrollment credentials.',
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // 6. General Security & Additional Transitions (TEST-29 to TEST-35)
  // -------------------------------------------------------------------------
  describe('6. General Security & Additional Lifecycle Transitions', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'users', ALICE_UID), {
          ...getValidProfile(ALICE_UID, ALICE_EMAIL),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          requestedAt: Timestamp.now(),
        });
      });
    });

    it('TEST-29: Unspecified collection read → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      await assertFails(getDoc(doc(aliceDb, 'system_secrets', 'secret_key')));
    });

    it('TEST-30: Unspecified collection write → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      await assertFails(setDoc(doc(aliceDb, 'system_secrets', 'secret_key'), { leak: true }));
    });

    it('TEST-31: Attempted access through overlapping match paths must not bypass restrictions → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      await assertFails(getDoc(doc(aliceDb, 'users', ALICE_UID, 'subcollection', 'item')));
    });

    it('TEST-32: Administrator rejects a pending user with review notes → ALLOW', async () => {
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const userRef = doc(adminDb, 'users', ALICE_UID);
      await assertSucceeds(
        updateDoc(userRef, {
          approvalStatus: 'rejected',
          approvedBy: ADMIN_UID,
          approvedAt: null,
          rejectionReason: 'Academic proof document missing.',
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-33: Administrator suspends an approved user → ALLOW', async () => {
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const userRef = doc(adminDb, 'users', CHARLIE_UID);
      await assertSucceeds(
        updateDoc(userRef, {
          approvalStatus: 'suspended',
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-34: Administrator re-approves a suspended user → ALLOW', async () => {
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const userRef = doc(adminDb, 'users', DAVID_UID);
      await assertSucceeds(
        updateDoc(userRef, {
          approvalStatus: 'approved',
          approvedBy: ADMIN_UID,
          approvedAt: serverTimestamp(),
          rejectionReason: null,
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-35: Administrator attempts approval with forged approvedBy UID → DENY', async () => {
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const userRef = doc(adminDb, 'users', ALICE_UID);
      // Attempting to set approvedBy to someone else
      await assertFails(
        updateDoc(userRef, {
          approvalStatus: 'approved',
          approvedBy: 'some_other_forged_uid',
          approvedAt: serverTimestamp(),
          rejectionReason: null,
          updatedAt: serverTimestamp(),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // 7. Approval State Machine Enforcement & Regression Tests (TEST-36 to TEST-46)
  // -------------------------------------------------------------------------
  describe('7. Approval State Machine Enforcement & Regression Tests', () => {
    const REQ_ID_2 = 'req_alice_regression_002';

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'users', ALICE_UID), {
          ...getValidProfile(ALICE_UID, ALICE_EMAIL),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          requestedAt: Timestamp.now(),
        });
      });
    });

    it('TEST-36: Pending → Suspended transition denied', async () => {
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const userRef = doc(adminDb, 'users', ALICE_UID); // Alice is 'pending'
      await assertFails(
        updateDoc(userRef, {
          approvalStatus: 'suspended',
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-37: Approved → Rejected transition denied', async () => {
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const userRef = doc(adminDb, 'users', CHARLIE_UID); // Charlie is 'approved'
      await assertFails(
        updateDoc(userRef, {
          approvalStatus: 'rejected',
          approvedBy: ADMIN_UID,
          approvedAt: null,
          rejectionReason: 'Retroactive rejection attempt',
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-38: Rejected → Suspended transition denied', async () => {
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const userRef = doc(adminDb, 'users', EVE_UID); // Eve is 'rejected'
      await assertFails(
        updateDoc(userRef, {
          approvalStatus: 'suspended',
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-39: Approved → Pending transition denied', async () => {
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const userRef = doc(adminDb, 'users', CHARLIE_UID); // Charlie is 'approved'
      await assertFails(
        updateDoc(userRef, {
          approvalStatus: 'pending',
          approvedBy: null,
          approvedAt: null,
          rejectionReason: null,
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-40: Rejected → Pending transition denied', async () => {
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const userRef = doc(adminDb, 'users', EVE_UID); // Eve is 'rejected'
      await assertFails(
        updateDoc(userRef, {
          approvalStatus: 'pending',
          approvedBy: null,
          approvedAt: null,
          rejectionReason: null,
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-41: Suspended → Rejected transition denied', async () => {
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const userRef = doc(adminDb, 'users', DAVID_UID); // David is 'suspended'
      await assertFails(
        updateDoc(userRef, {
          approvalStatus: 'rejected',
          approvedBy: ADMIN_UID,
          approvedAt: null,
          rejectionReason: 'Suspended user rejection attempt',
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-42: Rejected → Approved transition allowed', async () => {
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const userRef = doc(adminDb, 'users', EVE_UID); // Eve is 'rejected'
      await assertSucceeds(
        updateDoc(userRef, {
          approvalStatus: 'approved',
          approvedBy: ADMIN_UID,
          approvedAt: serverTimestamp(),
          rejectionReason: null,
          updatedAt: serverTimestamp(),
        })
      );
    });

    it('TEST-43: Applicant deleting their own submitted admin request denied', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const reqRef = doc(aliceDb, 'admin_requests', REQ_ID_2);
      await setDoc(reqRef, getValidAdminRequest(REQ_ID_2, ALICE_UID, ALICE_EMAIL));

      // Alice attempts to delete her own submitted request
      await assertFails(deleteDoc(reqRef));
    });

    it('TEST-44: Administrator modifying an existing admin record denied', async () => {
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const adminRecordRef = doc(adminDb, 'admins', ADMIN_UID);
      await assertFails(
        updateDoc(adminRecordRef, {
          role: 'hacked_role',
        })
      );
    });

    it('TEST-45: Non-admin creating an administrator record denied', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const adminRecordRef = doc(aliceDb, 'admins', ALICE_UID);
      await assertFails(
        setDoc(adminRecordRef, {
          uid: ALICE_UID,
          email: ALICE_EMAIL,
          role: 'admin',
        })
      );
    });

    it('TEST-46: Administrator reviewing an already reviewed admin request denied', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const reqRef = doc(aliceDb, 'admin_requests', REQ_ID_2);
      await setDoc(reqRef, getValidAdminRequest(REQ_ID_2, ALICE_UID, ALICE_EMAIL));

      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      const adminReqRef = doc(adminDb, 'admin_requests', REQ_ID_2);

      // First review succeeds
      await assertSucceeds(
        updateDoc(adminReqRef, {
          status: 'approved',
          reviewedAt: serverTimestamp(),
          reviewedBy: ADMIN_UID,
          reviewNotes: 'First review passes.',
        })
      );

      // Second review or reversal attempt must fail
      await assertFails(
        updateDoc(adminReqRef, {
          status: 'rejected',
          reviewedAt: serverTimestamp(),
          reviewedBy: ADMIN_UID,
          reviewNotes: 'Reversal attempt must fail.',
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // 8. Admin Email Notification Outbox & Atomic Creation (TEST-47 to TEST-72)
  // -------------------------------------------------------------------------
  describe('8. Admin Email Notification Outbox & Atomic Creation', () => {
    it('TEST-47: Verified applicant creates profile and outbox together in atomic batch → ALLOW', async () => {
      const newUid = 'user_batch_verified';
      const newEmail = 'batch_verified@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), getValidProfile(newUid, newEmail));
      batch.set(doc(db, 'admin_email_outbox', newUid), getValidOutbox(newUid, newEmail));
      await assertSucceeds(batch.commit());
    });

    it('TEST-48: Standalone profile creation without matching outbox → DENY', async () => {
      const zoeUid = 'user_zoe_profile_only';
      const zoeEmail = 'zoe@gmail.com';
      const zoeDb = testEnv.authenticatedContext(zoeUid, { email: zoeEmail, email_verified: true }).firestore();
      await assertFails(setDoc(doc(zoeDb, 'users', zoeUid), getValidProfile(zoeUid, zoeEmail)));
    });

    it('TEST-49: Outbox created without matching user profile → DENY', async () => {
      const newUid = 'user_outbox_alone';
      const newEmail = 'outbox_alone@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      await assertFails(setDoc(doc(db, 'admin_email_outbox', newUid), getValidOutbox(newUid, newEmail)));
    });

    it('TEST-50: User creates an outbox for another UID → DENY', async () => {
      const db = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', 'victim_uid'), getValidProfile('victim_uid', 'victim@gmail.com'));
      batch.set(doc(db, 'admin_email_outbox', 'victim_uid'), getValidOutbox('victim_uid', 'victim@gmail.com'));
      await assertFails(batch.commit());
    });

    it('TEST-51: Unverified applicant creates outbox in batch → DENY', async () => {
      const unverifiedUid = 'user_unverified_outbox';
      const unverifiedEmail = 'unverified_outbox@gmail.com';
      const db = testEnv.authenticatedContext(unverifiedUid, { email: unverifiedEmail, email_verified: false }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', unverifiedUid), getValidProfile(unverifiedUid, unverifiedEmail));
      batch.set(doc(db, 'admin_email_outbox', unverifiedUid), getValidOutbox(unverifiedUid, unverifiedEmail));
      await assertFails(batch.commit());
    });

    it('TEST-52: User reads own outbox → DENY', async () => {
      // Seed outbox for ALICE_UID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'admin_email_outbox', ALICE_UID), {
          ...getValidOutbox(ALICE_UID, ALICE_EMAIL),
          createdAt: Timestamp.now(),
        });
      });
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      await assertFails(getDoc(doc(aliceDb, 'admin_email_outbox', ALICE_UID)));
    });

    it('TEST-53: User modifies delivery status → DENY', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'admin_email_outbox', ALICE_UID), {
          ...getValidOutbox(ALICE_UID, ALICE_EMAIL),
          createdAt: Timestamp.now(),
        });
      });
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      await assertFails(
        updateDoc(doc(aliceDb, 'admin_email_outbox', ALICE_UID), {
          deliveryStatus: 'sent',
        })
      );
    });

    it('TEST-54: User deletes notification request → DENY', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'admin_email_outbox', ALICE_UID), {
          ...getValidOutbox(ALICE_UID, ALICE_EMAIL),
          createdAt: Timestamp.now(),
        });
      });
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      await assertFails(deleteDoc(doc(aliceDb, 'admin_email_outbox', ALICE_UID)));
    });

    it('TEST-55: Duplicate outbox request → DENY', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'admin_email_outbox', ALICE_UID), {
          ...getValidOutbox(ALICE_UID, ALICE_EMAIL),
          createdAt: Timestamp.now(),
        });
      });
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      await assertFails(setDoc(doc(aliceDb, 'admin_email_outbox', ALICE_UID), getValidOutbox(ALICE_UID, ALICE_EMAIL)));
    });

    it('TEST-56: Unexpected outbox field injection → DENY', async () => {
      const newUid = 'user_inject_field';
      const newEmail = 'inject@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), getValidProfile(newUid, newEmail));
      batch.set(doc(db, 'admin_email_outbox', newUid), getValidOutbox(newUid, newEmail, { hackerField: 'injected' }));
      await assertFails(batch.commit());
    });

    it('TEST-57: Outbox email mismatches Firebase Auth email → DENY', async () => {
      const newUid = 'user_email_forged';
      const newEmail = 'real@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), getValidProfile(newUid, newEmail));
      batch.set(doc(db, 'admin_email_outbox', newUid), getValidOutbox(newUid, 'forged@gmail.com'));
      await assertFails(batch.commit());
    });

    it('TEST-58: Outbox identity/details mismatch the accompanying user profile → DENY', async () => {
      const newUid = 'user_name_mismatch';
      const newEmail = 'mismatch@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), getValidProfile(newUid, newEmail, { displayName: 'Real Scholar' }));
      batch.set(doc(db, 'admin_email_outbox', newUid), getValidOutbox(newUid, newEmail, { displayName: 'Forged Scholar' }));
      await assertFails(batch.commit());
    });

    it('TEST-59: Unauthenticated outbox creation → DENY', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(setDoc(doc(db, 'admin_email_outbox', 'anon_uid'), getValidOutbox('anon_uid', 'anon@gmail.com')));
    });

    it('TEST-60: Ordinary user creates notification service identity → DENY', async () => {
      const aliceDb = testEnv.authenticatedContext(ALICE_UID, { email: ALICE_EMAIL, email_verified: true }).firestore();
      await assertFails(
        setDoc(doc(aliceDb, 'notification_services', ALICE_UID), {
          uid: ALICE_UID,
          serviceName: 'Rogue Service',
        })
      );
    });

    it('TEST-61: Administrator can read notification outbox records → ALLOW', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'admin_email_outbox', ALICE_UID), {
          ...getValidOutbox(ALICE_UID, ALICE_EMAIL),
          createdAt: Timestamp.now(),
        });
      });
      const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
      await assertSucceeds(getDoc(doc(adminDb, 'admin_email_outbox', ALICE_UID)));
    });

    it('TEST-62: Notification service identity can read and update delivery status → ALLOW', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'admin_email_outbox', ALICE_UID), {
          ...getValidOutbox(ALICE_UID, ALICE_EMAIL),
          createdAt: Timestamp.now(),
        });
      });
      const botDb = testEnv.authenticatedContext(BOT_UID, { email: BOT_EMAIL, email_verified: true }).firestore();
      const outboxDocRef = doc(botDb, 'admin_email_outbox', ALICE_UID);
      await assertSucceeds(getDoc(outboxDocRef));
      await assertSucceeds(
        updateDoc(outboxDocRef, {
          deliveryStatus: 'sent',
          sentAt: serverTimestamp(),
          attemptCount: 1,
          lastAttemptAt: serverTimestamp(),
          lastError: null,
        })
      );
    });

    it('TEST-63: Atomic batch with mismatched outbox UID → DENY', async () => {
      const newUid = 'user_mismatch_uid';
      const newEmail = 'mismatch_uid@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), getValidProfile(newUid, newEmail));
      batch.set(doc(db, 'admin_email_outbox', newUid), getValidOutbox('different_uid_val', newEmail));
      await assertFails(batch.commit());
    });

    it('TEST-64: Atomic batch with mismatched outbox userEmail → DENY', async () => {
      const newUid = 'user_mismatch_email';
      const newEmail = 'mismatch_email@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), getValidProfile(newUid, newEmail));
      batch.set(doc(db, 'admin_email_outbox', newUid), getValidOutbox(newUid, 'forged_email@gmail.com'));
      await assertFails(batch.commit());
    });

    it('TEST-65: Atomic batch with mismatched department → DENY', async () => {
      const newUid = 'user_mismatch_dept';
      const newEmail = 'mismatch_dept@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), getValidProfile(newUid, newEmail, { department: 'Computer Science and Engineering' }));
      batch.set(doc(db, 'admin_email_outbox', newUid), getValidOutbox(newUid, newEmail, { department: 'Electrical and Electronic Engineering' }));
      await assertFails(batch.commit());
    });

    it('TEST-66: Atomic batch with mismatched designation → DENY', async () => {
      const newUid = 'user_mismatch_desig';
      const newEmail = 'mismatch_desig@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), getValidProfile(newUid, newEmail, { designation: 'Undergraduate Researcher' }));
      batch.set(doc(db, 'admin_email_outbox', newUid), getValidOutbox(newUid, newEmail, { designation: 'Faculty Member' }));
      await assertFails(batch.commit());
    });

    it('TEST-67: Atomic batch with mismatched program → DENY', async () => {
      const newUid = 'user_mismatch_prog';
      const newEmail = 'mismatch_prog@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), getValidProfile(newUid, newEmail, { program: 'B.Sc. in CSE' }));
      batch.set(doc(db, 'admin_email_outbox', newUid), getValidOutbox(newUid, newEmail, { program: 'M.Sc. in CSE' }));
      await assertFails(batch.commit());
    });

    it('TEST-68: Atomic batch with mismatched batch → DENY', async () => {
      const newUid = 'user_mismatch_batch';
      const newEmail = 'mismatch_batch@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), getValidProfile(newUid, newEmail, { batch: 'Batch 14' }));
      batch.set(doc(db, 'admin_email_outbox', newUid), getValidOutbox(newUid, newEmail, { batch: 'Batch 15' }));
      await assertFails(batch.commit());
    });

    it('TEST-69: Atomic batch with mismatched researchInterests → DENY', async () => {
      const newUid = 'user_mismatch_interests';
      const newEmail = 'mismatch_interests@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), getValidProfile(newUid, newEmail, { researchInterests: ['Machine Learning'] }));
      batch.set(doc(db, 'admin_email_outbox', newUid), getValidOutbox(newUid, newEmail, { researchInterests: ['Quantum Computing'] }));
      await assertFails(batch.commit());
    });

    it('TEST-70: Atomic batch with client-generated timestamp on outbox createdAt → DENY', async () => {
      const newUid = 'user_client_ts';
      const newEmail = 'client_ts@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), getValidProfile(newUid, newEmail));
      batch.set(doc(db, 'admin_email_outbox', newUid), getValidOutbox(newUid, newEmail, {
        createdAt: Timestamp.fromDate(new Date('2025-01-01T00:00:00Z')),
      }));
      await assertFails(batch.commit());
    });

    it('TEST-71: Atomic batch with non-queued initial outbox status → DENY', async () => {
      const newUid = 'user_non_queued';
      const newEmail = 'non_queued@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), getValidProfile(newUid, newEmail));
      batch.set(doc(db, 'admin_email_outbox', newUid), getValidOutbox(newUid, newEmail, {
        deliveryStatus: 'sent',
      }));
      await assertFails(batch.commit());
    });

    it('TEST-72: Atomic batch with non-zero initial outbox attemptCount → DENY', async () => {
      const newUid = 'user_nonzero_attempts';
      const newEmail = 'nonzero_attempts@gmail.com';
      const db = testEnv.authenticatedContext(newUid, { email: newEmail, email_verified: true }).firestore();
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), getValidProfile(newUid, newEmail));
      batch.set(doc(db, 'admin_email_outbox', newUid), getValidOutbox(newUid, newEmail, {
        attemptCount: 1,
      }));
      await assertFails(batch.commit());
    });
  });
});

