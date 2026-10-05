module.exports = {
  GOOD_THRESHOLD: 75,
  AVERAGE_THRESHOLD: 50,
  RISK_HIGH: 60,
  RISK_MEDIUM: 30,
  WEIGHTS: {
    academicPerformance: 0.30,
    performanceTrend: 0.20,
    attendance: 0.15,
    assignmentCompletion: 0.10,
    activityEngagement: 0.10,
    weakSubjectCount: 0.10,
    recentDecline: 0.05
  },
  classifyScore: function(score) {
    if (score >= this.GOOD_THRESHOLD) return 'GOOD';
    if (score >= this.AVERAGE_THRESHOLD) return 'AVERAGE';
    return 'BAD';
  },
  classifyRisk: function(score) {
    if (score >= this.RISK_HIGH) return 'HIGH';
    if (score >= this.RISK_MEDIUM) return 'MEDIUM';
    return 'LOW';
  }
};
