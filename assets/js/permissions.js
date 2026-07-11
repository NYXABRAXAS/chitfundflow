/* Permissions — role x feature and role x status gates. */
(function (global) {
  var Permissions = {
    canPerform: function (role, feature) {
      if (!role) return false;
      if (role === 'ADMIN') return true;
      var list = ((typeof LOS_DB!=='undefined' ? LOS_DB.getConfigCollection('rolesPermissions') : LOS_CONFIG.rolesPermissions).matrix[role]) || [];
      return list.indexOf(feature) !== -1;
    },
    canActOnStatus: function (role, statusCode) {
      if (role === 'ADMIN') return true;
      var st = LOS_CONFIG.workflowStates.states.find(function (s) { return s.code === statusCode; });
      if (!st) return false;
      return st.owner === role;
    },
    roleLabel: function (role) {
      var r = LOS_CONFIG.workflowStates.roles[role];
      return r ? r.label : role;
    },
    allRoles: function () {
      return Object.keys(LOS_CONFIG.workflowStates.roles);
    }
  };

  global.Permissions = Permissions;
})(window);
