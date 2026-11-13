/**
 * CSE Research Hub — Firebase Authentication Service for Notification Bot
 *
 * Handles bot authentication bootstrap and ID token lifecycle using the
 * Firebase Authentication REST API and Google Secure Token API.
 * Operates on the Firebase Spark (free) plan without administrative SDKs.
 */

var FirebaseAuth = (function () {
  var AUTH_SIGN_IN_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';
  var TOKEN_REFRESH_URL = 'https://securetoken.googleapis.com/v1/token';
  var CACHE_KEY_ID_TOKEN = 'BOT_ID_TOKEN';

  /**
   * One-time bootstrap to sign in the bot account using a temporary password,
   * capture its long-lived refresh token, verify its UID against configuration,
   * and delete the temporary password from Script Properties.
   *
   * @param {string} tempPassword - The initial bot account password
   * @returns {string} Success message with verified bot UID (credentials omitted)
   */
  function bootstrapBotAuthentication(tempPassword) {
    var props = PropertiesService.getScriptProperties();
    var apiKey = props.getProperty('FIREBASE_API_KEY');
    var botEmail = props.getProperty('BOT_EMAIL');
    var expectedBotUid = props.getProperty('BOT_UID');

    if (!apiKey) {
      throw new Error('[FirebaseAuth] Missing required Script Property: FIREBASE_API_KEY');
    }
    if (!botEmail) {
      throw new Error('[FirebaseAuth] Missing required Script Property: BOT_EMAIL');
    }
    if (!expectedBotUid) {
      throw new Error('[FirebaseAuth] Missing required Script Property: BOT_UID');
    }

    var passwordToUse = tempPassword || props.getProperty('TEMP_BOT_PASSWORD');
    if (!passwordToUse) {
      throw new Error('[FirebaseAuth] Temporary password must be passed or configured in TEMP_BOT_PASSWORD');
    }

    var url = AUTH_SIGN_IN_URL + '?key=' + encodeURIComponent(apiKey);
    var payload = {
      email: botEmail,
      password: passwordToUse,
      returnSecureToken: true
    };

    var response;
    try {
      response = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
    } catch (fetchErr) {
      throw new Error('[FirebaseAuth] Network error contacting Firebase Auth: ' + fetchErr.message);
    }

    var status = response.getResponseCode();
    var responseText = response.getContentText();
    var data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      throw new Error('[FirebaseAuth] Invalid JSON response from Firebase Auth (HTTP ' + status + ')');
    }

    if (status !== 200 || !data.refreshToken) {
      var errMsg = (data.error && data.error.message) ? data.error.message : 'HTTP ' + status;
      throw new Error('[FirebaseAuth] Bot sign-in failed: ' + errMsg);
    }

    // Strict identity verification: Ensure signed-in account UID matches configured bot UID
    if (data.localId !== expectedBotUid) {
      throw new Error(
        '[FirebaseAuth] Bot UID mismatch! Signed-in UID does not match configured BOT_UID. ' +
        'Expected: ' + expectedBotUid + ', Got: ' + data.localId
      );
    }

    // Securely store the refresh token
    props.setProperty('BOT_REFRESH_TOKEN', data.refreshToken);

    // Clean up temporary password property if it was stored
    props.deleteProperty('TEMP_BOT_PASSWORD');

    // Cache the initial ID token
    if (data.idToken && data.expiresIn) {
      var ttl = Math.max(60, Number(data.expiresIn) - 300);
      try {
        CacheService.getScriptCache().put(CACHE_KEY_ID_TOKEN, data.idToken, ttl);
      } catch (cacheErr) {
        // Non-fatal if cache fails
      }
    }

    Logger.log('[FirebaseAuth] Bot authentication bootstrap successful. Refresh token secured for UID: ' + data.localId);
    return 'Bootstrap successful for Bot UID: ' + data.localId;
  }

  /**
   * Retrieves a valid Firebase Authentication ID token for the bot account.
   * Uses CacheService when available; automatically refreshes using the
   * stored refresh token when the cached token has expired.
   *
   * @returns {string} Valid Firebase ID token
   */
  function getBotIdToken() {
    var cache = CacheService.getScriptCache();
    var cachedToken = cache.get(CACHE_KEY_ID_TOKEN);
    if (cachedToken) {
      return cachedToken;
    }

    var props = PropertiesService.getScriptProperties();
    var apiKey = props.getProperty('FIREBASE_API_KEY');
    var refreshToken = props.getProperty('BOT_REFRESH_TOKEN');

    if (!apiKey) {
      throw new Error('[FirebaseAuth] Missing required Script Property: FIREBASE_API_KEY');
    }
    if (!refreshToken) {
      throw new Error(
        '[FirebaseAuth] Missing BOT_REFRESH_TOKEN. Run bootstrapBotAuthentication() once to initialize.'
      );
    }

    var url = TOKEN_REFRESH_URL + '?key=' + encodeURIComponent(apiKey);
    var payload = 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(refreshToken);

    var response;
    try {
      response = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/x-www-form-urlencoded',
        payload: payload,
        muteHttpExceptions: true
      });
    } catch (fetchErr) {
      throw new Error('[FirebaseAuth] Network error refreshing bot token: ' + fetchErr.message);
    }

    var status = response.getResponseCode();
    var responseText = response.getContentText();
    var data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      throw new Error('[FirebaseAuth] Invalid JSON from Secure Token API (HTTP ' + status + ')');
    }

    if (status !== 200 || !data.id_token) {
      var errMsg = (data.error && data.error.message) ? data.error.message : 'HTTP ' + status;
      throw new Error('[FirebaseAuth] Token refresh failed: ' + errMsg);
    }

    // Cache refreshed token (usually valid for 3600 seconds)
    var expiresIn = Number(data.expires_in) || 3600;
    var ttl = Math.max(60, expiresIn - 300);
    try {
      cache.put(CACHE_KEY_ID_TOKEN, data.id_token, ttl);
    } catch (cacheErr) {
      // Non-fatal if cache fails
    }

    return data.id_token;
  }

  /**
   * Clears the cached ID token. Call when a 401 Unauthorized response is
   * received to force a fresh token exchange on the next request.
   */
  function clearBotTokenCache() {
    try {
      CacheService.getScriptCache().remove(CACHE_KEY_ID_TOKEN);
    } catch (err) {
      // Ignore
    }
  }

  return {
    bootstrapBotAuthentication: bootstrapBotAuthentication,
    getBotIdToken: getBotIdToken,
    clearBotTokenCache: clearBotTokenCache
  };
})();

