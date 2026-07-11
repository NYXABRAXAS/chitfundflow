/* Session — sessionStorage-backed "who's logged in" helper. */
(function (global) {
  var KEY = 'los_session';

  var Session = {
    login: function (role, employeeId, employeeName) {
      var roleInfo = (LOS_CONFIG.workflowStates.roles[role]) || { label: role };
      var s = {
        role: role,
        roleLabel: roleInfo.label,
        employeeId: employeeId || 'EMP-1001',
        employeeName: employeeName || roleInfo.label,
        loginAt: new Date().toISOString()
      };
      sessionStorage.setItem(KEY, JSON.stringify(s));
      return s;
    },
    get: function () {
      try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; }
    },
    logout: function () { sessionStorage.removeItem(KEY); },
    currentRole: function () { var s = this.get(); return s ? s.role : null; },
    requireOrDefault: function (fallbackRole) {
      var s = this.get();
      if (s) return s;
      return this.login(fallbackRole || 'ADMIN');
    }
  };

  global.Session = Session;
})(window);
