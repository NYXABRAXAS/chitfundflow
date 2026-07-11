/* LOS_CONFIG — runtime mirror of assets/json/*.json, loaded as a plain <script> so every
   page can use it synchronously with no fetch/CORS concerns on a static file host.
   Keep in sync with assets/json/*.json if those are edited (JSON files are the documented
   source of truth per the folder-structure requirement; this file is the runtime copy). */
(function (global) {
  var LOS_CONFIG = {
    branches: [
      {"code":"BR-001","name":"Chennai HO","state":"Tamil Nadu","category":"Metro South","zone":"South Zone","manager":"Smt. Leela Rajan","staff":54,"activeCases":18,"hub":"Chennai Hub","status":"Active"},
      {"code":"BR-002","name":"Trichy Main","state":"Tamil Nadu","category":"Metro North","zone":"South Zone","manager":"Mr. Prabu Kumar","staff":41,"activeCases":12,"hub":"Trichy Hub","status":"Active"},
      {"code":"BR-003","name":"Madurai Central","state":"Tamil Nadu","category":"Metro South","zone":"South Zone","manager":"Mr. Arjun Naidu","staff":38,"activeCases":10,"hub":"Madurai Hub","status":"Active"},
      {"code":"BR-004","name":"Coimbatore North","state":"Tamil Nadu","category":"Metro North","zone":"West Zone","manager":"Ms. Deepa Srinivasan","staff":29,"activeCases":8,"hub":"Coimbatore Hub","status":"Active"},
      {"code":"BR-005","name":"Salem Branch","state":"Tamil Nadu","category":"Semi-Urban","zone":"West Zone","manager":"Mr. Kumar Raja","staff":22,"activeCases":6,"hub":"Coimbatore Hub","status":"Active"},
      {"code":"BR-006","name":"Erode Branch","state":"Tamil Nadu","category":"Semi-Urban","zone":"West Zone","manager":"Ms. Preethi M","staff":17,"activeCases":5,"hub":"Coimbatore Hub","status":"Active"},
      {"code":"BR-007","name":"Tirunelveli","state":"Tamil Nadu","category":"Metro South","zone":"South Zone","manager":"Mr. Gopi Krishnan","staff":33,"activeCases":9,"hub":"Madurai Hub","status":"Active"},
      {"code":"BR-008","name":"Vellore Branch","state":"Tamil Nadu","category":"Semi-Urban","zone":"North Zone","manager":"Ms. Rani Sundar","staff":14,"activeCases":4,"hub":"Chennai Hub","status":"Active"},
      {"code":"BR-009","name":"Pondicherry","state":"Puducherry","category":"Urban","zone":"East Zone","manager":"Mr. Kannan R","staff":11,"activeCases":3,"hub":"Chennai Hub","status":"Active"},
      {"code":"BR-010","name":"Kochi Hub","state":"Kerala","category":"Metro","zone":"West Zone","manager":"Mr. Suresh Nair","staff":19,"activeCases":6,"hub":"Chennai Hub","status":"Inactive"}
    ],
    securityTypes: [
      {"type":"Gold Ornaments","code":"Gold","category":"Primary","valueBand":"Rs. 50K - Rs. 50L","approvalAuthority":"Branch Manager","ltvCap":0.75,"status":"Active"},
      {"type":"LIC Policy","code":"LIC","category":"Primary","valueBand":"Rs. 25K - Rs. 25L","approvalAuthority":"Hub Controller","ltvCap":0.85,"status":"Active"},
      {"type":"Bank Guarantee","code":"BG","category":"Primary","valueBand":"Rs. 1L - Rs. 5Cr","approvalAuthority":"Credit Head","ltvCap":1.0,"status":"Active"},
      {"type":"Fixed Deposit","code":"FD","category":"Primary","valueBand":"Rs. 50K - Rs. 2Cr","approvalAuthority":"Hub Controller","ltvCap":0.9,"status":"Active"},
      {"type":"Mortgage (Property)","code":"Mortgage","category":"Collateral","valueBand":"Rs. 5L - Rs. 10Cr","approvalAuthority":"Credit Head","ltvCap":0.6,"status":"Active"},
      {"type":"Chit Passbook","code":"Chit","category":"Primary","valueBand":"Rs. 10K - Rs. 10L","approvalAuthority":"Branch Manager","ltvCap":0.8,"status":"Active"},
      {"type":"Sub-Debt","code":"Sub-Debt","category":"Subordinate","valueBand":"Rs. 5L - Rs. 5Cr","approvalAuthority":"Recommending Authority","ltvCap":0.7,"status":"Active"},
      {"type":"Demat NCD","code":"NCD","category":"Primary","valueBand":"Rs. 1L - Rs. 1Cr","approvalAuthority":"Hub Controller","ltvCap":0.83,"status":"Active"},
      {"type":"Demat Shares","code":"Equity","category":"Primary","valueBand":"Rs. 2L - Rs. 50L","approvalAuthority":"Credit Head","ltvCap":0.6,"status":"Active"},
      {"type":"Personal Surety","code":"Surety","category":"Guarantee","valueBand":"Any","approvalAuthority":"Branch Manager","ltvCap":null,"status":"Active"}
    ],
    deviationMatrix: [
      {"code":"DEV-001","type":"CIBIL Score < 700","policyCategory":"Credit Policy","riskLevel":"Low","approvalAuthority":"Deviation Authority","conditions":"Reason + guarantor mandatory","trigger":{"field":"cibil","op":"<","value":700}},
      {"code":"DEV-002","type":"LTV > Policy Cap","policyCategory":"Security Policy","riskLevel":"Medium","approvalAuthority":"Credit Head","conditions":"Board approval if >20% excess","trigger":{"field":"ltv","op":">","value":"securityLtvCap"}},
      {"code":"DEV-003","type":"Income < Repayment Capacity","policyCategory":"Income Policy","riskLevel":"High","approvalAuthority":"Credit Head + Recommending","conditions":"Legal opinion mandatory","trigger":{"field":"foir","op":">","value":0.6}},
      {"code":"DEV-004","type":"Missing mandatory document","policyCategory":"Document Policy","riskLevel":"Medium","approvalAuthority":"Deviation Authority","conditions":"30-day rectification period","trigger":{"field":"documentsComplete","op":"==","value":false}},
      {"code":"DEV-005","type":"Security not in approved list","policyCategory":"Security Policy","riskLevel":"High","approvalAuthority":"Credit Head","conditions":"Special approval only","trigger":{"field":"securityApproved","op":"==","value":false}},
      {"code":"DEV-006","type":"Loan tenure > 60 months","policyCategory":"Product Policy","riskLevel":"Low","approvalAuthority":"Hub Controller","conditions":"Rate loading of 0.5%","trigger":{"field":"tenure","op":">","value":60}},
      {"code":"DEV-007","type":"Multiple active loans","policyCategory":"Borrower Policy","riskLevel":"Medium","approvalAuthority":"Recommending Authority","conditions":"Debt consolidation review","trigger":{"field":"liveChits","op":">","value":3}},
      {"code":"DEV-008","type":"FI not completed on time","policyCategory":"Process Policy","riskLevel":"Low","approvalAuthority":"Hub Controller","conditions":"Documented reason required","trigger":{"field":"fiOverdue","op":"==","value":true}}
    ],
    approvalMatrix: [
      {"level":"L1","amountBand":{"min":0,"max":500000},"label":"Up to Rs. 5 Lakhs","authority":"Branch Manager"},
      {"level":"L2","amountBand":{"min":500000,"max":2500000},"label":"Rs. 5L - Rs. 25L","authority":"Hub Controller"},
      {"level":"L3","amountBand":{"min":2500000,"max":10000000},"label":"Rs. 25L - Rs. 1 Cr","authority":"Recommending Authority + Credit Head"},
      {"level":"L4","amountBand":{"min":10000000,"max":50000000},"label":"Rs. 1 Cr - Rs. 5 Cr","authority":"Credit Head + Business Approver"},
      {"level":"L5","amountBand":{"min":50000000,"max":null},"label":"Rs. 5 Cr+","authority":"MD / Board Committee"},
      {"level":"DEV-1","amountBand":{"min":null,"max":null},"label":"Any amount - policy deviation","authority":"Deviation Authority"},
      {"level":"DEV-2","amountBand":{"min":null,"max":null},"label":"High-risk deviation","authority":"Credit Head"}
    ],
    productConfig: {
      chitPeriods: [20, 25, 30, 40, 50, 60],
      chitAmountBands: [200000, 300000, 500000, 800000, 1200000, 2500000, 5000000],
      sourcingChannels: ["MFL", "DST", "Agent"],
      enrolmentTypes: ["New", "Substitution"],
      fiRequiredThreshold: 300000,
      deviationCibilThreshold: 700,
      foirCap: 0.6,
      camScoreBands: [
        {"min": 70, "max": 100, "grade": "A", "label": "Low Risk", "decision": "Auto approval"},
        {"min": 51, "max": 69, "grade": "B", "label": "Moderate Risk", "decision": "Approve with Conditions"},
        {"min": 40, "max": 50, "grade": "C", "label": "High Risk", "decision": "Strong Justification Required"},
        {"min": -100, "max": 39, "grade": "D", "label": "Reject", "decision": "Not Recommended"}
      ]
    },
    workflowStates: {
      roles: {
        "BI": {"label": "Branch Initiator", "dashboard": "branch-initiator-dashboard.html"},
        "BS": {"label": "Branch Scrutinizer", "dashboard": "branch-scrutinizer-dashboard.html"},
        "HUB": {"label": "Hub Controller", "dashboard": "credit-hub-dashboard.html"},
        "FI": {"label": "Field Investigator", "dashboard": "field-investigator-mobile.html"},
        "FC": {"label": "Credit Final Checker", "dashboard": "credit-final-checker.html"},
        "DEV": {"label": "Deviation Authority", "dashboard": "deviation-authority.html"},
        "RA": {"label": "Recommending Authority", "dashboard": "recommending-authority.html"},
        "CH": {"label": "Credit Head", "dashboard": "credit-head.html"},
        "FA": {"label": "Final Approval Authority", "dashboard": "final-approval.html"},
        "BA": {"label": "Business Approver", "dashboard": "business-approval.html"},
        "DISB": {"label": "Disbursement Team", "dashboard": "disbursement.html"},
        "ADMIN": {"label": "System Admin", "dashboard": "admin-dashboard.html"}
      },
      states: [
        {"code":"NEW","stage":0,"owner":"BI","action":"Application received","screen":"bi-create-application.html","sla":null},
        {"code":"ASSIGNED","stage":1,"owner":"BI","action":"Assign to BI staff","screen":"branch-initiator-dashboard.html","sla":null},
        {"code":"BRANCH_WIP","stage":2,"owner":"BI","action":"Fill application, docs, CIBIL, scorecard","screen":"bi-my-cases.html","sla":72},
        {"code":"SCRUTINY_PENDING","stage":3,"owner":"BS","action":"Verify documents","screen":"bs-verification-queue.html","sla":24},
        {"code":"DISPATCHED","stage":4,"owner":"BS","action":"Physical dispatch to hub","screen":"bs-dispatch.html","sla":24},
        {"code":"HUB_INWARD","stage":5,"owner":"HUB","action":"Inward scanning, acceptance","screen":"ch-inward.html","sla":8},
        {"code":"FI_INITIATED","stage":6,"owner":"FI","action":"Field visit assigned","screen":"fi-assigned-cases.html","sla":72},
        {"code":"FI_COMPLETED","stage":7,"owner":"FC","action":"FI report submitted, awaiting CAM","screen":"fc-verification-queue.html","sla":24},
        {"code":"FINAL_CHECK","stage":8,"owner":"FC","action":"CAM generation, security verify","screen":"credit-final-checker.html","sla":24},
        {"code":"DEVIATION_PENDING","stage":9,"owner":"DEV","action":"Deviation review","screen":"deviation-authority.html","sla":24},
        {"code":"CREDIT_REVIEW","stage":10,"owner":"RA","action":"Review and recommend","screen":"recommending-authority.html","sla":24},
        {"code":"IN_PRINCIPAL_APPROVED","stage":11,"owner":"CH","action":"Credit sanction decision","screen":"credit-head.html","sla":24},
        {"code":"FINAL_APPROVAL","stage":12,"owner":"FA","action":"High-value / deviation final sign-off","screen":"final-approval.html","sla":24},
        {"code":"BUSINESS_APPROVED","stage":13,"owner":"BA","action":"Final business sanction","screen":"business-approval.html","sla":24},
        {"code":"READY_DISBURSEMENT","stage":14,"owner":"DISB","action":"UTR generation, fund transfer","screen":"disbursement.html","sla":24},
        {"code":"CLOSED","stage":15,"owner":"SYSTEM","action":"Disbursement complete","screen":null,"sla":null,"terminal":true},
        {"code":"DECLINED","stage":-1,"owner":null,"action":"Case declined","screen":null,"sla":null,"terminal":true},
        {"code":"REVERTED","stage":-2,"owner":"BI","action":"Returned to Branch Initiator for correction","screen":"bi-my-cases.html","sla":48},
        {"code":"ADDITIONAL_SECURITY_REQUIRED","stage":-3,"owner":"BI","action":"Additional collateral required","screen":"bi-security-selection.html","sla":72},
        {"code":"ON_HOLD","stage":-4,"owner":null,"action":"Manually held, resume later","screen":null,"sla":null},
        {"code":"CANCELLED","stage":-5,"owner":null,"action":"Case cancelled","screen":null,"sla":null,"terminal":true},
        {"code":"EXPIRED","stage":-6,"owner":null,"action":"SLA expired, case auto-closed","screen":null,"sla":null,"terminal":true}
      ],
      transitions: {
        "NEW":            [{"action":"assign","target":"ASSIGNED","role":"BI"}],
        "ASSIGNED":       [{"action":"startApplication","target":"BRANCH_WIP","role":"BI"}],
        "BRANCH_WIP":     [{"action":"submitForScrutiny","target":"SCRUTINY_PENDING","role":"BI","guard":"documentsComplete"}],
        "SCRUTINY_PENDING": [
          {"action":"approveScrutiny","target":"DISPATCHED","role":"BS"},
          {"action":"returnToBI","target":"REVERTED","role":"BS"}
        ],
        "REVERTED":       [{"action":"resubmit","target":"BRANCH_WIP","role":"BI"}],
        "DISPATCHED":     [{"action":"inwardAtHub","target":"HUB_INWARD","role":"HUB"}],
        "HUB_INWARD": [
          {"action":"assignFI","target":"FI_INITIATED","role":"HUB","guard":"fiRequired"},
          {"action":"skipFI","target":"FINAL_CHECK","role":"HUB","guard":"fiNotRequired"}
        ],
        "FI_INITIATED": [
          {"action":"submitFIReport","target":"FI_COMPLETED","role":"FI"}
        ],
        "FI_COMPLETED": [
          {"action":"generateCAM","target":"FINAL_CHECK","role":"FC"},
          {"action":"rejectAfterFI","target":"REVERTED","role":"FC"},
          {"action":"negativeFI","target":"DECLINED","role":"FC"}
        ],
        "FINAL_CHECK": [
          {"action":"raiseDeviation","target":"DEVIATION_PENDING","role":"FC","guard":"deviationTriggered"},
          {"action":"forwardToCredit","target":"CREDIT_REVIEW","role":"FC","guard":"noDeviation"},
          {"action":"creditReject","target":"DECLINED","role":"FC"},
          {"action":"docMissing","target":"REVERTED","role":"FC"},
          {"action":"requireCollateral","target":"ADDITIONAL_SECURITY_REQUIRED","role":"FC"},
          {"action":"modifyLoanAmount","target":"FINAL_CHECK","role":"FC","recompute":true},
          {"action":"modifyROI","target":"FINAL_CHECK","role":"FC","recompute":true},
          {"action":"modifyTenure","target":"FINAL_CHECK","role":"FC","recompute":true}
        ],
        "ADDITIONAL_SECURITY_REQUIRED": [
          {"action":"collateralProvided","target":"FINAL_CHECK","role":"BI"}
        ],
        "DEVIATION_PENDING": [
          {"action":"approveDeviation","target":"CREDIT_REVIEW","role":"DEV"},
          {"action":"rejectDeviation","target":"FINAL_CHECK","role":"DEV"}
        ],
        "CREDIT_REVIEW": [
          {"action":"recommend","target":"IN_PRINCIPAL_APPROVED","role":"RA"},
          {"action":"recommendConditional","target":"IN_PRINCIPAL_APPROVED","role":"RA","conditional":true},
          {"action":"reject","target":"DECLINED","role":"RA"},
          {"action":"manualHold","target":"ON_HOLD","role":"RA"}
        ],
        "ON_HOLD": [
          {"action":"resume","target":"CREDIT_REVIEW","role":"RA"},
          {"action":"resumeBusiness","target":"BUSINESS_APPROVED","role":"BA"}
        ],
        "IN_PRINCIPAL_APPROVED": [
          {"action":"creditHeadApprove","target":"BUSINESS_APPROVED","role":"CH","guard":"noFinalApprovalNeeded"},
          {"action":"escalateFinal","target":"FINAL_APPROVAL","role":"CH","guard":"finalApprovalNeeded"},
          {"action":"creditHeadReject","target":"DECLINED","role":"CH"},
          {"action":"modifyLoanAmount","target":"IN_PRINCIPAL_APPROVED","role":"CH","recompute":true},
          {"action":"modifyROI","target":"IN_PRINCIPAL_APPROVED","role":"CH","recompute":true},
          {"action":"modifyTenure","target":"IN_PRINCIPAL_APPROVED","role":"CH","recompute":true}
        ],
        "FINAL_APPROVAL": [
          {"action":"finalApprove","target":"BUSINESS_APPROVED","role":"FA"},
          {"action":"finalReject","target":"DECLINED","role":"FA"}
        ],
        "BUSINESS_APPROVED": [
          {"action":"businessApprove","target":"READY_DISBURSEMENT","role":"BA"},
          {"action":"businessReject","target":"DECLINED","role":"BA"},
          {"action":"businessHold","target":"ON_HOLD","role":"BA"}
        ],
        "READY_DISBURSEMENT": [
          {"action":"disburse","target":"CLOSED","role":"DISB"},
          {"action":"retryDisbursement","target":"READY_DISBURSEMENT","role":"DISB","retry":true}
        ],
        "CLOSED": [], "DECLINED": [], "CANCELLED": [], "EXPIRED": []
      },
      universalActions: [
        {"action":"cancelCase","target":"CANCELLED","roles":["BI","ADMIN"]},
        {"action":"expireCase","target":"EXPIRED","roles":["ADMIN"]}
      ],
      scenarioIndex: [
        {"id":1,"name":"Normal Approval","path":"NEW>ASSIGNED>BRANCH_WIP>SCRUTINY_PENDING>DISPATCHED>HUB_INWARD>FI_INITIATED>FI_COMPLETED>FINAL_CHECK>CREDIT_REVIEW>IN_PRINCIPAL_APPROVED>BUSINESS_APPROVED>READY_DISBURSEMENT>CLOSED"},
        {"id":2,"name":"Rejected by Branch Scrutinizer, returned to BI, edits, resubmits","path":"SCRUTINY_PENDING>REVERTED>BRANCH_WIP>SCRUTINY_PENDING"},
        {"id":3,"name":"Rejected after FI, back to BI, revisit, submit","path":"FI_COMPLETED>REVERTED>BRANCH_WIP"},
        {"id":4,"name":"Credit Reject, Case Closed","path":"FINAL_CHECK>DECLINED"},
        {"id":5,"name":"Deviation Reject, back to Credit","path":"DEVIATION_PENDING>FINAL_CHECK"},
        {"id":6,"name":"Credit Head Reject, Case Closed","path":"IN_PRINCIPAL_APPROVED>DECLINED"},
        {"id":7,"name":"Business Reject, Case Closed","path":"BUSINESS_APPROVED>DECLINED"},
        {"id":8,"name":"Final Reject, Case Closed","path":"FINAL_APPROVAL>DECLINED"},
        {"id":9,"name":"Document Missing, back to BI, upload, submit","path":"FINAL_CHECK>REVERTED>BRANCH_WIP"},
        {"id":10,"name":"Poor Bureau, Conditional Approval","path":"CREDIT_REVIEW>recommendConditional>IN_PRINCIPAL_APPROVED"},
        {"id":11,"name":"Negative FI, Reject","path":"FI_COMPLETED>DECLINED"},
        {"id":12,"name":"Income Mismatch, back to BI","path":"SCRUTINY_PENDING>REVERTED>BRANCH_WIP"},
        {"id":13,"name":"Collateral Required, Pending","path":"FINAL_CHECK>ADDITIONAL_SECURITY_REQUIRED>FINAL_CHECK"},
        {"id":14,"name":"Manual Hold, Resume Later","path":"CREDIT_REVIEW>ON_HOLD>CREDIT_REVIEW"},
        {"id":15,"name":"Loan Modified, CAM Recalculate","path":"IN_PRINCIPAL_APPROVED>modifyLoanAmount>IN_PRINCIPAL_APPROVED"},
        {"id":16,"name":"ROI Changed, EMI Recalculate","path":"IN_PRINCIPAL_APPROVED>modifyROI>IN_PRINCIPAL_APPROVED"},
        {"id":17,"name":"Tenure Changed, FOIR Recalculate","path":"IN_PRINCIPAL_APPROVED>modifyTenure>IN_PRINCIPAL_APPROVED"},
        {"id":18,"name":"Deviation Approved, Continue Flow","path":"DEVIATION_PENDING>CREDIT_REVIEW"},
        {"id":19,"name":"Deviation Rejected, back to Credit Hub","path":"DEVIATION_PENDING>FINAL_CHECK"},
        {"id":20,"name":"Disbursement Failed, Retry","path":"READY_DISBURSEMENT>retryDisbursement>READY_DISBURSEMENT>disburse>CLOSED"}
      ]
    },
    rolesPermissions: {
      features: [
        "caseCreate","caseEdit","caseSubmit","caseViewOwn","caseViewAll",
        "docUpload","docVerify","docRequest",
        "caseApprove","caseReject","caseReturn","caseHold",
        "fiAssign","fiAccept","fiVisit","fiSubmitReport",
        "camView","camGenerate","camEdit","financialAnalysis","riskAnalysis",
        "deviationApprove","deviationReject",
        "loanModify","roiModify","tenureModify",
        "sanctionLetter","agreementGenerate","nachUpload","loanAccountGenerate","disburse",
        "adminUserManage","adminConfig","auditView","reportsView"
      ],
      matrix: {
        "BI":   ["caseCreate","caseEdit","caseSubmit","caseViewOwn","docUpload","reportsView"],
        "BS":   ["caseViewAll","caseApprove","caseReject","caseReturn","docVerify","docRequest","reportsView"],
        "HUB":  ["caseViewAll","docVerify","fiAssign","reportsView"],
        "FI":   ["fiAccept","fiVisit","fiSubmitReport","caseViewOwn","reportsView"],
        "FC":   ["caseViewAll","camView","camGenerate","camEdit","financialAnalysis","riskAnalysis","caseApprove","caseReject","caseReturn","reportsView"],
        "DEV":  ["caseViewAll","camView","deviationApprove","deviationReject","reportsView"],
        "RA":   ["caseViewAll","camView","camEdit","caseApprove","caseReject","caseHold","reportsView"],
        "CH":   ["caseViewAll","camView","camEdit","caseApprove","caseReject","loanModify","roiModify","tenureModify","reportsView"],
        "FA":   ["caseViewAll","camView","caseApprove","caseReject","reportsView"],
        "BA":   ["caseViewAll","camView","caseApprove","caseReject","caseHold","reportsView"],
        "DISB": ["caseViewAll","sanctionLetter","agreementGenerate","nachUpload","loanAccountGenerate","disburse","reportsView"],
        "ADMIN":["caseViewAll","camView","adminUserManage","adminConfig","auditView","reportsView"]
      }
    }
  };

  global.LOS_CONFIG = LOS_CONFIG;
})(window);
