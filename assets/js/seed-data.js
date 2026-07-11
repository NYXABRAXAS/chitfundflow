/* LOS_SEED — deterministic demo-data generator: 200+ customers, 100+ cases spread across
   every workflow status, with explicit "scenario anchor" cases so each of the 20 named
   scenarios has a real case sitting at its entry state, ready to be walked live via
   real clicks through the retrofitted pages. */
(function (global) {
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rand = mulberry32(20240115);
  function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
  function int(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
  function pad(n, len) { return String(n).padStart(len, '0'); }

  var FIRST = ['Ramesh', 'Kavitha', 'Pradeep', 'Arun Kumar', 'Meena Devi', 'Suresh', 'Lakshmi', 'Karthikeyan', 'Pandiarajan', 'Usha',
    'Subrahmanyam', 'Babyshalini', 'Porselvi', 'Rajendran', 'Meenakshi', 'Krishnamurthy', 'Saraswathy', 'Venkatesan', 'Lakshmi Priya', 'Balasubramanian',
    'Anitha', 'Vijay', 'Priya', 'Manoj', 'Rekha', 'Sundar', 'Kannan', 'Prabu', 'Deepa', 'Gopi',
    'Rani', 'Preethi', 'Kumar', 'Arjun', 'Selvi', 'Murugan', 'Nandhini', 'Bala', 'Chitra', 'Dinesh',
    'Elango', 'Farida', 'Gowri', 'Hari', 'Indira', 'Jayaraman', 'Kalaivani', 'Loganathan', 'Malathi', 'Naveen'];
  var LAST = ['Gopalakrishnan', 'Subramanian', 'Natarajan', 'Pillai', 'Krishnan', 'Lakshminarayan', 'Meenakshisundaram', 'Murugesan', 'Rangarajan', 'Iyer',
    'Chettiar', 'Naidu', 'Reddy', 'Nair', 'Menon', 'Raman', 'Swaminathan', 'Sundaram', 'Krishnamoorthy', 'Sivakumar'];
  var CITIES = ['Chennai', 'Trichy', 'Madurai', 'Coimbatore', 'Salem', 'Erode', 'Tirunelveli', 'Vellore', 'Pondicherry'];
  var SECURITY_TYPES = LOS_CONFIG.securityTypes.map(function (s) { return s.type; });
  var EMPLOYMENT = ['Salaried - Govt', 'Salaried - Private', 'Business - Trading', 'Business - Manufacturing', 'Self Employed - Professional', 'Agriculture'];

  function genPAN() { return pick('ABCDEFGHJKLMNPQRSTUVWXYZ'.split('')) + pick('ABCDEFGHJKLMNPQRSTUVWXYZ'.split('')) + pick('ABCDEFGHJKLMNPQRSTUVWXYZ'.split('')) + 'XX' + pick('ABCDEFGHJKLMNPQRSTUVWXYZ'.split('')) + int(1000, 9999) + pick('ABCDEFGHJKLMNPQRSTUVWXYZ'.split('')); }
  function genAadhaar() { return int(1000, 9999) + ' ' + int(1000, 9999) + ' ' + int(1000, 9999); }
  function genMobile() { return '98' + int(400, 499) + '-' + int(10000, 99999); }

  function buildCustomer(i) {
    var fn = pick(FIRST), ln = pick(LAST);
    return {
      id: 'CUST-' + pad(i, 5),
      name: fn + ' ' + ln,
      mobile: genMobile(),
      dob: pad(int(1, 28), 2) + ' ' + pick(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) + ' ' + int(1958, 2000),
      address: int(1, 99) + ', ' + pick(['Anna Nagar', 'Gandhi Nagar', 'Nehru St', 'Race Course Rd', 'West Masi St', 'Besant Nagar', 'T Nagar']) + ', ' + pick(CITIES),
      pan: genPAN(),
      aadhaar: genAadhaar(),
      employmentType: pick(EMPLOYMENT),
      monthlyIncome: int(15, 150) * 1000,
      cibil: int(560, 830)
    };
  }

  function buildPerson(cust, tier) {
    var foir = Math.round(rand() * 0.55 * 100) / 100 + 0.05;
    return {
      name: cust.name, employmentType: cust.employmentType, creditScore: cust.cibil,
      loanOverdueAmount: rand() < 0.2 ? int(1, 20) * 1000 : 0,
      totalEmiChitInstalment: Math.round(cust.monthlyIncome * foir),
      foir: foir, grossIncome: cust.monthlyIncome, netIncome: Math.round(cust.monthlyIncome * 0.85),
      directExposure: int(0, 5) * 50000, indirectExposure: int(0, 3) * 25000,
      securityCoverageRatio: Math.round((0.6 + rand() * 0.8) * 100) / 100,
      kycTier: tier || 'moderate',
      suitFiled: rand() < 0.04, prlFlag: rand() < 0.06, cc3Flag: rand() < 0.05,
      chequeBounceCount: rand() < 0.1 ? int(3, 5) : int(0, 2)
    };
  }

  function buildSecurities(amount) {
    var n = int(1, 2);
    var list = [];
    var remaining = amount;
    for (var i = 0; i < n; i++) {
      var val = i === n - 1 ? remaining : Math.round(remaining * 0.6);
      remaining -= val;
      list.push({
        slNo: i + 1, type: pick(SECURITY_TYPES), name: pick(FIRST) + ' ' + pick(LAST),
        loyaltyUsn: 'USN' + int(1000, 9999), creationDate: '2023-0' + int(1, 9) + '-15',
        expiryDate: '2027-0' + int(1, 9) + '-15', currentCharge: 'N/A', freeValue: val,
        valueLoaded: val
      });
    }
    return list;
  }

  function caseCore(id, cust, branch, amount, tenure) {
    var tier = amount > 1500000 ? 'comprehensive' : (amount > 400000 ? 'moderate' : 'simple');
    var subscriber = buildPerson(cust, tier);
    subscriber.creditScore = cust.cibil;
    var guarantorCount = amount > 300000 ? int(1, 2) : 0;
    var guarantors = [];
    for (var g = 0; g < guarantorCount; g++) guarantors.push(buildPerson(buildCustomer(9000 + int(0, 999)), tier));

    return {
      id: id,
      applicant: cust.name, mobile: cust.mobile, dob: cust.dob, address: cust.address, pan: cust.pan, aadhaar: cust.aadhaar,
      customerId: cust.id,
      income: cust.monthlyIncome, obligations: Math.round(cust.monthlyIncome * subscriber.foir),
      loyalty: 'MPC/CF/' + int(10000, 99999),
      branch: branch.name, hub: branch.hub,
      kurie: pick(['A4', 'B2', 'C1', 'D3', 'E5', 'F7', 'G3', 'H1', 'I9']) + '/' + int(1, 60) + '/' + int(2020, 2024),
      draw: String(int(1, 8)),
      amount: amount, prize: amount, chitAmount: Math.round(amount * 1.35), fl: Math.round(amount * 1.35 - amount * 0.15),
      monthlyInstalment: Math.round(amount * 1.35 / tenure), instalmentsPaid: int(2, 20), instalmentsRemaining: tenure - int(2, 20),
      tenure: tenure, security: guarantors.length ? pick(SECURITY_TYPES) + ' + Personal Surety' : pick(SECURITY_TYPES),
      securities: buildSecurities(Math.round(amount * 1.1)),
      ltv: int(55, 95), mktVal: Math.round(amount * (1 + rand())), weight: pick(['58g @ 22K', '98g @ 22K', '165g @ 22K', 'FD Value', 'Surrender Value']),
      guarantor: guarantors.length ? guarantors[0].name : 'N/A',
      initiator: pick(FIRST) + ' ' + pick(LAST), assignedTo: pick(FIRST) + ' ' + pick(LAST),
      cibil: cust.cibil,
      subscriber: subscriber, guarantors: guarantors,
      documentsComplete: true, fiRequired: amount >= LOS_CONFIG.productConfig.fiRequiredThreshold,
      liveChits: int(0, 4),
      disbursement: { retryCount: 0 },
      statusHistory: [], deviations: [], approvals: [],
      applied: '2024-01-' + pad(int(1, 28), 2)
    };
  }

  function attachDeviations(c) {
    var triggered = [];
    LOS_CONFIG.deviationMatrix.forEach(function (dev) {
      if (dev.trigger.field === 'cibil' && c.cibil < 700) triggered.push(dev.code);
      if (dev.trigger.field === 'foir' && c.subscriber.foir > 0.6) triggered.push(dev.code);
    });
    c.deviations = triggered.map(function (code) {
      var d = LOS_CONFIG.deviationMatrix.find(function (x) { return x.code === code; });
      return { code: code, type: d.type, status: 'PENDING', raisedAt: new Date().toISOString() };
    });
    return c;
  }

  function generate() {
    var customers = [];
    for (var i = 1; i <= 220; i++) customers.push(buildCustomer(i));

    var cases = [];
    var branches = LOS_CONFIG.branches;
    var seq = 1801;
    function nextId() { return 'MCF-2024-' + pad(seq++, 6); }

    // Bulk distribution across the 15 main + a few side statuses, ~85 cases
    var statusPool = [
      'NEW', 'ASSIGNED', 'BRANCH_WIP', 'BRANCH_WIP', 'SCRUTINY_PENDING', 'SCRUTINY_PENDING', 'DISPATCHED',
      'HUB_INWARD', 'HUB_INWARD', 'FI_INITIATED', 'FI_INITIATED', 'FI_COMPLETED', 'FI_COMPLETED', 'FINAL_CHECK',
      'FINAL_CHECK', 'DEVIATION_PENDING', 'CREDIT_REVIEW', 'CREDIT_REVIEW', 'IN_PRINCIPAL_APPROVED', 'FINAL_APPROVAL',
      'BUSINESS_APPROVED', 'READY_DISBURSEMENT', 'CLOSED', 'CLOSED', 'CLOSED', 'DECLINED', 'REVERTED',
      'ADDITIONAL_SECURITY_REQUIRED', 'ON_HOLD'
    ];
    for (var b = 0; b < 85; b++) {
      var cust = pick(customers);
      var branch = pick(branches);
      var amount = pick([180000, 275000, 325000, 420000, 500000, 590000, 800000, 1200000, 1500000, 2500000, 5000000, 8000000]);
      var tenure = pick(LOS_CONFIG.productConfig.chitPeriods);
      var id = nextId();
      var c = caseCore(id, cust, branch, amount, tenure);
      c.status = statusPool[b % statusPool.length];
      c.stage = (WorkflowStageOf(c.status));
      attachDeviations(c);
      if (c.status === 'FINAL_CHECK' || c.status === 'CREDIT_REVIEW' || c.status === 'IN_PRINCIPAL_APPROVED' ||
          c.status === 'FINAL_APPROVAL' || c.status === 'BUSINESS_APPROVED' || c.status === 'READY_DISBURSEMENT' || c.status === 'CLOSED') {
        c.cam = null; // built lazily via CamEngine when the page loads if needed
      }
      c.scenarioTag = null;
      cases.push(c);
    }

    function WorkflowStageOf(code) {
      var s = LOS_CONFIG.workflowStates.states.find(function (x) { return x.code === code; });
      return s ? s.stage : 0;
    }

    // Explicit scenario anchors - guarantee each of the 20 scenarios is reachable live
    function anchor(scenarioId, statusOverrides, amount, tenure, extra) {
      var cust = pick(customers);
      var branch = pick(branches);
      var id = nextId();
      var c = caseCore(id, cust, branch, amount || 400000, tenure || 30);
      Object.assign(c, statusOverrides, extra || {});
      c.stage = WorkflowStageOf(c.status);
      c.scenarioTag = scenarioId;
      return c;
    }

    cases.push(anchor(1, { status: 'NEW' }, 350000, 30));
    cases.push(anchor(2, { status: 'SCRUTINY_PENDING' }, 300000, 24));
    cases.push(anchor(3, { status: 'FI_COMPLETED' }, 600000, 36));
    cases.push(anchor(4, { status: 'FINAL_CHECK' }, 450000, 24));
    cases.push(anchor(5, { status: 'DEVIATION_PENDING' }, 500000, 24, { cibil: 640 }));
    cases.push(anchor(6, { status: 'IN_PRINCIPAL_APPROVED' }, 700000, 36));
    cases.push(anchor(7, { status: 'BUSINESS_APPROVED' }, 900000, 36));
    cases.push(anchor(8, { status: 'FINAL_APPROVAL' }, 12000000, 48));
    cases.push(anchor(9, { status: 'FINAL_CHECK', documentsComplete: false }, 400000, 24));
    cases.push(anchor(10, { status: 'CREDIT_REVIEW', cibil: 655 }, 350000, 24, { cibil: 655 }));
    cases.push(anchor(11, { status: 'FI_COMPLETED', fiReport: { recommendation: 'NOT_RECOMMEND' } }, 550000, 30));
    cases.push(anchor(12, { status: 'SCRUTINY_PENDING' }, 320000, 24));
    cases.push(anchor(13, { status: 'FINAL_CHECK' }, 620000, 36));
    cases.push(anchor(14, { status: 'CREDIT_REVIEW' }, 480000, 24));
    cases.push(anchor(15, { status: 'IN_PRINCIPAL_APPROVED' }, 750000, 36));
    cases.push(anchor(16, { status: 'IN_PRINCIPAL_APPROVED' }, 750000, 36));
    cases.push(anchor(17, { status: 'IN_PRINCIPAL_APPROVED' }, 750000, 36));
    cases.push(anchor(18, { status: 'DEVIATION_PENDING' }, 530000, 24, { cibil: 660 }));
    cases.push(anchor(19, { status: 'DEVIATION_PENDING' }, 540000, 24, { cibil: 670 }));
    cases.push(anchor(20, { status: 'READY_DISBURSEMENT' }, 400000, 30));

    cases.forEach(function (c) { attachDeviations(c); });

    return { customers: customers, cases: cases, audit: [], notifications: [] };
  }

  global.LOS_SEED = { generate: generate };
})(window);
