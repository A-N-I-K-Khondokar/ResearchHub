/**
 * CSE Research Hub — Firestore REST API Client
 *
 * Implements lightweight REST operations for Cloud Firestore without
 * external SDK dependencies, operating strictly on the Firebase Spark (free) plan.
 *
 * Supports two distinct authorization boundaries:
 * 1. Bot Token: Authenticates via Firebase ID token for outbox queue processing
 *    under deployed Firestore Security Rules (`isNotificationService()`).
 * 2. Admin OAuth Token: Authenticates via ScriptApp.getOAuthToken() for the
 *    administrator approval Web App under Google Cloud IAM.
 */

var FirestoreClient = (function () {
  var FIRESTORE_BASE_URL = 'https://firestore.googleapis.com/v1/projects';

  function getProjectId() {
    var projectId = PropertiesService.getScriptProperties().getProperty('FIREBASE_PROJECT_ID');
    if (!projectId) {
      throw new Error('[FirestoreClient] Missing required Script Property: FIREBASE_PROJECT_ID');
    }
    return projectId;
  }

  function getDocumentsUrl() {
    return FIRESTORE_BASE_URL + '/' + encodeURIComponent(getProjectId()) + '/databases/(default)/documents';
  }

  // ---------------------------------------------------------------------------
  // Firestore REST Value Converters
  // ---------------------------------------------------------------------------

  /**
   * Converts a native JavaScript value into a Firestore REST Value object.
   * Accurately distinguishes timestamps (Date or ISO-8601 UTC strings) so that
   * Firestore Security Rules 'is timestamp' checks succeed.
   *
   * @param {*} val - Value to convert
   * @returns {Object} Firestore typed value object
   */
  function toFirestoreValue(val) {
    if (val === null || val === undefined) {
      return { nullValue: null };
    }
    if (typeof val === 'boolean') {
      return { booleanValue: val };
    }
    if (typeof val === 'number') {
      if (Math.floor(val) === val) {
        return { integerValue: String(val) };
      }
      return { doubleValue: val };
    }
    if (val instanceof Date) {
      return { timestampValue: val.toISOString() };
    }
    if (typeof val === 'string') {
      // Check for strict ISO-8601 UTC timestamp format (e.g. 2026-11-13T05:27:33.978Z)
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(val)) {
        var parsed = Date.parse(val);
        if (!isNaN(parsed)) {
          return { timestampValue: val };
        }
      }
      return { stringValue: val };
    }
    if (Array.isArray(val)) {
      var arrValues = [];
      for (var i = 0; i < val.length; i++) {
        arrValues.push(toFirestoreValue(val[i]));
      }
      return { arrayValue: { values: arrValues } };
    }
    if (typeof val === 'object') {
      var mapFields = {};
      var keys = Object.keys(val);
      for (var k = 0; k < keys.length; k++) {
        mapFields[keys[k]] = toFirestoreValue(val[keys[k]]);
      }
      return { mapValue: { fields: mapFields } };
    }
    return { stringValue: String(val) };
  }

  /**
   * Converts a Firestore REST Value object into a native JavaScript value.
   *
   * @param {Object} valObj - Firestore typed value object
   * @returns {*} Native JavaScript value
   */
  function fromFirestoreValue(valObj) {
    if (!valObj) {
      return null;
    }
    if (valObj.hasOwnProperty('stringValue')) {
      return valObj.stringValue;
    }
    if (valObj.hasOwnProperty('integerValue')) {
      return parseInt(valObj.integerValue, 10);
    }
    if (valObj.hasOwnProperty('doubleValue')) {
      return parseFloat(valObj.doubleValue);
    }
    if (valObj.hasOwnProperty('booleanValue')) {
      return valObj.booleanValue;
    }
    if (valObj.hasOwnProperty('nullValue')) {
      return null;
    }
    if (valObj.hasOwnProperty('timestampValue')) {
      return valObj.timestampValue;
    }
    if (valObj.hasOwnProperty('arrayValue')) {
      var list = [];
      var items = (valObj.arrayValue && valObj.arrayValue.values) ? valObj.arrayValue.values : [];
      for (var i = 0; i < items.length; i++) {
        list.push(fromFirestoreValue(items[i]));
      }
      return list;
    }
    if (valObj.hasOwnProperty('mapValue')) {
      var result = {};
      var fields = (valObj.mapValue && valObj.mapValue.fields) ? valObj.mapValue.fields : {};
      var keys = Object.keys(fields);
      for (var k = 0; k < keys.length; k++) {
        result[keys[k]] = fromFirestoreValue(fields[keys[k]]);
      }
      return result;
    }
    return null;
  }

  /**
   * Converts a standard JS object into Firestore REST `fields` mapping.
   *
   * @param {Object} obj
   * @returns {Object} Object with `fields` property
   */
  function toFirestoreFields(obj) {
    var fields = {};
    var keys = Object.keys(obj || {});
    for (var i = 0; i < keys.length; i++) {
      fields[keys[i]] = toFirestoreValue(obj[keys[i]]);
    }
    return { fields: fields };
  }

  /**
   * Flattens a raw Firestore document response into a clean JavaScript object.
   *
   * @param {Object} doc - Raw Firestore document
   * @returns {Object} Flattened document with extracted document ID
   */
  function fromFirestoreDoc(doc) {
    if (!doc || !doc.name) {
      return null;
    }
    var parts = doc.name.split('/');
    var docId = parts[parts.length - 1];
    var out = {
      _docId: docId,
      _name: doc.name,
      _createTime: doc.createTime,
      _updateTime: doc.updateTime
    };

    var fields = doc.fields || {};
    var keys = Object.keys(fields);
    for (var i = 0; i < keys.length; i++) {
      out[keys[i]] = fromFirestoreValue(fields[keys[i]]);
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Notification Outbox Operations (Bot Token)
  // ---------------------------------------------------------------------------

  /**
   * Queries queued notifications from `/admin_email_outbox` using Firestore runQuery.
   *
   * @param {string} botIdToken - Verified Firebase ID token for the bot
   * @param {number} limit - Maximum number of queued records to return (up to 10)
   * @returns {Array<Object>} List of flattened outbox documents
   */
  function queryQueuedOutbox(botIdToken, limit) {
    var maxItems = Math.min(Math.max(1, limit || 10), 10);
    var url = getDocumentsUrl() + ':runQuery';

    var queryPayload = {
      structuredQuery: {
        from: [{ collectionId: 'admin_email_outbox' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'deliveryStatus' },
            op: 'EQUAL',
            value: { stringValue: 'queued' }
          }
        },
        limit: maxItems
      }
    };

    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + botIdToken
      },
      payload: JSON.stringify(queryPayload),
      muteHttpExceptions: true
    });

    var status = response.getResponseCode();
    if (status === 401) {
      FirebaseAuth.clearBotTokenCache();
      throw new Error('[FirestoreClient] 401 Unauthorized reading outbox queue. Token cache invalidated.');
    }
    if (status !== 200) {
      throw new Error('[FirestoreClient] Failed to query outbox queue: HTTP ' + status + ' - ' + response.getContentText());
    }

    var results = JSON.parse(response.getContentText());
    var documents = [];
    for (var i = 0; i < results.length; i++) {
      if (results[i].document) {
        documents.push(fromFirestoreDoc(results[i].document));
      }
    }
    return documents;
  }

  /**
   * Queries in-progress notifications with 'sending' status from /admin_email_outbox.
   * Used exclusively for stale-worker recovery after unexpected timeouts or crashes.
   *
   * @param {string} botIdToken - Verified Firebase ID token for the bot
   * @param {number} limit - Maximum number of records to return
   * @returns {Array<Object>} List of flattened outbox documents
   */
  function querySendingOutbox(botIdToken, limit) {
    var maxItems = Math.min(Math.max(1, limit || 10), 10);
    var url = getDocumentsUrl() + ':runQuery';

    var queryPayload = {
      structuredQuery: {
        from: [{ collectionId: 'admin_email_outbox' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'deliveryStatus' },
            op: 'EQUAL',
            value: { stringValue: 'sending' }
          }
        },
        limit: maxItems
      }
    };

    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + botIdToken
      },
      payload: JSON.stringify(queryPayload),
      muteHttpExceptions: true
    });

    var status = response.getResponseCode();
    if (status === 401) {
      FirebaseAuth.clearBotTokenCache();
      throw new Error('[FirestoreClient] 401 Unauthorized reading sending queue. Token cache invalidated.');
    }
    if (status !== 200) {
      throw new Error('[FirestoreClient] Failed to query sending queue: HTTP ' + status + ' - ' + response.getContentText());
    }

    var results = JSON.parse(response.getContentText());
    var documents = [];
    for (var i = 0; i < results.length; i++) {
      if (results[i].document) {
        documents.push(fromFirestoreDoc(results[i].document));
      }
    }
    return documents;
  }

  /**
   * Updates delivery status and metadata for an outbox document using an explicit updateMask.
   * Strict adherence to firestore.rules positive allowlist:
   * ['deliveryStatus', 'sentAt', 'attemptCount', 'lastAttemptAt', 'lastError']
   *
   * @param {string} botIdToken - Verified Firebase ID token for the bot
   * @param {string} uid - Target applicant UID / document ID
   * @param {Object} updateFields - Key-value map of fields to update
   */
  function updateOutboxDelivery(botIdToken, uid, updateFields) {
    var allowedKeys = ['deliveryStatus', 'sentAt', 'attemptCount', 'lastAttemptAt', 'lastError'];
    var keys = Object.keys(updateFields);
    var maskParams = [];
    var fieldsToUpdate = {};

    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (allowedKeys.indexOf(k) === -1) {
        throw new Error('[FirestoreClient] Disallowed outbox update field: ' + k);
      }
      maskParams.push('updateMask.fieldPaths=' + encodeURIComponent(k));
      fieldsToUpdate[k] = updateFields[k];
    }

    var url = getDocumentsUrl() + '/admin_email_outbox/' + encodeURIComponent(uid) + '?' + maskParams.join('&');
    var payload = toFirestoreFields(fieldsToUpdate);

    var response = UrlFetchApp.fetch(url, {
      method: 'patch',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + botIdToken
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var status = response.getResponseCode();
    if (status === 401) {
      FirebaseAuth.clearBotTokenCache();
      throw new Error('[FirestoreClient] 401 Unauthorized updating outbox. Token cache invalidated.');
    }
    if (status !== 200) {
      throw new Error('[FirestoreClient] Failed to update outbox for ' + uid + ': HTTP ' + status + ' - ' + response.getContentText());
    }

    return fromFirestoreDoc(JSON.parse(response.getContentText()));
  }

  // ---------------------------------------------------------------------------
  // Administrator Approval Operations (Admin OAuth Token)
  // ---------------------------------------------------------------------------

  /**
   * Retrieves an applicant user profile from `/users/{uid}`.
   *
   * @param {string} authToken - Admin OAuth access token
   * @param {string} uid - Applicant Firebase UID
   * @returns {Object|null} Flattened profile object or null if not found
   */
  function getUserProfile(authToken, uid) {
    var url = getDocumentsUrl() + '/users/' + encodeURIComponent(uid);

    var response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Authorization: 'Bearer ' + authToken
      },
      muteHttpExceptions: true
    });

    var status = response.getResponseCode();
    if (status === 404) {
      return null;
    }
    if (status !== 200) {
      throw new Error('[FirestoreClient] Failed to get user profile: HTTP ' + status + ' - ' + response.getContentText());
    }

    return fromFirestoreDoc(JSON.parse(response.getContentText()));
  }

  /**
   * Retrieves the administrator record from `/admins/{adminUid}`.
   *
   * @param {string} authToken - Admin OAuth access token
   * @param {string} adminUid - Administrator Firebase UID
   * @returns {Object|null} Flattened admin record or null if not found
   */
  function getAdminRecord(authToken, adminUid) {
    var url = getDocumentsUrl() + '/admins/' + encodeURIComponent(adminUid);

    var response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Authorization: 'Bearer ' + authToken
      },
      muteHttpExceptions: true
    });

    var status = response.getResponseCode();
    if (status === 404) {
      return null;
    }
    if (status !== 200) {
      throw new Error('[FirestoreClient] Failed to get admin record: HTTP ' + status + ' - ' + response.getContentText());
    }

    return fromFirestoreDoc(JSON.parse(response.getContentText()));
  }

  /**
   * Mutates an applicant's approval status in `/users/{uid}` via positive allowlist.
   * Restricted strictly to:
   * ['approvalStatus', 'approvedBy', 'approvedAt', 'rejectionReason', 'updatedAt']
   *
   * @param {string} adminOAuthToken - Authenticated admin OAuth token
   * @param {string} uid - Applicant Firebase UID
   * @param {Object} approvalData - Fields to update
   */
  function updateUserApproval(adminOAuthToken, uid, approvalData) {
    var allowedFields = ['approvalStatus', 'approvedBy', 'approvedAt', 'rejectionReason', 'updatedAt'];
    var maskParams = [];
    var fieldsToUpdate = {};

    var keys = Object.keys(approvalData);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (allowedFields.indexOf(k) === -1) {
        throw new Error('[FirestoreClient] Disallowed approval mutation field: ' + k);
      }
      maskParams.push('updateMask.fieldPaths=' + encodeURIComponent(k));
      fieldsToUpdate[k] = approvalData[k];
    }

    var url = getDocumentsUrl() + '/users/' + encodeURIComponent(uid) + '?' + maskParams.join('&');
    var payload = toFirestoreFields(fieldsToUpdate);

    var response = UrlFetchApp.fetch(url, {
      method: 'patch',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + adminOAuthToken
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var status = response.getResponseCode();
    if (status !== 200) {
      throw new Error('[FirestoreClient] Failed to update user approval: HTTP ' + status + ' - ' + response.getContentText());
    }

    return fromFirestoreDoc(JSON.parse(response.getContentText()));
  }

  return {
    toFirestoreValue: toFirestoreValue,
    fromFirestoreValue: fromFirestoreValue,
    toFirestoreFields: toFirestoreFields,
    fromFirestoreDoc: fromFirestoreDoc,
    queryQueuedOutbox: queryQueuedOutbox,
    querySendingOutbox: querySendingOutbox,
    updateOutboxDelivery: updateOutboxDelivery,
    getUserProfile: getUserProfile,
    getAdminRecord: getAdminRecord,
    updateUserApproval: updateUserApproval
  };
})();

