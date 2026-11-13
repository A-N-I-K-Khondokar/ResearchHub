/**
 * CSE Research Hub — Simplified Notification Outbox Worker
 *
 * Polls queued applicant notifications from Firestore /admin_email_outbox,
 * formats approval emails with secure action links, and sends them to
 * the administrator (anik.khondokar09@gmail.com) via Gmail/MailApp.
 */

var OutboxWorker = (function () {
  var MAX_BATCH_SIZE = 10;
  var LOCK_WAIT_MS = 20000;

  function getAdminEmail() {
    var email = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');
    return (email || 'anik.khondokar09@gmail.com').toLowerCase().trim();
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

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Builds the HTML and plain-text email representation for applicant approval.
   */
  function buildEmail(item, approveUrl, rejectUrl) {
    var subject = 'New Account Approval Request — CSE Research Hub';
    var displayName = escapeHtml(item.displayName || 'Unknown Applicant');
    var email = escapeHtml(item.userEmail || item.email || 'N/A');
    var department = escapeHtml(item.department || 'N/A');
    var designation = escapeHtml(item.designation || 'N/A');
    var program = escapeHtml(item.program || 'Not specified');
    var batch = escapeHtml(item.batch || 'Not specified');
    var submissionDate = item.createdAt ? new Date(item.createdAt).toUTCString() : new Date().toUTCString();

    var interestsHtml = '<em>None listed</em>';
    var rawInterests = item.researchInterests;
    if (Array.isArray(rawInterests) && rawInterests.length > 0) {
      var pills = [];
      for (var p = 0; p < rawInterests.length; p++) {
        pills.push('<span style="display:inline-block;background:#EBF2FF;color:#1B5ECC;border-radius:9999px;padding:3px 10px;font-size:12px;font-weight:600;margin:2px 4px 2px 0;">' + escapeHtml(rawInterests[p]) + '</span>');
      }
      interestsHtml = pills.join(' ');
    }

    var htmlBody =
      '<!DOCTYPE html>' +
      '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">' +
      '<title>' + subject + '</title>' +
      '</head><body style="margin:0;padding:24px 16px;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;color:#0F172A;">' +
      '<div style="max-width:580px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.04);">' +
      '<div style="background:#1E293B;padding:24px 28px;color:#FFFFFF;">' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#94A3B8;margin-bottom:4px;">CSE Research Hub &bull; Administration</div>' +
      '<h1 style="margin:0;font-size:20px;font-weight:700;color:#FFFFFF;">New Account Approval Request</h1>' +
      '</div>' +
      '<div style="padding:28px;">' +
      '<p style="margin:0 0 20px 0;font-size:14.5px;line-height:22px;color:#334155;">' +
      'A new researcher profile has been submitted and is awaiting your administrative review.' +
      '</p>' +
      '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">' +
      '<tr><td style="padding:10px 14px;font-weight:600;color:#64748B;background:#F1F5F9;width:130px;font-size:13px;border-bottom:1px solid #E2E8F0;">Applicant</td><td style="padding:10px 14px;color:#0F172A;font-weight:700;font-size:13.5px;border-bottom:1px solid #E2E8F0;">' + displayName + '</td></tr>' +
      '<tr><td style="padding:10px 14px;font-weight:600;color:#64748B;background:#F1F5F9;font-size:13px;border-bottom:1px solid #E2E8F0;">Verified Email</td><td style="padding:10px 14px;color:#0F172A;font-size:13px;border-bottom:1px solid #E2E8F0;">' + email + '</td></tr>' +
      '<tr><td style="padding:10px 14px;font-weight:600;color:#64748B;background:#F1F5F9;font-size:13px;border-bottom:1px solid #E2E8F0;">Department</td><td style="padding:10px 14px;color:#0F172A;font-size:13px;border-bottom:1px solid #E2E8F0;">' + department + '</td></tr>' +
      '<tr><td style="padding:10px 14px;font-weight:600;color:#64748B;background:#F1F5F9;font-size:13px;border-bottom:1px solid #E2E8F0;">Designation</td><td style="padding:10px 14px;color:#0F172A;font-size:13px;border-bottom:1px solid #E2E8F0;">' + designation + '</td></tr>' +
      '<tr><td style="padding:10px 14px;font-weight:600;color:#64748B;background:#F1F5F9;font-size:13px;border-bottom:1px solid #E2E8F0;">Program</td><td style="padding:10px 14px;color:#0F172A;font-size:13px;border-bottom:1px solid #E2E8F0;">' + program + '</td></tr>' +
      '<tr><td style="padding:10px 14px;font-weight:600;color:#64748B;background:#F1F5F9;font-size:13px;border-bottom:1px solid #E2E8F0;">Batch</td><td style="padding:10px 14px;color:#0F172A;font-size:13px;border-bottom:1px solid #E2E8F0;">' + batch + '</td></tr>' +
      '<tr><td style="padding:10px 14px;font-weight:600;color:#64748B;background:#F1F5F9;font-size:13px;border-bottom:1px solid #E2E8F0;">Interests</td><td style="padding:10px 14px;color:#0F172A;font-size:13px;border-bottom:1px solid #E2E8F0;">' + interestsHtml + '</td></tr>' +
      '<tr><td style="padding:10px 14px;font-weight:600;color:#64748B;background:#F1F5F9;font-size:13px;">Submitted</td><td style="padding:10px 14px;color:#64748B;font-size:12.5px;">' + submissionDate + '</td></tr>' +
      '</table>' +
      '<div style="text-align:center;margin:28px 0 16px 0;">' +
      '<a href="' + approveUrl + '" style="display:inline-block;padding:12px 24px;margin-right:12px;background:#16A34A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;">Approve Application</a>' +
      '<a href="' + rejectUrl + '" style="display:inline-block;padding:12px 24px;background:#DC2626;color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;">Reject Application</a>' +
      '</div>' +
      '<p style="text-align:center;font-size:12px;color:#94A3B8;margin:16px 0 0 0;">' +
      'Links are signed with HMAC-SHA256 and valid for 48 hours. Clicking an action presents a confirmation page before changes take effect.' +
      '</p>' +
      '</div>' +
      '<div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:14px 28px;font-size:11.5px;color:#64748B;text-align:center;">' +
      'CSE Research Hub Notification System &bull; University of Dhaka' +
      '</div></div></body></html>';

    var plainText =
      'New Account Approval Request — CSE Research Hub\n\n' +
      'Applicant: ' + item.displayName + '\n' +
      'Email: ' + (item.userEmail || item.email) + '\n' +
      'Department: ' + item.department + '\n' +
      'Designation: ' + item.designation + '\n' +
      'Program: ' + (item.program || 'N/A') + '\n' +
      'Batch: ' + (item.batch || 'N/A') + '\n' +
      'Interests: ' + (Array.isArray(item.researchInterests) ? item.researchInterests.join(', ') : 'None') + '\n' +
      'Submitted: ' + submissionDate + '\n\n' +
      'Approve Link: ' + approveUrl + '\n\n' +
      'Reject Link: ' + rejectUrl + '\n\n' +
      'Note: Links expire in 48 hours and require confirmation.';

    return {
      subject: subject,
      htmlBody: htmlBody,
      plainText: plainText
    };
  }

  /**
   * Primary scheduled function.
   * Polls queued notification documents and dispatches email alerts.
   */
  function processOutbox() {
    var lock = LockService.getScriptLock();
    var acquired = lock.tryLock(LOCK_WAIT_MS);
    if (!acquired) {
      Logger.log('[OutboxWorker] Another instance is running. Skipping this cycle.');
      return;
    }

    try {
      var adminEmail = getAdminEmail();
      var hmacSecret = getHmacSecret();
      var webAppUrl = getWebAppUrl();

      var queuedItems = FirestoreClient.queryQueuedOutbox(MAX_BATCH_SIZE);
      if (!queuedItems || queuedItems.length === 0) {
        Logger.log('[OutboxWorker] Outbox queue is empty (0 queued items).');
        return;
      }

      Logger.log('[OutboxWorker] Found ' + queuedItems.length + ' queued notification(s). Commencing dispatch...');

      for (var i = 0; i < queuedItems.length; i++) {
        var item = queuedItems[i];
        var uid = item.uid;

        try {
          var approveToken = Approval.generateActionToken('approve', uid, hmacSecret, 48);
          var rejectToken = Approval.generateActionToken('reject', uid, hmacSecret, 48);

          var approveUrl = webAppUrl + '?action=approve&token=' + encodeURIComponent(approveToken);
          var rejectUrl = webAppUrl + '?action=reject&token=' + encodeURIComponent(rejectToken);

          var email = buildEmail(item, approveUrl, rejectUrl);

          MailApp.sendEmail({
            to: adminEmail,
            subject: email.subject,
            htmlBody: email.htmlBody,
            body: email.plainText,
            name: 'CSE Research Hub Administration'
          });

          // Mark notification as successfully sent
          var now = new Date();
          FirestoreClient.updateOutboxDelivery(uid, {
            deliveryStatus: 'sent',
            sentAt: now,
            lastAttemptAt: now,
            lastError: null
          });

          Logger.log('[OutboxWorker] Successfully dispatched notification for: ' + item.displayName + ' (' + uid + ')');
        } catch (err) {
          Logger.log('[OutboxWorker] Failed to dispatch for ' + uid + ': ' + err.message);

          try {
            FirestoreClient.updateOutboxDelivery(uid, {
              deliveryStatus: 'failed',
              lastAttemptAt: new Date(),
              lastError: String(err.message || err).substring(0, 500)
            });
          } catch (updateErr) {
            Logger.log('[OutboxWorker] Could not record failed status for ' + uid + ': ' + updateErr.message);
          }
        }
      }
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Installs the 5-minute recurring time-driven trigger for processOutbox().
   */
  function setupOutboxTrigger() {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'processOutbox') {
        return 'Trigger already active (ID: ' + triggers[i].getUniqueId() + ')';
      }
    }

    var newTrigger = ScriptApp.newTrigger('processOutbox')
      .timeBased()
      .everyMinutes(5)
      .create();

    Logger.log('[OutboxWorker] Installed 5-minute cron trigger (ID: ' + newTrigger.getUniqueId() + ')');
    return 'Trigger installed successfully (ID: ' + newTrigger.getUniqueId() + ')';
  }

  /**
   * Removes all active triggers for processOutbox().
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
    removeOutboxTrigger: removeOutboxTrigger,
    buildEmail: buildEmail
  };
})();
