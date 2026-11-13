/**
 * CSE Research Hub — Google Apps Script Master Entry Point
 *
 * Exposes top-level functions required by Google Apps Script runtime:
 * - doGet(e): Renders read-only applicant review confirmation page.
 * - doPost(e): Processes authenticated administrative approval / rejection.
 * - processOutbox(): Cron task invoked by installable 5-minute trigger.
 * - Administrative utilities for setup, authentication, and diagnostic testing.
 */

/**
 * Handles incoming HTTP GET requests for the Web App.
 * Serves read-only confirmation screen for email action links.
 */
function doGet(e) {
  return ApprovalWebApp.handleGet(e);
}

/**
 * Handles incoming HTTP POST requests for the Web App.
 * Executes administrative profile status mutation after confirmation.
 */
function doPost(e) {
  return ApprovalWebApp.handlePost(e);
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
 * Idempotent: checks for existing triggers before creating.
 *
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
 * One-time setup function to bootstrap the notification bot account.
 * Exchanging a temporary password for a long-lived refresh token.
 *
 * @param {string} tempPassword - Temporary bot password (or stored in TEMP_BOT_PASSWORD)
 */
function bootstrapBotAuthentication(tempPassword) {
  return FirebaseAuth.bootstrapBotAuthentication(tempPassword);
}

/**
 * Diagnostic utility to test bot credentials and Firestore connectivity.
 * Verifies that the bot can authenticate and read the outbox collection.
 *
 * Run manually from the Apps Script editor to verify setup before enabling triggers.
 */
function testBotConnection() {
  try {
    Logger.log('[Diagnostic] 1. Testing bot ID token acquisition...');
    var token = FirebaseAuth.getBotIdToken();
    Logger.log('[Diagnostic] ID token successfully retrieved.');

    Logger.log('[Diagnostic] 2. Testing outbox queue query...');
    var items = FirestoreClient.queryQueuedOutbox(token, 1);
    Logger.log('[Diagnostic] Outbox query succeeded. Queued items count: ' + items.length);

    Logger.log('[Diagnostic] 3. Testing remaining daily email quota...');
    var quota = MailApp.getRemainingDailyQuota();
    Logger.log('[Diagnostic] Remaining daily email quota: ' + quota);

    return 'Bot connection and Firestore connectivity verified successfully. Remaining email quota: ' + quota;
  } catch (err) {
    Logger.log('[Diagnostic ERROR] ' + err.message);
    throw err;
  }
}

/**
 * Checks and logs the remaining daily email quota for the active account.
 */
function checkDailyEmailQuota() {
  var remaining = MailApp.getRemainingDailyQuota();
  Logger.log('Remaining daily email quota: ' + remaining);
  return remaining;
}

