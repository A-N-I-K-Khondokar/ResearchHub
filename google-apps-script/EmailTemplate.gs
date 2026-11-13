/**
 * CSE Research Hub — Email Template Service
 *
 * Generates scholarly, responsive HTML and plain-text notification emails
 * with cryptographic action buttons for administrator account approval.
 */

var EmailTemplate = (function () {
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDisplayDate(dateInput) {
    if (!dateInput) return 'Recently';
    try {
      var d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
      if (isNaN(d.getTime())) return String(dateInput);
      return Utilities.formatDate(d, 'Asia/Dhaka', 'dd MMM yyyy, hh:mm a (z)');
    } catch (e) {
      return String(dateInput);
    }
  }

  /**
   * Builds the approval notification email for a queued applicant.
   *
   * @param {Object} applicant - Flattened applicant outbox document
   * @param {string} approveUrl - Full signed approval Web App URL
   * @param {string} rejectUrl - Full signed rejection Web App URL
   * @returns {Object} { subject, htmlBody, plainTextBody }
   */
  function buildApprovalNotificationEmail(applicant, approveUrl, rejectUrl) {
    var name = escapeHtml(applicant.displayName || 'Unknown Applicant');
    var email = escapeHtml(applicant.userEmail || 'No email');
    var department = escapeHtml(applicant.department || 'Computer Science and Engineering');
    var designation = escapeHtml(applicant.designation || 'Scholar');
    var program = escapeHtml(applicant.program || 'Not specified');
    var batch = escapeHtml(applicant.batch || 'Not specified');
    var submittedAt = formatDisplayDate(applicant.createdAt);

    var rawInterests = applicant.researchInterests || [];
    var interestsHtml = '';
    var interestsPlain = '';
    if (Array.isArray(rawInterests) && rawInterests.length > 0) {
      var pills = [];
      for (var i = 0; i < rawInterests.length; i++) {
        var tag = escapeHtml(String(rawInterests[i]).trim());
        if (tag) {
          pills.push(
            '<span style="display:inline-block;background-color:#EBF2FF;color:#1B5ECC;border-radius:9999px;' +
            'padding:4px 10px;font-size:12px;font-weight:600;margin:2px 4px 2px 0;">' + tag + '</span>'
          );
        }
      }
      interestsHtml = pills.join(' ');
      interestsPlain = rawInterests.join(', ');
    } else {
      interestsHtml = '<span style="color:#64748B;font-style:italic;">None listed</span>';
      interestsPlain = 'None listed';
    }

    var subject = 'New Account Approval Request — CSE Research Hub';

    var htmlBody =
      '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>' + subject + '</title>' +
      '</head>' +
      '<body style="margin:0;padding:24px;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">' +
      '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">' +
      
      // Header
      '<tr>' +
      '<td style="background-color:#1E293B;padding:24px 32px;color:#FFFFFF;">' +
      '<div style="font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#94A3B8;margin-bottom:4px;">CSE Research Hub</div>' +
      '<h1 style="margin:0;font-size:20px;font-weight:700;color:#FFFFFF;line-height:26px;">Applicant Profile Review</h1>' +
      '</td>' +
      '</tr>' +

      // Intro
      '<tr>' +
      '<td style="padding:28px 32px 16px 32px;">' +
      '<p style="margin:0 0 16px 0;font-size:15px;line-height:22px;color:#334155;">' +
      'A new verified applicant has completed onboarding profile setup and is awaiting administrative approval before accessing academic discovery and publication workflows.' +
      '</p>' +
      '</td>' +
      '</tr>' +

      // Details Card
      '<tr>' +
      '<td style="padding:0 32px 24px 32px;">' +
      '<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F1F5F9;border-radius:8px;padding:16px 20px;">' +
      '<tr><td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;font-weight:600;">Full Name:</td><td style="padding:6px 0;font-size:14px;color:#0F172A;font-weight:700;">' + name + '</td></tr>' +
      '<tr><td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Verified Email:</td><td style="padding:6px 0;font-size:14px;color:#0F172A;">' + email + '</td></tr>' +
      '<tr><td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Department:</td><td style="padding:6px 0;font-size:14px;color:#0F172A;">' + department + '</td></tr>' +
      '<tr><td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Designation:</td><td style="padding:6px 0;font-size:14px;color:#0F172A;">' + designation + '</td></tr>' +
      '<tr><td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Program:</td><td style="padding:6px 0;font-size:14px;color:#0F172A;">' + program + '</td></tr>' +
      '<tr><td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Cohort / Batch:</td><td style="padding:6px 0;font-size:14px;color:#0F172A;">' + batch + '</td></tr>' +
      '<tr><td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Submitted:</td><td style="padding:6px 0;font-size:13px;color:#475569;">' + submittedAt + '</td></tr>' +
      '<tr><td style="padding:8px 0 4px 0;font-size:13px;color:#64748B;font-weight:600;vertical-align:top;">Research Fields:</td><td style="padding:8px 0 4px 0;font-size:14px;color:#0F172A;">' + interestsHtml + '</td></tr>' +
      '</table>' +
      '</td>' +
      '</tr>' +

      // Action Buttons
      '<tr>' +
      '<td style="padding:0 32px 28px 32px;">' +
      '<table width="100%" border="0" cellspacing="0" cellpadding="0">' +
      '<tr>' +
      '<td align="center" style="padding-right:8px;">' +
      '<a href="' + approveUrl + '" target="_blank" style="display:inline-block;width:100%;box-sizing:border-box;background-color:#16A34A;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:12px 24px;border-radius:8px;text-align:center;">Approve Application &rarr;</a>' +
      '</td>' +
      '<td align="center" style="padding-left:8px;">' +
      '<a href="' + rejectUrl + '" target="_blank" style="display:inline-block;width:100%;box-sizing:border-box;background-color:#FFFFFF;border:1px solid #DC2626;color:#DC2626;text-decoration:none;font-size:14px;font-weight:600;padding:11px 24px;border-radius:8px;text-align:center;">Decline Application</a>' +
      '</td>' +
      '</tr>' +
      '</table>' +
      '</td>' +
      '</tr>' +

      // Footer
      '<tr>' +
      '<td style="background-color:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;font-size:12px;color:#64748B;line-height:18px;">' +
      '<p style="margin:0 0 6px 0;"><strong>Security & Identity Notice:</strong></p>' +
      '<p style="margin:0 0 6px 0;">Action links are cryptographically signed with HMAC-SHA256, expire in <strong>48 hours</strong>, and strictly require signing in as <strong>anik.khondokar09@gmail.com</strong>.</p>' +
      '<p style="margin:0;color:#94A3B8;">CSE Research Hub &bull; Spark Architecture Automation &bull; Automated Dispatch</p>' +
      '</td>' +
      '</tr>' +

      '</table>' +
      '</body>' +
      '</html>';

    var plainTextBody =
      'NEW ACCOUNT APPROVAL REQUEST — CSE RESEARCH HUB\n\n' +
      'A new verified applicant has registered and is awaiting administrator review.\n\n' +
      'APPLICANT DETAILS:\n' +
      '--------------------------------------------------\n' +
      'Name:              ' + applicant.displayName + '\n' +
      'Email:             ' + applicant.userEmail + '\n' +
      'Department:        ' + applicant.department + '\n' +
      'Designation:       ' + applicant.designation + '\n' +
      'Program:           ' + (applicant.program || 'Not specified') + '\n' +
      'Batch:             ' + (applicant.batch || 'Not specified') + '\n' +
      'Research Fields:   ' + interestsPlain + '\n' +
      'Submission Time:   ' + submittedAt + '\n\n' +
      'ACTIONS (Requires sign-in as anik.khondokar09@gmail.com, valid 48h):\n\n' +
      'APPROVE APPLICATION:\n' +
      approveUrl + '\n\n' +
      'DECLINE APPLICATION:\n' +
      rejectUrl + '\n\n' +
      '---\n' +
      'CSE Research Hub Notification System';

    return {
      subject: subject,
      htmlBody: htmlBody,
      plainTextBody: plainTextBody
    };
  }

  return {
    escapeHtml: escapeHtml,
    formatDisplayDate: formatDisplayDate,
    buildApprovalNotificationEmail: buildApprovalNotificationEmail
  };
})();

