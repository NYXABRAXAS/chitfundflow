/* CamEngine — builds the 10-section (A-J) Credit Appraisal Memo from a case record,
   per the "Copy of CAM Format_PrizeMoneyApp2.0.xlsx" template, including the real
   scoring formula in sections F/G. */
(function (global) {
  var PC = LOS_CONFIG.productConfig;

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function personScore(p) {
    if (!p) return { positive: 0, negative: 0, final: 0 };
    var tier = p.kycTier || 'moderate';
    var coverageRatio = p.securityCoverageRatio != null ? p.securityCoverageRatio : 1;
    var foir = p.foir != null ? p.foir : 0.3;
    var positive;
    if (tier === 'simple') {
      positive = clamp(100 * Math.min(coverageRatio, 1), 0, 100);
    } else if (tier === 'comprehensive') {
      var repaymentScore = clamp(50 * (1 - foir), 0, 50);
      var securityScore50 = clamp(50 * Math.min(coverageRatio, 1), 0, 50);
      positive = repaymentScore + securityScore50;
    } else { // moderate (default)
      var securityScore70 = clamp(70 * Math.min(coverageRatio, 1), 0, 70);
      var foirScore = clamp(30 * (1 - foir / PC.foirCap), 0, 30);
      positive = securityScore70 + foirScore;
    }
    var negative = 0;
    if (p.suitFiled) negative += 20;
    if (p.prlFlag) negative += 10;
    if (p.cc3Flag) negative += 5;
    if ((p.chequeBounceCount || 0) > 2) negative += 15;
    var final = clamp(positive - negative, 0, 100);
    return { positive: Math.round(positive * 100) / 100, negative: negative, final: Math.round(final * 100) / 100 };
  }

  function gradeFor(score) {
    var band = PC.camScoreBands.find(function (b) { return score >= b.min && score <= b.max; });
    return band || PC.camScoreBands[PC.camScoreBands.length - 1];
  }

  var CamEngine = {
    scorePerson: personScore,

    buildCAM: function (c) {
      var subscriber = c.subscriber || {};
      var guarantors = c.guarantors || [];

      var sbScore = personScore(subscriber);
      var gScores = guarantors.map(personScore);
      var avgGuarantorScore = gScores.length ? (gScores.reduce(function (s, g) { return s + g.final; }, 0) / gScores.length) : 0;
      var weightedScore = Math.round((sbScore.final * 0.6 + avgGuarantorScore * 0.4) * 100) / 100;
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
          finalWeightedScore: weightedScore
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
        riskGrade: band.grade
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
