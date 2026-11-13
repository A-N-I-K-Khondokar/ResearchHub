/**
 * CSE Research Hub — Simplified Apps Script Entry Point
 *
 * Exposes top-level functions required by the Google Apps Script runtime:
 * - doGet(e): Serves the confirmation page for email review links.
 * - doPost(e): Processes authenticated administrative approval / rejection.
 * - processOutbox(): Scheduled cron function triggered every 5 minutes.
 * - setupOutboxTrigger(): Installs the 5-minute recurring time-driven trigger.
 * - removeOutboxTrigger(): Removes active triggers for processOutbox().
 * - testOutboxWorker(): Manual diagnostic test to verify Firestore and Gmail access.
 */

/**
 * Handles incoming HTTP GET requests for the Web App.
 * Serves read-only confirmation screen for email action links.
 */
function doGet(e) {
  return Approval.handleGet(e);
}

/**
 * Handles incoming HTTP POST requests for the Web App.
 * Executes administrative profile status mutation after confirmation.
 */
function doPost(e) {
  return Approval.handlePost(e);
}

/**
 * Scheduled cron task triggered every 5 minutes.
 * Polls queued applicant notifications from Firestore and sends email alerts.
 */
function processOutbox() {
  OutboxWorker.processOutbox();
}

/**
 * Installs the 5-minute recurring time-driven trigger for processOutbox().
 * Run once from the Apps Script editor after configuration.
 */
function setupOutboxTrigger() {
  return OutboxWorker.setupOutboxTrigger();
}

/**
 * Removes active recurring triggers for processOutbox().
 * Run to pause automated background polling.
 */
function removeOutboxTrigger() {
  return OutboxWorker.removeOutboxTrigger();
}

/**
 * Manual diagnostic utility to verify configuration, Firestore REST access,
 * and remaining email quota. Run from the Apps Script editor toolbar.
 */
function testOutboxWorker() {
  try {
    Logger.log('[Diagnostic] 1. Checking Script Properties...');
    var props = PropertiesService.getScriptProperties().getProperties();
    var projectId = props.FIREBASE_PROJECT_ID || 'cse-research-hub';
    var adminEmail = props.ADMIN_EMAIL || 'anik.khondokar09@gmail.com';
    var adminUid = props.ADMIN_UID;
    var hmacSecret = props.HMAC_SECRET;

    if (!adminUid) {
      throw new Error('Missing required Script Property: ADMIN_UID');
    }
    if (!hmacSecret || hmacSecret.length < 32) {
      throw new Error('Missing or too short Script Property: HMAC_SECRET (min 32 chars)');
    }
    Logger.log('[Diagnostic] Properties verified. Project: ' + projectId + ', Admin: ' + adminEmail);

    Logger.log('[Diagnostic] 2. Testing Firestore REST API connectivity via OAuth token...');
    var queuedItems = FirestoreClient.queryQueuedOutbox(1);
    Logger.log('[Diagnostic] Firestore connectivity verified. Queued items count: ' + queuedItems.length);

    Logger.log('[Diagnostic] 3. Testing remaining daily email quota...');
    var quota = MailApp.getRemainingDailyQuota();
    Logger.log('[Diagnostic] Remaining daily email quota: ' + quota);

    return 'All checks passed! Project: ' + projectId + ', Remaining email quota: ' + quota;
  } catch (err) {
    Logger.log('[Diagnostic ERROR] ' + err.message);
    throw err;
  }
}
