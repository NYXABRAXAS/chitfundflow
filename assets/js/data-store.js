/* LOS_DB — localStorage-backed data layer. Schema-versioned; seeds only when the version
   key is missing or stale so user-driven demo progress is never silently wiped. */
(function (global) {
  var SCHEMA_VERSION = 3;
  var KEYS = {
    customers: 'los_customers',
    cases: 'los_cases',
    audit: 'los_audit',
    notifications: 'los_notifications',
    version: 'los_schema_version'
  };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  var LOS_DB = {
    KEYS: KEYS,
    SCHEMA_VERSION: SCHEMA_VERSION,

    init: function () {
      var v = localStorage.getItem(KEYS.version);
      if (String(v) !== String(SCHEMA_VERSION)) {
        this.reseed();
      }
      return this;
    },

    reseed: function () {
      var seed = global.LOS_SEED.generate();
      write(KEYS.customers, seed.customers);
      write(KEYS.cases, seed.cases);
      write(KEYS.audit, seed.audit || []);
      write(KEYS.notifications, seed.notifications || []);
      localStorage.setItem(KEYS.version, String(SCHEMA_VERSION));
    },

    resetDemoData: function () { this.reseed(); },

    getCustomers: function () { return read(KEYS.customers, []); },
    getCustomer: function (id) {
      var list = this.getCustomers();
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return null;
    },
    saveCustomer: function (c) {
      var list = this.getCustomers();
      var i = list.findIndex(function (x) { return x.id === c.id; });
      if (i >= 0) list[i] = c; else list.push(c);
      write(KEYS.customers, list);
      return c;
    },

    getCases: function (filter) {
      var list = read(KEYS.cases, []);
      if (filter) {
        var keys = Object.keys(filter);
        list = list.filter(function (c) {
          return keys.every(function (k) { return filter[k] === undefined || c[k] === filter[k]; });
        });
      }
      return list;
    },
    getCase: function (id) {
      var list = this.getCases();
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return null;
    },
    saveCase: function (c) {
      var list = this.getCases();
      var i = list.findIndex(function (x) { return x.id === c.id; });
      c.updatedAt = new Date().toISOString();
      if (i >= 0) { list[i] = c; } else { c.createdAt = c.createdAt || c.updatedAt; list.push(c); }
      write(KEYS.cases, list);
      return c;
    },
    deleteCase: function (id) {
      var list = this.getCases().filter(function (c) { return c.id !== id; });
      write(KEYS.cases, list);
    },
    nextCaseId: function () {
      var list = this.getCases();
      var max = 1800;
      list.forEach(function (c) {
        var parts = (c.id || '').split('-');
        var n = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(n) && n > max) max = n;
      });
      return 'MCF-2024-' + String(max + 1).padStart(6, '0');
    },

    getAudit: function (filter) {
      var list = read(KEYS.audit, []);
      if (filter && filter.caseId) list = list.filter(function (a) { return a.caseId === filter.caseId; });
      return list;
    },
    appendAudit: function (entry) {
      var list = read(KEYS.audit, []);
      entry.id = 'AUD-' + String(list.length + 1).padStart(6, '0');
      entry.timestamp = new Date().toISOString();
      list.unshift(entry);
      write(KEYS.audit, list);
      return entry;
    },

    // Generic editable-config collections (deviationMatrix, approvalMatrix, rolesPermissions,
    // branches, securityTypes, ...) - seeded once from LOS_CONFIG[name], then persisted
    // independently in localStorage so admin pages can add/edit/delete rows.
    getConfigCollection: function (name) {
      var key = 'los_cfg_' + name;
      var stored = read(key, null);
      if (stored) return stored;
      var initial = LOS_CONFIG[name] ? JSON.parse(JSON.stringify(LOS_CONFIG[name])) : [];
      write(key, initial);
      return initial;
    },
    saveConfigCollection: function (name, list) {
      write('los_cfg_' + name, list);
      return list;
    },

    getNotifications: function (role) {
      var list = read(KEYS.notifications, []);
      if (role) list = list.filter(function (n) { return n.role === role || n.role === 'ALL'; });
      return list;
    },
    appendNotification: function (n) {
      var list = read(KEYS.notifications, []);
      n.id = 'NTF-' + String(list.length + 1).padStart(6, '0');
      n.timestamp = new Date().toISOString();
      n.read = false;
      list.unshift(n);
      write(KEYS.notifications, list);
      return n;
    },
    markNotificationRead: function (id) {
      var list = read(KEYS.notifications, []);
      var n = list.find(function (x) { return x.id === id; });
      if (n) n.read = true;
      write(KEYS.notifications, list);
    },
    unreadCount: function (role) {
      return this.getNotifications(role).filter(function (n) { return !n.read; }).length;
    }
  };

  global.LOS_DB = LOS_DB;
})(window);
