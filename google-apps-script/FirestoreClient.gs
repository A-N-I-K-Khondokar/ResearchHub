/**
 * CSE Research Hub — Simplified Firestore REST API Client
 *
 * Communicates with Cloud Firestore via Google Apps Script's native OAuth token
 * (ScriptApp.getOAuthToken()). Operates under the administrator's Google account
 * (anik.khondokar09@gmail.com) on the Firebase Spark (free) plan without service accounts.
 *
 * Security Boundaries:
 * - Uses Google Cloud IAM permissions of the administrator account.
 * - Outbox operations are restricted to reading queued documents and patching delivery metadata.
 * - Profile mutations are strictly restricted to the approval fields allowlist.
 * - OAuth tokens are never logged or exposed to client-side code.
 */

var FirestoreClient = (function () {
  var FIRESTORE_BASE_URL = 'https://firestore.googleapis.com/v1';

  function getProjectId() {
    var projectId = PropertiesService.getScriptProperties().getProperty('FIREBASE_PROJECT_ID');
    return projectId || 'cse-research-hub';
  }

  function getDocumentsUrl() {
    return FIRESTORE_BASE_URL + '/projects/' + encodeURIComponent(getProjectId()) + '/databases/(default)/documents';
  }

  // ---------------------------------------------------------------------------
  // Value Serialization & Deserialization
  // ---------------------------------------------------------------------------

  /**
   * Converts a JS value into Firestore REST API value mapping.
   */
  function toFirestoreValue(val) {
    if (val === null || val === undefined) {
      return { nullValue: null };
    }
    if (typeof val === 'string') {
      // Encode ISO-8601 UTC timestamp strings as native Firestore timestampValue
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(val)) {
        return { timestampValue: val };
      }
      return { stringValue: val };
    }
    if (typeof val === 'number') {
      return (val % 1 === 0) ? { integerValue: String(val) } : { doubleValue: val };
    }
    if (typeof val === 'boolean') {
      return { booleanValue: val };
    }
    if (val instanceof Date) {
      return { timestampValue: val.toISOString() };
    }
    if (Array.isArray(val)) {
      var arr = [];
      for (var i = 0; i < val.length; i++) {
        arr.push(toFirestoreValue(val[i]));
      }
      return { arrayValue: { values: arr } };
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
   * Converts a Firestore REST API value object into a standard JS value.
   */
  function fromFirestoreValue(valObj) {
    if (!valObj || typeof valObj !== 'object') return null;
    if (valObj.hasOwnProperty('stringValue')) return valObj.stringValue;
    if (valObj.hasOwnProperty('integerValue')) return parseInt(valObj.integerValue, 10);
    if (valObj.hasOwnProperty('doubleValue')) return parseFloat(valObj.doubleValue);
    if (valObj.hasOwnProperty('booleanValue')) return valObj.booleanValue;
    if (valObj.hasOwnProperty('nullValue')) return null;
    if (valObj.hasOwnProperty('timestampValue')) return valObj.timestampValue;
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
   */
  function fromFirestoreDoc(doc) {
    if (!doc || !doc.name) return null;
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
  // Notification Outbox Operations
  // ---------------------------------------------------------------------------

  /**
   * Queries queued notifications from `/admin_email_outbox` using Firestore runQuery.
   *
   * @param {number} [limit=10] - Maximum number of records to return (capped at 10)
   * @returns {Array<Object>} List of flattened outbox documents
   */
  function queryQueuedOutbox(limit) {
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
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      payload: JSON.stringify(queryPayload),
      muteHttpExceptions: true
    });

    var status = response.getResponseCode();
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
   * Updates delivery status and metadata for an outbox document using an explicit updateMask.
   *
   * @param {string} uid - Target applicant UID / document ID
   * @param {Object} updateFields - Key-value map of fields to update
   */
  function updateOutboxDelivery(uid, updateFields) {
    if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
      throw new Error('[FirestoreClient] Missing or invalid uid for outbox update.');
    }

    var allowedKeys = ['deliveryStatus', 'sentAt', 'lastAttemptAt', 'lastError'];
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

    var url = getDocumentsUrl() + '/admin_email_outbox/' + encodeURIComponent(uid.trim()) + '?' + maskParams.join('&');
    var payload = toFirestoreFields(fieldsToUpdate);

    var response = UrlFetchApp.fetch(url, {
      method: 'patch',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var status = response.getResponseCode();
    if (status !== 200) {
      throw new Error('[FirestoreClient] Failed to update outbox for ' + uid + ': HTTP ' + status + ' - ' + response.getContentText());
    }

    return fromFirestoreDoc(JSON.parse(response.getContentText()));
  }

  // ---------------------------------------------------------------------------
  // Administrator Approval Operations
  // ---------------------------------------------------------------------------

  /**
   * Retrieves an applicant user profile from `/users/{uid}`.
   *
   * @param {string} uid - Applicant Firebase UID
   * @returns {Object|null} Flattened profile object or null if not found
   */
  function getUserProfile(uid) {
    if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
      throw new Error('[FirestoreClient] Missing or invalid uid for user profile lookup.');
    }

    var url = getDocumentsUrl() + '/users/' + encodeURIComponent(uid.trim());
    var response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true
    });

    var status = response.getResponseCode();
    if (status === 404) return null;
    if (status !== 200) {
      throw new Error('[FirestoreClient] Failed to get user profile: HTTP ' + status + ' - ' + response.getContentText());
    }

    return fromFirestoreDoc(JSON.parse(response.getContentText()));
  }

  /**
   * Retrieves the administrator record from `/admins/{adminUid}`.
   *
   * @param {string} adminUid - Administrator Firebase UID
   * @returns {Object|null} Flattened admin record or null if not found
   */
  function getAdminRecord(adminUid) {
    if (!adminUid || typeof adminUid !== 'string' || adminUid.trim().length === 0) {
      throw new Error('[FirestoreClient] Missing or invalid adminUid for admin record lookup.');
    }

    var url = getDocumentsUrl() + '/admins/' + encodeURIComponent(adminUid.trim());
    var response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true
    });

    var status = response.getResponseCode();
    if (status === 404) return null;
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
   * @param {string} uid - Applicant Firebase UID
   * @param {Object} approvalData - Fields to update
   */
  function updateUserApproval(uid, approvalData) {
    if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
      throw new Error('[FirestoreClient] Missing or invalid uid for user approval update.');
    }

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

    var url = getDocumentsUrl() + '/users/' + encodeURIComponent(uid.trim()) + '?' + maskParams.join('&');
    var payload = toFirestoreFields(fieldsToUpdate);

    var response = UrlFetchApp.fetch(url, {
      method: 'patch',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
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
    updateOutboxDelivery: updateOutboxDelivery,
    getUserProfile: getUserProfile,
    getAdminRecord: getAdminRecord,
    updateUserApproval: updateUserApproval
  };
})();
