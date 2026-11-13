/**
 * CSE Research Hub — Simplified Administrator Approval Gateway
 *
 * Implements the administrative approval workflow:
 * - GET: Read-only confirmation screen verifying signed token and admin identity.
 * - POST: Authenticated and authorized state machine mutation.
 *
 * Security Invariants:
 * 1. Web App deploys as USER_ACCESSING.
 * 2. Active user identity must match ADMIN_EMAIL (anik.khondokar09@gmail.com).
 * 3. HMAC-SHA256 signed action tokens with 48h expiration.
 * 4. Zero mutations during GET (scanner-safe).
 * 5. Server-side admin record verification against /admins/{ADMIN_UID}.
 * 6. Server-side applicant status verification (must be 'pending').
 * 7. Target applicant UID derived strictly from validated cryptographic token payload.
 */

var Approval = (function () {
  var EXPIRY_HOURS = 48;

  function getHmacSecret() {
    var secret = PropertiesService.getScriptProperties().getProperty('HMAC_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('[Approval] Missing or insecure HMAC_SECRET in Script Properties (min 32 chars).');
    }
    return secret;
  }

  function getAdminEmail() {
    var email = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');
    return (email || 'anik.khondokar09@gmail.com').toLowerCase().trim();
  }

  function getAdminUid() {
    var uid = PropertiesService.getScriptProperties().getProperty('ADMIN_UID');
    if (!uid) {
      throw new Error('[Approval] Missing ADMIN_UID in Script Properties.');
    }
    return uid.trim();
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

  // ---------------------------------------------------------------------------
  // Cryptographic Action Tokens (HMAC-SHA256)
  // ---------------------------------------------------------------------------

  /**
   * Generates a signed, expiring action token.
   * Format: base64(payload).base64(signature)
   */
  function generateActionToken(action, uid, secret, expiryHours) {
    var hours = expiryHours || EXPIRY_HOURS;
    var expiry = Date.now() + (hours * 60 * 60 * 1000);
    var nonce = Utilities.getUuid();
    var payload = action + ':' + uid + ':' + expiry + ':' + nonce;

    var rawSig = Utilities.computeHmacSha256Signature(payload, secret);
    var encPayload = Utilities.base64EncodeWebSafe(payload);
    var encSig = Utilities.base64EncodeWebSafe(rawSig);

    return encPayload + '.' + encSig;
  }

  /**
   * Constant-time string comparison to resist timing attacks.
   */
  function constantTimeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) return false;
    var result = 0;
    for (var i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Validates a signed action token.
   *
   * @param {string} token - The composite token
   * @param {string} expectedAction - 'approve' | 'reject'
   * @param {string} secret - HMAC secret
   * @returns {Object} { valid: boolean, error?: string, payload?: Object }
   */
  function verifyActionToken(token, expectedAction, secret) {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Missing or malformed token.' };
    }

    var parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid token structure.' };
    }

    var encPayload = parts[0];
    var providedSig = parts[1];

    var payloadStr;
    try {
      payloadStr = Utilities.newBlob(Utilities.base64DecodeWebSafe(encPayload)).getDataAsString();
    } catch (e) {
      return { valid: false, error: 'Corrupt token payload encoding.' };
    }

    var expectedRawSig = Utilities.computeHmacSha256Signature(payloadStr, secret);
    var expectedSig = Utilities.base64EncodeWebSafe(expectedRawSig);

    if (!constantTimeCompare(providedSig, expectedSig)) {
      return { valid: false, error: 'Cryptographic signature verification failed.' };
    }

    var segments = payloadStr.split(':');
    if (segments.length !== 4) {
      return { valid: false, error: 'Malformed token payload parameters.' };
    }

    var action = segments[0];
    var uid = segments[1];
    var expiry = parseInt(segments[2], 10);
    var nonce = segments[3];

    if (expectedAction && action !== expectedAction) {
      return { valid: false, error: 'Token action mismatch.' };
    }
    if (isNaN(expiry) || Date.now() > expiry) {
      return { valid: false, error: 'Action token has expired (valid for 48 hours).' };
    }

    return {
      valid: true,
      payload: {
        action: action,
        uid: uid,
        expiry: expiry,
        nonce: nonce
      }
    };
  }

  // ---------------------------------------------------------------------------
  // HTML Message Response Renderer
  // ---------------------------------------------------------------------------

  function renderHtmlMessage(title, message, isSuccess, details) {
    var accentColor = isSuccess ? '#16A34A' : '#DC2626';
    var badgeText = isSuccess ? 'Operation Successful' : 'Action Blocked';
    var escapedDetails = details ? '<pre style="background:#F1F5F9;padding:12px;border-radius:6px;font-size:12px;overflow-x:auto;">' + escapeHtml(details) + '</pre>' : '';

    var html =
      '<!DOCTYPE html>' +
      '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">' +
      '<title>' + escapeHtml(title) + ' — CSE Research Hub</title>' +
      '<style>' +
      'body{margin:0;padding:32px 16px;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#0F172A;}' +
      '.card{max-width:560px;margin:40px auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);}' +
      '.badge{display:inline-block;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#FFF;background:' + accentColor + ';margin-bottom:12px;}' +
      'h1{margin:0 0 12px 0;font-size:22px;color:#0F172A;line-height:28px;}' +
      'p{margin:0 0 16px 0;font-size:15px;line-height:22px;color:#475569;}' +
      '.footer{margin-top:24px;padding-top:16px;border-top:1px solid #E2E8F0;font-size:12px;color:#94A3B8;}' +
      '</style></head><body>' +
      '<div class="card">' +
      '<div class="badge">' + badgeText + '</div>' +
      '<h1>' + escapeHtml(title) + '</h1>' +
      '<p>' + escapeHtml(message) + '</p>' +
      escapedDetails +
      '<div class="footer">CSE Research Hub &bull; Administrative Approval Gateway</div>' +
      '</div></body></html>';

    return HtmlService.createHtmlOutput(html)
      .setTitle(title + ' — CSE Research Hub')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DENY);
  }

  // ---------------------------------------------------------------------------
  // Web App GET Handler (Read-Only Confirmation View)
  // ---------------------------------------------------------------------------

  function handleGet(e) {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = (params.action || '').trim().toLowerCase();
    var token = (params.token || '').trim();

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return renderHtmlMessage('Invalid Action', 'Requested action parameter is missing or unsupported.', false);
    }
    if (!token) {
      return renderHtmlMessage('Missing Token', 'Cryptographic action token was not provided.', false);
    }

    // 1. Verify Active Google Account
    var activeEmail = Session.getActiveUser().getEmail();
    if (!activeEmail) {
      return renderHtmlMessage(
        'Authentication Required',
        'You must sign in to your authorized Google Account to access this confirmation page. Anonymous access is strictly prohibited.',
        false
      );
    }

    var expectedAdminEmail = getAdminEmail();
    if (activeEmail.toLowerCase() !== expectedAdminEmail) {
      return renderHtmlMessage(
        'Unauthorized Account',
        'Your active Google account (' + activeEmail + ') is not authorized to review applications. Please sign in as ' + expectedAdminEmail + '.',
        false
      );
    }

    // 2. Verify Cryptographic Token
    var hmacSecret = getHmacSecret();
    var tokenValidation = verifyActionToken(token, action, hmacSecret);
    if (!tokenValidation.valid) {
      return renderHtmlMessage('Invalid or Expired Link', tokenValidation.error, false);
    }

    // Security Invariant: Extract verified applicant UID and action directly from the token payload
    var targetUid = tokenValidation.payload.uid;
    var targetAction = tokenValidation.payload.action;

    // 3. Retrieve Applicant Profile (Read-Only)
    var profile;
    try {
      profile = FirestoreClient.getUserProfile(targetUid);
    } catch (err) {
      return renderHtmlMessage('Firestore Read Error', 'Unable to retrieve applicant profile: ' + err.message, false);
    }

    if (!profile) {
      return renderHtmlMessage('Applicant Not Found', 'No user profile exists for the specified applicant UID (' + targetUid + ').', false);
    }

    // 4. Verify Pending State
    if (profile.approvalStatus !== 'pending') {
      return renderHtmlMessage(
        'Already Processed',
        'This application has already been reviewed and has status: ' + profile.approvalStatus.toUpperCase() + '.',
        true,
        'Reviewed By: ' + (profile.approvedBy || 'N/A') + '\nStatus: ' + profile.approvalStatus
      );
    }

    // 5. Render Confirmation Template
    var template = HtmlService.createTemplateFromFile('Approval');
    template.applicant = profile;
    template.action = targetAction;
    template.uid = targetUid;
    template.token = token;
    template.adminEmail = expectedAdminEmail;
    template.activeEmail = activeEmail;
    template.webAppUrl = PropertiesService.getScriptProperties().getProperty('WEB_APP_URL') || ScriptApp.getService().getUrl();

    return template.evaluate()
      .setTitle('Confirm ' + (targetAction === 'approve' ? 'Approval' : 'Rejection') + ' — ' + (profile.displayName || targetUid))
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DENY);
  }

  // ---------------------------------------------------------------------------
  // Web App POST Handler (Strict State Mutation)
  // ---------------------------------------------------------------------------

  function handlePost(e) {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = (params.action || '').trim().toLowerCase();
    var token = (params.token || '').trim();
    var rejectionReason = (params.rejectionReason || '').trim();

    // 1. Verify Active Google User
    var activeEmail = Session.getActiveUser().getEmail();
    if (!activeEmail) {
      return renderHtmlMessage('Authentication Required', 'Active user identity cannot be determined. Submission rejected.', false);
    }

    var expectedAdminEmail = getAdminEmail();
    if (activeEmail.toLowerCase() !== expectedAdminEmail) {
      return renderHtmlMessage('Unauthorized Account', 'Active user (' + activeEmail + ') is not authorized to submit decisions.', false);
    }

    // 2. Validate Action Token
    var hmacSecret = getHmacSecret();
    var tokenValidation = verifyActionToken(token, action, hmacSecret);
    if (!tokenValidation.valid) {
      return renderHtmlMessage('Action Token Invalid', tokenValidation.error, false);
    }

    // Security Invariant: Extract verified applicant UID and action directly from the token payload
    var targetUid = tokenValidation.payload.uid;
    var targetAction = tokenValidation.payload.action;

    // 3. Verify Administrator Credentials in /admins/{ADMIN_UID}
    var adminUid = getAdminUid();
    var adminDoc;
    try {
      adminDoc = FirestoreClient.getAdminRecord(adminUid);
    } catch (adminErr) {
      return renderHtmlMessage('Admin Verification Failed', 'Unable to read administrator record: ' + adminErr.message, false);
    }

    if (!adminDoc || !adminDoc.email || adminDoc.email.toLowerCase() !== activeEmail.toLowerCase()) {
      return renderHtmlMessage(
        'Administrator Privilege Failure',
        'Your authenticated identity (' + activeEmail + ') does not match the active administrator record for UID ' + adminUid + '.',
        false
      );
    }

    // 4. Retrieve Current Applicant Profile and Re-check Pending State
    var profile;
    try {
      profile = FirestoreClient.getUserProfile(targetUid);
    } catch (profileErr) {
      return renderHtmlMessage('Profile Read Error', 'Unable to read applicant profile: ' + profileErr.message, false);
    }

    if (!profile) {
      return renderHtmlMessage('Applicant Missing', 'Applicant record does not exist.', false);
    }

    if (profile.approvalStatus !== 'pending') {
      return renderHtmlMessage(
        'Concurrent Mutation Blocked',
        'This application is no longer in pending status (Current: ' + profile.approvalStatus.toUpperCase() + '). Repeated action blocked.',
        false
      );
    }

    // 5. Construct and Execute Mutation
    var now = new Date();
    var nowIso = now.toISOString();
    var updatePayload = {};

    if (targetAction === 'approve') {
      updatePayload = {
        approvalStatus: 'approved',
        approvedBy: adminUid,
        approvedAt: now,
        rejectionReason: null,
        updatedAt: now
      };
    } else if (targetAction === 'reject') {
      if (rejectionReason.length > 500) {
        rejectionReason = rejectionReason.substring(0, 500);
      }
      updatePayload = {
        approvalStatus: 'rejected',
        approvedBy: adminUid,
        approvedAt: null,
        rejectionReason: rejectionReason || 'Application declined by department administration.',
        updatedAt: now
      };
    } else {
      return renderHtmlMessage('Unknown Action', 'Unrecognized action: ' + targetAction, false);
    }

    try {
      FirestoreClient.updateUserApproval(targetUid, updatePayload);
    } catch (mutationErr) {
      return renderHtmlMessage('Database Update Error', 'Failed to update applicant profile: ' + mutationErr.message, false);
    }

    var applicantName = profile.displayName || targetUid;
    var resultTitle = targetAction === 'approve' ? 'Applicant Approved' : 'Applicant Declined';
    var resultMsg = targetAction === 'approve'
      ? 'Scholar profile for "' + applicantName + '" has been approved. The user now has full access to CSE Research Hub discovery features.'
      : 'Scholar profile for "' + applicantName + '" has been marked as rejected with reason: "' + updatePayload.rejectionReason + '".';

    return renderHtmlMessage(resultTitle, resultMsg, true, 'Decision Recorded: ' + nowIso + '\nReviewer: ' + activeEmail + ' (' + adminUid + ')');
  }

  return {
    generateActionToken: generateActionToken,
    verifyActionToken: verifyActionToken,
    handleGet: handleGet,
    handlePost: handlePost
  };
})();

