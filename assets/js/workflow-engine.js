/* WorkflowEngine — canonical status graph + guarded transitions.
   Every real state change in the app goes through WorkflowEngine.transition();
   nothing mutates case.status directly. */
(function (global) {
  var WF = LOS_CONFIG.workflowStates;
  var PC = LOS_CONFIG.productConfig;

  function securityLtvCap(c) {
    if (!c.securities || !c.securities.length) return 1;
    var caps = c.securities.map(function (s) {
      var t = LOS_CONFIG.securityTypes.find(function (x) { return x.type === s.type; });
      return t && t.ltvCap != null ? t.ltvCap : 1;
    });
    return Math.min.apply(null, caps);
  }

  // FRD Section 10 "Key System Validations & Business Rules" - user-facing message per guard
  var GUARD_MESSAGES = {
    documentsComplete: 'Mandatory documents (incl. DPN) are still pending upload — complete the document checklist before submitting.',
    securityCoversLiability: 'Accepted security value is below the Future Liability. Add or increase security before submitting for scrutiny.',
    cibilComplete: 'CIBIL check is mandatory for the subscriber (and any guarantors) before submission.'
  };

  function totalSecurityValue(c) {
    return (c.securities || []).reduce(function (sum, s) { return sum + (s.valueLoaded || 0); }, 0);
  }

  function evaluateGuard(guardName, c, payload) {
    payload = payload || {};
    switch (guardName) {
      case 'documentsComplete':
        return c.documentsComplete !== false;
      case 'securityCoversLiability': {
        var liability = c.fl || c.amount || 0;
        return totalSecurityValue(c) >= liability;
      }
      case 'cibilComplete': {
        if (c.cibil == null) return false;
        var guarantors = c.guarantors || [];
        return guarantors.every(function (g) { return g.creditScore != null; });
      }
      case 'fiRequired':
        return payload.fiRequired != null ? !!payload.fiRequired : (c.amount || 0) >= PC.fiRequiredThreshold;
      case 'fiNotRequired':
        return !evaluateGuard('fiRequired', c, payload);
      case 'fiNegative':
        return (payload.recommendation || (c.fiReport && c.fiReport.recommendation)) === 'NOT_RECOMMEND';
      case 'deviationTriggered':
        return WorkflowEngine.checkDeviations(c).length > 0 || !!payload.deviationTriggered;
      case 'noDeviation':
        return !evaluateGuard('deviationTriggered', c, payload);
      case 'finalApprovalNeeded': {
        var band = LOS_CONFIG.approvalMatrix.find(function (b) { return b.level === 'L4' || b.level === 'L5'; });
        var needsByAmount = (c.amount || 0) >= 10000000;
        var needsByDeviation = (c.deviations || []).length > 0;
        return needsByAmount || needsByDeviation;
      }
      case 'noFinalApprovalNeeded':
        return !evaluateGuard('finalApprovalNeeded', c, payload);
      default:
        return true;
    }
  }

  var WorkflowEngine = {
    getStateInfo: function (code) {
      return WF.states.find(function (s) { return s.code === code; });
    },
    legalActions: function (statusCode, role) {
      var list = (WF.transitions[statusCode] || []).slice();
      WF.universalActions.forEach(function (u) {
        if (!role || u.roles.indexOf(role) !== -1) list.push({ action: u.action, target: u.target, role: role, universal: true });
      });
      return list;
    },
    checkDeviations: function (c) {
      var triggered = [];
      (global.LOS_DB ? LOS_DB.getConfigCollection('deviationMatrix') : LOS_CONFIG.deviationMatrix).forEach(function (dev) {
        var t = dev.trigger;
        var val = t.value === 'securityLtvCap' ? securityLtvCap(c) : t.value;
        var field = c[t.field];
        var hit = false;
        if (t.op === '<') hit = (field != null) && field < val;
        else if (t.op === '>') hit = (field != null) && field > val;
        else if (t.op === '==') hit = field === val;
        if (hit) triggered.push(dev.code);
      });
      return triggered;
    },
    /**
     * transition(caseId, action, {actorRole, payload})
     * payload may include: fields to merge onto the case, comment, recommendation, etc.
     */
    transition: function (caseId, action, opts) {
      opts = opts || {};
      var actorRole = opts.actorRole;
      var payload = opts.payload || {};
      var c = LOS_DB.getCase(caseId);
      if (!c) return { success: false, error: 'Case not found' };

      var candidates = this.legalActions(c.status, actorRole).filter(function (t) { return t.action === action; });
      if (!candidates.length) {
        // action might exist for this status but under a different role - report clearly
        var anyMatch = (WF.transitions[c.status] || []).some(function (t) { return t.action === action; });
        return { success: false, error: anyMatch ? 'Not authorized for this action' : 'Invalid action for current status (' + c.status + ')' };
      }
      var entry = candidates[0];
      if (entry.guard) {
        var guardNames = Array.isArray(entry.guard) ? entry.guard : [entry.guard];
        for (var i = 0; i < guardNames.length; i++) {
          if (!evaluateGuard(guardNames[i], c, payload)) {
            return { success: false, error: GUARD_MESSAGES[guardNames[i]] || ('Guard condition not met: ' + guardNames[i]) };
          }
        }
      }

      // merge payload fields (everything except reserved keys) onto the case
      var reserved = { comment: 1, fiRequired: 1, deviationTriggered: 1, recommendation: 1 };
      Object.keys(payload).forEach(function (k) {
        if (!reserved[k]) c[k] = payload[k];
      });

      if (entry.retry) {
        c.disbursement = c.disbursement || {};
        c.disbursement.retryCount = (c.disbursement.retryCount || 0) + 1;
      }

      var oldStatus = c.status;
      c.status = entry.target;
      c.stage = (this.getStateInfo(entry.target) || {}).stage;
      c.statusHistory = c.statusHistory || [];
      c.statusHistory.push({
        status: entry.target,
        prevStatus: oldStatus,
        actorRole: actorRole,
        action: action,
        timestamp: new Date().toISOString(),
        comment: payload.comment || ''
      });

      if (entry.recompute && global.CamEngine) {
        global.CamEngine.recompute(c);
      }
      if ((action === 'generateCAM' || action === 'completeHubVerification') && global.CamEngine) {
        c.cam = global.CamEngine.buildCAM(c);
      }

      LOS_DB.saveCase(c);

      AuditNotify.logAudit(caseId, actorRole, action, entry.target === oldStatus ? 'Updated case' : 'Status changed', oldStatus, entry.target);

      var nextInfo = this.getStateInfo(entry.target);
      if (nextInfo && nextInfo.owner && nextInfo.owner !== 'SYSTEM' && !nextInfo.terminal) {
        AuditNotify.pushNotification(nextInfo.owner, 'Case ' + caseId + ' requires action: ' + nextInfo.action, caseId);
      }

      return { success: true, case: c };
    }
  };

  global.WorkflowEngine = WorkflowEngine;
})(window);
