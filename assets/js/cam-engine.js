/* CamEngine — builds the 10-section (A-J) Credit Appraisal Memo from a case record,
   per the "Copy of CAM Format_PrizeMoneyApp2.0.xlsx" template, and computes the risk
   score exactly per "Annexure 2: Risk-Assessment Scoring Engine":
   - Security category (Secured / Unsecured) x Chit Value bucket determines the scoring
     method (Simple / Moderate / Comprehensive KYC) and which negative-score checks apply.
   - Simple KYC: security coverage only (flat 100, since accepted security value must
     already equal/exceed Future Liability before a case can even reach this stage).
   - Moderate KYC: security (flat 70) + FOIR band (max 30).
   - Comprehensive KYC: Profile Strength (20) + Vintage/Visit (5) + Income & Stability (5)
     + FOIR (40) + Asset & Net Worth (30) = 100.
   - Negative scoring: Suit File -100 (all segments), PRL -30 (all except Secured <=10L),
     CC3 -10 and Cheque Bounce>2 -10 (Unsecured segments only), capped at -150 total.
   - Final score is SB alone unless guarantors are present, in which case
     SB x 60% + avg(Guarantor scores) x 40% (per the worked example in the Annexure). */
(function (global) {
  var PC = LOS_CONFIG.productConfig;

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  // Section 2 of the Annexure: which security types count as "Secured" collateral.
  // Mortgage and Personal Guarantee/Surety carry no tangible collateral value, so a
  // case backed only by those is scored as Unsecured even though a security row exists.
  var SECURED_SECURITY_TYPES = [
    'Gold Ornaments', 'LIC Policy', 'Bank Guarantee', 'Fixed Deposit',
    'Chit Passbook', 'Sub-Debt', 'Demat NCD', 'Demat Shares'
  ];

  function isSecuredCase(c) {
    var types = (c.securities || []).map(function (s) { return s.type; });
    if (!types.length) return false;
    return types.some(function (t) { return SECURED_SECURITY_TYPES.indexOf(t) !== -1; });
  }

  // Section 3: Applicability Matrix (Security Type x Chit Value Range) -> segment + method
  function determineSegment(c) {
    var secured = isSecuredCase(c);
    var chitValue = c.chitAmount || c.amount || 0;
    if (secured) {
      return chitValue <= 1000000
        ? { category: 'secured', bucket: '<=10L', label: 'Secured <=10L', method: 'simple' }
        : { category: 'secured', bucket: '>10L', label: 'Secured >10L', method: 'moderate' };
    }
    if (chitValue <= 800000) return { category: 'unsecured', bucket: '<=8L', label: 'Unsecured <=8L', method: 'comprehensive' };
    if (chitValue <= 2500000) return { category: 'unsecured', bucket: '8L-25L', label: 'Unsecured <=25L', method: 'comprehensive' };
    return { category: 'unsecured', bucket: '>25L', label: 'Unsecured >25L', method: 'comprehensive' };
  }

  // 4.b FOIR band, max 30 (Moderate KYC)
  function foirScoreModerate(foir) {
    var pct = (foir || 0) * 100;
    if (pct < 30) return 30;
    if (pct < 45) return 20;
    if (pct < 60) return 15;
    if (pct < 75) return 10;
    if (pct < 95) return 5;
    return 0;
  }

  // 4.c.iv FOIR band, max 40 (Comprehensive KYC)
  function foirScoreComprehensive(foir) {
    var pct = (foir || 0) * 100;
    if (pct < 30) return 40;
    if (pct < 45) return 30;
    if (pct < 60) return 20;
    if (pct < 75) return 15;
    if (pct < 95) return 10;
    return 0;
  }

  // 4.c.i Profile Strength, max 20 - salaried table or business/self-employed table
  function profileStrengthScore(p) {
    var et = (p.employmentType || '').toLowerCase();
    if (et.indexOf('govt') !== -1 || et.indexOf('psu') !== -1) return 20;
    if (et.indexOf('salaried') !== -1) {
      if (p.employeeCount != null) {
        if (p.employeeCount > 100 && (p.yearsInJob || 0) >= 3) return 16;
        if (p.employeeCount >= 20) return 12;
        return 8;
      }
      return 12; // reputed-corporate default when detailed employer size isn't captured
    }
    if (et.indexOf('business') !== -1 || et.indexOf('self employed') !== -1 || et.indexOf('professional') !== -1) {
      if (p.entityType === 'PvtLtd') return (p.yearsInBusiness || 0) >= 5 ? 20 : 17;
      if (p.entityType === 'Partnership') return (p.staffCount || 0) > 20 ? 18 : 14;
      if (p.entityType === 'Proprietorship') return (p.staffCount || 0) > 10 ? 15 : 10;
      return 8; // small/informal default when entity detail isn't captured
    }
    return 4; // unorganized / daily wage / agriculture / other
  }

  // 4.c.ii Relationship / Vintage / Visit Quality, max 5 (choice: take the higher of the two)
  function vintageVisitScore(p) {
    var years = p.customerVintageYears;
    var vintageScore = years > 3 ? 5 : (years >= 1 ? 3 : 1);
    var visits = p.personalVisits || 0;
    var visitScore = visits >= 3 ? 5 : (visits >= 1 ? 3 : 0);
    return Math.max(vintageScore, visitScore);
  }

  // 4.c.iii Income & Stability, max 5, with Govt/PSU permanent override to 5
  function incomeStabilityScore(p) {
    var years = p.yearsOfService != null ? p.yearsOfService : (p.yearsInBusiness != null ? p.yearsInBusiness : 2);
    var score = years > 7 ? 5 : (years >= 2 ? 3 : 2);
    var et = (p.employmentType || '').toLowerCase();
    if ((et.indexOf('govt') !== -1 || et.indexOf('psu') !== -1) && p.permanentGovt !== false) score = 5;
    return score;
  }

  // 4.c.v Asset & Net Worth Strength, max 30 - property must be worth > 2x the chit value
  function assetNetWorthScore(p, chitValue) {
    var count = p.propertyCount != null ? p.propertyCount : 0;
    var value = p.propertyValue != null ? p.propertyValue : 0;
    var qualifies = chitValue > 0 && value >= 2 * chitValue;
    if (count >= 2 && qualifies) return 30;
    if (count >= 1 && qualifies) return 20;
    return 0;
  }

  function positiveScore(p, segment, chitValue) {
    if (segment.method === 'simple') return 100;
    if (segment.method === 'moderate') return 70 + foirScoreModerate(p.foir);
    return profileStrengthScore(p) + vintageVisitScore(p) + incomeStabilityScore(p)
      + foirScoreComprehensive(p.foir) + assetNetWorthScore(p, chitValue);
  }

  // Negative Scoring Reference Table (Section: "Negative Scoring Reference Table")
  function negativeScore(p, segment) {
    var neg = 0;
    if (p.suitFiled) neg += 100;
    var isSecuredLE10L = segment.category === 'secured' && segment.bucket === '<=10L';
    var isSecuredAny = segment.category === 'secured';
    if (p.prlFlag && !isSecuredLE10L) neg += 30;
    if (p.cc3Flag && !isSecuredAny) neg += 10;
    if ((p.chequeBounceCount || 0) > 2 && !isSecuredAny) neg += 10;
    return Math.min(neg, 150);
  }

  function personScore(p, segment, chitValue) {
    if (!p) return { positive: 0, negative: 0, final: 0 };
    var positive = positiveScore(p, segment, chitValue);
    var negative = negativeScore(p, segment);
    var final = clamp(positive - negative, 0, 100);
    return { positive: Math.round(positive * 100) / 100, negative: negative, final: Math.round(final * 100) / 100 };
  }

  function gradeFor(score) {
    var band = PC.camScoreBands.find(function (b) { return score >= b.min && score <= b.max; });
    return band || PC.camScoreBands[PC.camScoreBands.length - 1];
  }

  var CamEngine = {
    determineSegment: determineSegment,
    scorePerson: function (p) {
      // Backward-compatible single-arg entry point: derive a moderate-method score
      // with no chit-value context, for callers that only have a bare person object.
      return personScore(p, { category: 'unsecured', bucket: '8L-25L', method: p && p.kycTier === 'simple' ? 'simple' : (p && p.kycTier === 'comprehensive' ? 'comprehensive' : 'moderate') }, 0);
    },

    buildCAM: function (c) {
      var subscriber = c.subscriber || {};
      var guarantors = c.guarantors || [];
      var chitValue = c.chitAmount || c.amount || 0;
      var segment = determineSegment(c);

      var sbScore = personScore(subscriber, segment, chitValue);
      var gScores = guarantors.map(function (g) { return personScore(g, segment, chitValue); });
      var avgGuarantorScore = gScores.length ? (gScores.reduce(function (s, g) { return s + g.final; }, 0) / gScores.length) : 0;
      var weightedScore = gScores.length
        ? Math.round((sbScore.final * 0.6 + avgGuarantorScore * 0.4) * 100) / 100
        : sbScore.final;
      var band = gradeFor(weightedScore);

      var securityTotal = (c.securities || []).reduce(function (sum, s) { return sum + (s.valueLoaded || 0); }, 0);

      var cam = {
        sectionA: {
          subscriber: {
            name: c.applicant, loyaltyNumber: c.loyalty, auctionDate: c.auctionDate, reAuctionDate: c.reAuctionDate, bidLoss: c.bidLoss || 0
          },
          chit: {
            chitNo: c.kurie, chitAmount: c.chitAmount || c.amount, chitPeriod: c.tenure, monthlyInstalment: c.monthlyInstalment, enrolmentType: c.enrolmentType || 'New'
          },
          prizeLiability: {
            prizeMoney: c.prize || c.amount, instalmentsPaid: c.instalmentsPaid || 0, instalmentsRemaining: c.instalmentsRemaining || c.tenure,
            futureLiability: c.fl || 0, insuranceOpted: c.insuranceOpted || 'No'
          },
          sourcing: { channel: c.sourcingChannel || 'DST', employeeNo: c.employeeNo, employeeName: c.initiator, branchName: c.branch, enrollmentDate: c.applied }
        },
        sectionB: {
          liveChits: c.liveChits || 1, totalChitValue: c.totalChitValue || (c.amount || 0), monthlyChitCommitment: c.monthlyInstalment || 0,
          overdueInstalments: c.overdueInstalments || 0, totalOverdue: c.totalOverdue || 0, pctServicedAfterDue: c.pctServicedAfterDue || 0,
          terminatedChits: c.terminatedChits || 0, suitFiled: subscriber.suitFiled ? 1 : 0, mrclIssued: c.mrclIssued || 0, lnIssued: c.lnIssued || 0,
          suspenseBalance: c.suspenseBalance || 0, usnFreeValue: c.usnFreeValue || 0, directExposure: subscriber.directExposure || 0,
          indirectExposure: subscriber.indirectExposure || 0, netUnsecuredExposure: c.netUnsecuredExposure || 0,
          securityCoverageRatio: subscriber.securityCoverageRatio || 1, guarantorsObtained: guarantors.length, guarantorGivenCount: c.guarantorGivenCount || 0,
          guarantorGivenValue: c.guarantorGivenValue || 0
        },
        sectionC: { earlierSanctionNotes: c.earlierSanctionNotes || 'No earlier sanction / deviation on record.' },
        sectionD: { securities: c.securities || [], total: securityTotal },
        sectionE: {
          subscriber: Object.assign({ role: 'SB' }, subscriber, { score: sbScore }),
          guarantors: guarantors.map(function (g, i) { return Object.assign({ role: 'Surety-' + (i + 1) }, g, { score: gScores[i] }); })
        },
        sectionF: {
          sb: sbScore, guarantors: gScores, sbWeightage: 0.6, guarantorWeightage: 0.4, avgGuarantorScore: Math.round(avgGuarantorScore * 100) / 100,
          finalWeightedScore: weightedScore, segment: segment.label, scoringMethod: segment.method
        },
        sectionG: { score: weightedScore, grade: band.grade, label: band.label, decision: band.decision },
        sectionH: {
          deviations: (c.deviations || []),
          securityCheques: c.securityCheques || {},
          approvalRecommendation: c.approvalRecommendation || { overallDeviation: (c.deviations || []).length ? 'Yes' : 'No', keyRisks: '', mitigants: '', recommendedBy: '', approvalAuthority: '', decision: '' }
        },
        sectionI: {
          branchManager: c.branchManagerRecommendation || { name: '', comments: '' },
          regionalManager: c.regionalManagerRecommendation || { name: '', comments: '' }
        },
        sectionJ: {
          levels: c.approvals && c.approvals.length ? c.approvals : [1, 2, 3, 4].map(function (lvl) {
            return { level: lvl, approverName: '', designation: '', comments: '', deviationsCalled: '', nextLevelApproval: '' };
          })
        },
        computedAt: new Date().toISOString(),
        finalScore: weightedScore,
        riskGrade: band.grade,
        segment: segment
      };
      return cam;
    },

    recompute: function (c) {
      c.cam = this.buildCAM(c);
      return c.cam;
    }
  };

  global.CamEngine = CamEngine;
})(window);
