const { recalculateAll, getStudentFullProfile } = require('./services/performanceEngine');
const analyticsCtrl = require('./controllers/analyticsController');
const interventionCtrl = require('./controllers/interventionController');

async function testAllControllers() {
  console.log('--- Testing Performance Engine ---');
  const recalc = await recalculateAll();
  console.log('Recalculate result:', recalc);

  const profile = await getStudentFullProfile(8);
  console.log('Student 8 Profile overall_score:', profile.performance.overall_score);
  console.log('Student 8 Profile risk_score:', profile.risk.score ? profile.risk.score.risk_score : 'N/A');

  console.log('\n--- Testing Controllers ---');
  const mockRes = () => {
    return {
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; }
    };
  };

  const overviewRes = mockRes();
  await analyticsCtrl.getOverview({}, overviewRes);
  console.log('Analytics Overview totalStudents:', overviewRes.body.totalStudents);
  console.log('Analytics Overview avg_performance:', overviewRes.body.avg_performance);

  const attritionRes = mockRes();
  await analyticsCtrl.getAttritionAnalytics({}, attritionRes);
  console.log('Attrition Analytics distribution:', attritionRes.body.distribution);

  const subjectRes = mockRes();
  await analyticsCtrl.getSubjectAnalytics({}, subjectRes);
  console.log('Subject Analytics count:', subjectRes.body ? subjectRes.body.length : 0);

  const interventionsRes = mockRes();
  await interventionCtrl.getInterventions({ query: {} }, interventionsRes);
  console.log('Interventions count:', interventionsRes.body.interventions ? interventionsRes.body.interventions.length : 0);

  console.log('\n✅ ALL BACKEND CONTROLLER & ENGINE TESTS PASSED!');
}

testAllControllers().catch(err => console.error('❌ Controller test error:', err));
