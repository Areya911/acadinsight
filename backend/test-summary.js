const sqlitePool = require('./config/sqliteAdapter');

async function testSummary() {
  const highRisk = await sqlitePool.query(`
    SELECT u.id, u.name, rs.risk_score, rs.risk_level 
    FROM risk_scores rs JOIN users u ON rs.student_id = u.id 
    WHERE rs.risk_level = 'HIGH'
  `);
  console.log('HIGH RISK STUDENTS COUNT:', highRisk.rows.length);
  console.log('HIGH RISK STUDENTS:', highRisk.rows);

  const interventions = await sqlitePool.query(`
    SELECT i.id, i.intervention_type, i.status, u.name as student_name 
    FROM interventions i JOIN users u ON i.student_id = u.id
  `);
  console.log('INTERVENTIONS COUNT:', interventions.rows.length);
  console.log('INTERVENTIONS:', interventions.rows);
}

testSummary();
