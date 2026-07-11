/* NavConfig — single source of truth for every role's sidebar. Used by ui-common.js's
   renderSidebar() so every page (not just the two originally-buggy ones) gets correct,
   contextual navigation for whoever is actually logged in. */
(function (global) {
  var NAV = {
    BI: {
      label: 'Branch Initiator',
      links: [
        { href: 'branch-initiator-dashboard.html', icon: '📊', text: 'Dashboard' },
        { href: 'bi-my-cases.html', icon: '📁', text: 'My Cases' },
        { href: 'bi-create-application.html', icon: '➕', text: 'Create Application' },
        { href: 'bi-security-selection.html', icon: '💎', text: 'Security Selection' },
        { href: 'bi-document-upload.html', icon: '📤', text: 'Document Upload' },
        { href: 'bi-guarantor.html', icon: '👤', text: 'Guarantor Mgmt' },
        { href: 'bi-cibil.html', icon: '📊', text: 'CIBIL Check' },
        { href: 'bi-scorecard.html', icon: '📋', text: 'Scorecard' },
        { href: 'reports.html', icon: '📈', text: 'Reports' }
      ]
    },
    BS: {
      label: 'Branch Scrutinizer',
      links: [
        { href: 'branch-scrutinizer-dashboard.html', icon: '📊', text: 'Dashboard' },
        { href: 'bs-verification-queue.html', icon: '🔍', text: 'Verification Queue' },
        { href: 'bs-discrepancy.html', icon: '⚠️', text: 'Discrepancy Mgmt' },
        { href: 'bs-dispatch.html', icon: '📦', text: 'Dispatch' },
        { href: 'bs-courier-tracking.html', icon: '🚚', text: 'Courier Tracking' },
        { href: 'reports.html', icon: '📈', text: 'Reports' }
      ]
    },
    HUB: {
      label: 'Hub Controller',
      links: [
        { href: 'credit-hub-dashboard.html', icon: '🏦', text: 'Dashboard' },
        { href: 'ch-inward.html', icon: '📥', text: 'Inward' },
        { href: 'ch-doc-verification.html', icon: '📋', text: 'Doc Verification' },
        { href: 'ch-security-assessment.html', icon: '💎', text: 'Security Assessment' },
        { href: 'ch-fi-assignment.html', icon: '📍', text: 'FI Assignment' },
        { href: 'reports.html', icon: '📈', text: 'Reports' }
      ]
    },
    FI: {
      label: 'Field Investigator',
      links: [
        { href: 'field-investigator-mobile.html', icon: '📱', text: 'My Dashboard' },
        { href: 'fi-assigned-cases.html', icon: '📍', text: 'Assigned Cases' },
        { href: 'reports.html', icon: '📈', text: 'Reports' }
      ]
    },
    FC: {
      label: 'Credit Final Checker',
      links: [
        { href: 'credit-final-checker.html', icon: '✔️', text: 'Dashboard' },
        { href: 'fc-verification-queue.html', icon: '📋', text: 'Verification Queue' },
        { href: 'reports.html', icon: '📈', text: 'Reports' }
      ]
    },
    DEV: {
      label: 'Deviation Authority',
      links: [
        { href: 'deviation-authority.html', icon: '⚡', text: 'Deviation Queue' },
        { href: 'reports.html', icon: '📈', text: 'Reports' }
      ]
    },
    RA: {
      label: 'Recommending Authority',
      links: [
        { href: 'recommending-authority.html', icon: '📋', text: 'Review Queue' },
        { href: 'reports.html', icon: '📈', text: 'Reports' }
      ]
    },
    CH: {
      label: 'Credit Head',
      links: [
        { href: 'credit-head.html', icon: '💼', text: 'Approval Queue' },
        { href: 'reports.html', icon: '📈', text: 'Reports' }
      ]
    },
    FA: {
      label: 'Final Approval Authority',
      links: [
        { href: 'final-approval.html', icon: '🏅', text: 'Final Approval Queue' },
        { href: 'reports.html', icon: '📈', text: 'Reports' }
      ]
    },
    BA: {
      label: 'Business Approver',
      links: [
        { href: 'business-approval.html', icon: '📊', text: 'Business Approval Queue' },
        { href: 'reports.html', icon: '📈', text: 'Reports' }
      ]
    },
    DISB: {
      label: 'Disbursement Team',
      links: [
        { href: 'disbursement.html', icon: '💸', text: 'Disbursement Queue' },
        { href: 'reports.html', icon: '📈', text: 'Reports' }
      ]
    },
    ADMIN: {
      label: 'System Admin',
      links: [
        { href: 'admin-dashboard.html', icon: '📊', text: 'Dashboard' },
        { href: 'admin-users.html', icon: '👥', text: 'User Management' },
        { href: 'admin-roles.html', icon: '🛡️', text: 'Role Management' },
        { href: 'admin-permissions.html', icon: '🔐', text: 'Permission Matrix' },
        { href: 'admin-branches.html', icon: '🏢', text: 'Branch Master' },
        { href: 'admin-credit-hubs.html', icon: '🏦', text: 'Credit Hub Master' },
        { href: 'admin-security-master.html', icon: '💎', text: 'Security Master' },
        { href: 'admin-document-master.html', icon: '📋', text: 'Document Master' },
        { href: 'admin-approval-matrix.html', icon: '✅', text: 'Approval Matrix' },
        { href: 'admin-deviation-matrix.html', icon: '⚡', text: 'Deviation Matrix' },
        { href: 'admin-workflow-config.html', icon: '⚙️', text: 'Workflow Config' },
        { href: 'admin-audit-logs.html', icon: '📜', text: 'Audit Logs' },
        { href: 'reports.html', icon: '📈', text: 'Reports' },
        { href: 'admin-settings.html', icon: '🔧', text: 'Settings' }
      ]
    }
  };

  global.NavConfig = NAV;
})(window);
