/* AuditNotify — thin semantic wrapper over LOS_DB's audit/notification collections. */
(function (global) {
  var AuditNotify = {
    logAudit: function (caseId, actorRole, action, detail, oldValue, newValue) {
      return LOS_DB.appendAudit({
        caseId: caseId,
        actorRole: actorRole,
        actorLabel: global.Permissions ? Permissions.roleLabel(actorRole) : actorRole,
        action: action,
        detail: detail || '',
        oldValue: oldValue || null,
        newValue: newValue || null
      });
    },
    pushNotification: function (role, message, caseId) {
      return LOS_DB.appendNotification({ role: role, message: message, caseId: caseId || null });
    }
  };

  global.AuditNotify = AuditNotify;
})(window);
