/**
 * CSE Research Hub — Automated Notification Outbox Worker
 *
 * Polls queued applicant notifications from Firestore, renders signed review
 * emails, and dispatches them to the configured administrator via Gmail.
 *
 * Operational Model:
 * - Triggered every 5 minutes via an installable time-driven trigger.
 * - Single-instance concurrency enforced via LockService.
 * - Delivery semantics: At-least-once delivery. In rare cases where a network
 *   failure occurs after Gmail dispatch but before Firestore status mutation,
 *   a duplicate email may be sent upon subsequent retry. Exactly-once email delivery
 *   cannot be guaranteed across distributed network boundaries.
 */

var OutboxWorker = (function () {
  var MAX_BATCH_SIZE = 10;
  var LOCK_WAIT_MS = 20000;
  var MAX_RETRIES = 5;
  var STALE_SENDING_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes (stale recovery window)

  function getExpectedAdminEmail() {
    var email = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');
    if (!email) {
      throw new Error('[OutboxWorker] Missing required Script Property: ADMIN_EMAIL');
    }
    return email.toLowerCase().trim();
  }

  function getHmacSecret() {
    var secret = PropertiesService.getScriptProperties().getProperty('HMAC_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('[OutboxWorker] Missing or insecure HMAC_SECRET in Script Properties (min 32 chars).');
    }
    return secret;
  }

  function getWebAppUrl() {
    var url = PropertiesService.getScriptProperties().getProperty('WEB_APP_URL');
    if (!url || url.indexOf('https://script.google.com/') !== 0) {
      throw new Error(
        '[OutboxWorker] Invalid or missing WEB_APP_URL in Script Properties. ' +
        'Deploy the Web App first and set WEB_APP_URL to its deployment URL.'
      );
    }
    return url.trim();
  }

  /**
   * Sanitizes an error message before persisting to Firestore, stripping
   * potential tokens, keys, or sensitive credentials.
   */
  function sanitizeErrorMessage(err) {
    if (!err) return 'Unknown error';
    var raw = String(err.message || err);
    return raw
      .replace(/key=[^&\s]+/gi, 'key=[REDACTED]')
      .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED]')
      .replace(/token=[^&\s]+/gi, 'token=[REDACTED]')
      .substring(0, 500);
  }

  /**
   * Validates that an outbox record contains required applicant fields.
   */
  function validateOutboxRecord(item) {
    if (!item.uid || typeof item.uid !== 'string') {
      throw new Error('Outbox record missing valid uid');
    }
    if (!item.userEmail || typeof item.userEmail !== 'string') {
      throw new Error('Outbox record missing valid userEmail');
    }
    if (!item.displayName || typeof item.displayName !== 'string') {
      throw new Error('Outbox record missing valid displayName');
    }
    if (!item.department || typeof item.department !== 'string') {
      throw new Error('Outbox record missing valid department');
    }
    if (!item.designation || typeof item.designation !== 'string') {
      throw new Error('Outbox record missing valid designation');
    }
  }

  /**
   * Recovers stale 'sending' records caused by previous worker timeouts or interruptions.
   * If an item has been in 'sending' status for longer than STALE_SENDING_THRESHOLD_MS:
   * - If attemptCount >= MAX_RETRIES: marks deliveryStatus as 'failed'.
   * - If attemptCount < MAX_RETRIES: re-queues deliveryStatus back to 'queued' for retry.
   *
   * @param {string} botIdToken - Verified bot Firebase ID token
   */
  function recoverStaleSendingRecords(botIdToken) {
    try {
      var sendingItems = FirestoreClient.querySendingOutbox(botIdToken, MAX_BATCH_SIZE);
      if (!sendingItems || sendingItems.length === 0) {
        return;
      }

      var now = Date.now();
      for (var i = 0; i < sendingItems.length; i++) {
        var item = sendingItems[i];
        var lastAttemptTime = item.lastAttemptAt ? new Date(item.lastAttemptAt).getTime() : 0;
        var isStale = (now - lastAttemptTime) > STALE_SENDING_THRESHOLD_MS;

        if (isStale) {
          var attempts = item.attemptCount || 1;
          if (attempts >= MAX_RETRIES) {
            Logger.log('[OutboxWorker] Stale sending record ' + item.uid + ' exceeded max retries (' + MAX_RETRIES + '). Marking failed.');
            FirestoreClient.updateOutboxDelivery(botIdToken, item.uid, {
              deliveryStatus: 'failed',
              lastError: 'Stale delivery attempt timed out and exceeded maximum retry limit (' + MAX_RETRIES + ').'
            });
          } else {
            Logger.log('[OutboxWorker] Stale sending record ' + item.uid + ' recovered. Re-queuing for retry attempt ' + (attempts + 1) + '.');
            FirestoreClient.updateOutboxDelivery(botIdToken, item.uid, {
              deliveryStatus: 'queued',
              lastError: 'Recovered from interrupted worker execution; re-queued.'
            });
          }
        }
      }
    } catch (err) {
      Logger.log('[OutboxWorker] Warning during stale-sending recovery: ' + err.message);
    }
  }

  /**
   * Primary cron worker function.
   * Processes up to 10 queued notification records from /admin_email_outbox.
   */
  function processOutbox() {
    var lock = LockService.getScriptLock();
    var acquired = lock.tryLock(LOCK_WAIT_MS);
    if (!acquired) {
      Logger.log('[OutboxWorker] Could not acquire script lock within ' + LOCK_WAIT_MS + 'ms. Another worker is active. Skipping run.');
      return;
    }

    try {
      // 1. Quota Pre-check: Ensure Gmail daily sending quota is available
      var remainingQuota = MailApp.getRemainingDailyQuota();
      if (remainingQuota <= 0) {
        Logger.log('[OutboxWorker] Gmail daily quota exhausted (0 remaining). Halting outbox processing until quota resets.');
        return;
      }

      var adminEmail = getExpectedAdminEmail();
      var hmacSecret = getHmacSecret();
      var webAppUrl = getWebAppUrl();

      // Retrieve bot credentials
      var botIdToken = FirebaseAuth.getBotIdToken();

      // 2. Stale-worker recovery: inspect any records stuck in 'sending'
      recoverStaleSendingRecords(botIdToken);

      // 3. Query queued items (up to 10)
      var queuedItems = FirestoreClient.queryQueuedOutbox(botIdToken, MAX_BATCH_SIZE);

      if (!queuedItems || queuedItems.length === 0) {
        Logger.log('[OutboxWorker] Outbox queue is empty. 0 items to process.');
        return;
      }

      Logger.log('[OutboxWorker] Found ' + queuedItems.length + ' queued notification(s). Remaining quota: ' + remainingQuota + '. Commencing dispatch...');

      for (var i = 0; i < queuedItems.length; i++) {
        // Dynamic quota check during batch processing
        if (MailApp.getRemainingDailyQuota() <= 0) {
          Logger.log('[OutboxWorker] Gmail daily quota exhausted during batch execution. Pausing remaining items.');
          break;
        }

        var item = queuedItems[i];
        var uid = item.uid;
        var attempt = (item.attemptCount || 0) + 1;
        var now = new Date();

        // Guard against excessive retries
        if (attempt > MAX_RETRIES) {
          Logger.log('[OutboxWorker] Item ' + uid + ' exceeded maximum retries (' + MAX_RETRIES + '). Leaving failed for admin inspection.');
          FirestoreClient.updateOutboxDelivery(botIdToken, uid, {
            deliveryStatus: 'failed',
            attemptCount: attempt,
            lastAttemptAt: now,
            lastError: 'Exceeded maximum automated retry limit (' + MAX_RETRIES + ').'
          });
          continue;
        }

        // Validate applicant details
        try {
          validateOutboxRecord(item);
        } catch (valErr) {
          Logger.log('[OutboxWorker] Validation failed for ' + uid + ': ' + valErr.message);
          FirestoreClient.updateOutboxDelivery(botIdToken, uid, {
            deliveryStatus: 'failed',
            attemptCount: attempt,
            lastAttemptAt: now,
            lastError: 'Validation error: ' + sanitizeErrorMessage(valErr)
          });
          continue;
        }

        // Mark item as 'sending' prior to email transmission
        try {
          FirestoreClient.updateOutboxDelivery(botIdToken, uid, {
            deliveryStatus: 'sending',
            attemptCount: attempt,
            lastAttemptAt: now
          });
        } catch (markErr) {
          Logger.log('[OutboxWorker] Failed to mark ' + uid + ' as sending: ' + markErr.message);
          continue;
        }

        // Generate signed action links and send email
        try {
          var approveToken = ApprovalWebApp.generateActionToken('approve', uid, hmacSecret, 48);
          var rejectToken = ApprovalWebApp.generateActionToken('reject', uid, hmacSecret, 48);

          var approveUrl = webAppUrl + '?action=approve&uid=' + encodeURIComponent(uid) + '&token=' + encodeURIComponent(approveToken);
          var rejectUrl = webAppUrl + '?action=reject&uid=' + encodeURIComponent(uid) + '&token=' + encodeURIComponent(rejectToken);

          var emailContent = EmailTemplate.buildApprovalNotificationEmail(item, approveUrl, rejectUrl);

          // Dispatch email strictly to configured ADMIN_EMAIL
          MailApp.sendEmail({
            to: adminEmail,
            subject: emailContent.subject,
            htmlBody: emailContent.htmlBody,
            body: emailContent.plainTextBody,
            name: 'CSE Research Hub Administration'
          });

          // Mark as successfully 'sent'
          FirestoreClient.updateOutboxDelivery(botIdToken, uid, {
            deliveryStatus: 'sent',
            sentAt: new Date(),
            lastError: null
          });

          Logger.log('[OutboxWorker] Successfully notified ' + adminEmail + ' for applicant: ' + item.displayName + ' (' + uid + ')');
        } catch (dispatchErr) {
          var sanitized = sanitizeErrorMessage(dispatchErr);
          Logger.log('[OutboxWorker] Dispatch failed for ' + uid + ': ' + sanitized);

          try {
            FirestoreClient.updateOutboxDelivery(botIdToken, uid, {
              deliveryStatus: 'failed',
              lastError: sanitized
            });
          } catch (updateErr) {
            Logger.log('[OutboxWorker] Secondary failure recording error state for ' + uid + ': ' + updateErr.message);
          }
        }
      }
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Idempotent trigger installer.
   * Checks for an existing trigger on `processOutbox` before creating one.
   */
  function setupOutboxTrigger() {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'processOutbox') {
        Logger.log('[OutboxWorker] Trigger already installed. Trigger ID: ' + triggers[i].getUniqueId());
        return 'Trigger already active (ID: ' + triggers[i].getUniqueId() + ')';
      }
    }

    var newTrigger = ScriptApp.newTrigger('processOutbox')
      .timeBased()
      .everyMinutes(5)
      .create();

    Logger.log('[OutboxWorker] Installed 5-minute cron trigger. Trigger ID: ' + newTrigger.getUniqueId());
    return 'Trigger installed successfully (ID: ' + newTrigger.getUniqueId() + ')';
  }

  /**
   * Removes all installable triggers associated with `processOutbox`.
   */
  function removeOutboxTrigger() {
    var triggers = ScriptApp.getProjectTriggers();
    var count = 0;
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'processOutbox') {
        ScriptApp.deleteTrigger(triggers[i]);
        count++;
      }
    }
    Logger.log('[OutboxWorker] Removed ' + count + ' trigger(s).');
    return 'Removed ' + count + ' trigger(s).';
  }

  return {
    processOutbox: processOutbox,
    setupOutboxTrigger: setupOutboxTrigger,
    removeOutboxTrigger: removeOutboxTrigger
  };
})();

