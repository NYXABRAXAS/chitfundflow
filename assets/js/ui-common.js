/* ui-common.js — shared boilerplate lifted out of the 43 per-page copies: modal open/close,
   tab switching, sidebar toggle, notification bell, profile dropdown, plus the dynamic
   sidebar/notification rendering that replaces hardcoded per-page markup. */
(function (global) {

  function currentPage() {
    var p = location.pathname.split('/');
    return p[p.length - 1] || 'index.html';
  }

  function renderSidebar(role) {
    var nav = document.getElementById('sidebarNav');
    var label = document.getElementById('sidebarRoleLabel');
    var cfg = NavConfig[role];
    if (!cfg) return;
    if (label) label.textContent = cfg.label;
    if (!nav) return;
    var page = currentPage();
    nav.innerHTML = cfg.links.map(function (l) {
      var active = l.href === page;
      var cls = active
        ? 'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-blue-600 text-white'
        : 'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-300 hover:bg-slate-700 hover:text-white';
      return '<a href="' + l.href + '" class="' + cls + '"><span>' + l.icon + '</span><span>' + l.text + '</span></a>';
    }).join('');
  }

  function renderNotifications(role) {
    var list = LOS_DB.getNotifications(role).slice(0, 8);
    var panel = document.getElementById('notifList');
    var badge = document.getElementById('notifBadge');
    if (badge) {
      var unread = LOS_DB.unreadCount(role);
      badge.style.display = unread > 0 ? '' : 'none';
    }
    if (!panel) return;
    if (!list.length) {
      panel.innerHTML = '<div class="px-4 py-6 text-center text-xs text-slate-400">No notifications yet</div>';
      return;
    }
    panel.innerHTML = list.map(function (n) {
      return '<div class="px-4 py-3 hover:bg-slate-50 cursor-pointer" onclick="LOS_DB.markNotificationRead(\'' + n.id + '\')' +
        (n.caseId ? ';location.href=\'case-details.html?caseId=' + n.caseId + '\'' : '') + '">' +
        '<div class="text-xs font-semibold text-slate-800">' + n.message + '</div>' +
        '<div class="text-xs text-slate-400 mt-0.5">' + new Date(n.timestamp).toLocaleString() + '</div></div>';
    }).join('');
  }

  function renderProfile(session) {
    var initials = document.getElementById('profileInitials');
    var name = document.getElementById('profileName');
    var roleEl = document.getElementById('profileRole');
    var parts = (session.employeeName || '').split(' ');
    var ini = (parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '');
    if (initials) initials.textContent = ini.toUpperCase() || 'U';
    if (name) name.textContent = session.employeeName;
    if (roleEl) roleEl.textContent = session.roleLabel;
  }

  function initModals() {
    document.querySelectorAll('[data-modal-open]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-modal-open');
        var el = document.getElementById(id);
        if (el) el.classList.add('open');
      });
    });
    document.querySelectorAll('[data-modal-close]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-modal-close');
        var el = document.getElementById(id);
        if (el) el.classList.remove('open');
      });
    });
    document.querySelectorAll('.modal-overlay').forEach(function (o) {
      o.addEventListener('click', function (e) { if (e.target === o) o.classList.remove('open'); });
    });
  }

  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.getAttribute('data-tab-group');
        var t = b.getAttribute('data-tab');
        document.querySelectorAll('[data-tab-group="' + g + '"].tab-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        document.querySelectorAll('[data-tab-group="' + g + '"][data-tab-content]').forEach(function (x) {
          x.style.display = x.getAttribute('data-tab-content') === t ? '' : 'none';
        });
      });
    });
    var groups = {};
    document.querySelectorAll('.tab-btn').forEach(function (b) {
      var g = b.getAttribute('data-tab-group');
      if (!groups[g]) { groups[g] = true; b.click(); }
    });
  }

  function initSidebarToggle() {
    var toggleBtn = document.getElementById('sidebarToggle') || document.getElementById('menuToggle');
    var sb = document.getElementById('sidebar');
    if (toggleBtn && sb) toggleBtn.addEventListener('click', function () {
      sb.classList.toggle('hidden');
      sb.classList.toggle('-translate-x-full');
    });
  }

  function initNotifAndProfile() {
    var bell = document.getElementById('notifBell') || document.getElementById('notifBtn');
    var panel = document.getElementById('notifPanel');
    if (bell && panel) {
      bell.addEventListener('click', function (e) { e.stopPropagation(); panel.classList.toggle('hidden'); });
      document.addEventListener('click', function () { panel.classList.add('hidden'); });
    }
    var prof = document.getElementById('profileBtn');
    var pdrop = document.getElementById('profilePanel') || document.getElementById('profileDrop');
    if (prof && pdrop) {
      prof.addEventListener('click', function (e) { e.stopPropagation(); pdrop.classList.toggle('hidden'); });
      document.addEventListener('click', function () { pdrop.classList.add('hidden'); });
    }
  }

  var LOSApp = {
    boot: function (fallbackRole) {
      LOS_DB.init();
      var session = Session.get() || Session.login(fallbackRole || 'ADMIN');
      renderSidebar(session.role);
      renderNotifications(session.role);
      renderProfile(session);
      initModals();
      initTabs();
      initSidebarToggle();
      initNotifAndProfile();
      return session;
    },
    refreshChrome: function () {
      var session = Session.get();
      if (!session) return;
      renderNotifications(session.role);
    },
    renderSidebar: renderSidebar,
    renderNotifications: renderNotifications
  };

  global.LOSApp = LOSApp;
})(window);
