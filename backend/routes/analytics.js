const express = require('express');
const router = express.Router();
const { auth, roleCheck } = require('../middleware/auth');
const ctrl = require('../controllers/analyticsController');
const pool = require('../config/db');

// One-time migration endpoint — creates all performance tables via live server connection
router.post('/migrate', async (req, res) => {
  try {
    const secret = req.headers['x-migrate-secret'];
    if (secret !== 'acadinsight-migrate-2024') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const steps = [];

    await pool.query(`CREATE TABLE IF NOT EXISTS performance_config (id SERIAL PRIMARY KEY, config_key VARCHAR(100) UNIQUE, config_value VARCHAR(255), description TEXT, updated_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`INSERT INTO performance_config (config_key, config_value, description) VALUES ('GOOD_THRESHOLD','75','Good performance threshold'),('AVERAGE_THRESHOLD','50','Average performance threshold'),('RISK_HIGH','60','High risk threshold'),('RISK_MEDIUM','30','Medium risk threshold'),('WEIGHT_ACADEMIC','30','Academic weight'),('WEIGHT_TREND','20','Trend weight'),('WEIGHT_ATTENDANCE','15','Attendance weight'),('WEIGHT_ASSIGNMENT','10','Assignment weight'),('WEIGHT_ENGAGEMENT','10','Engagement weight'),('WEIGHT_WEAK_COUNT','10','Weak count weight'),('WEIGHT_DECLINE','5','Decline weight') ON CONFLICT (config_key) DO NOTHING`);
    steps.push('performance_config');

    await pool.query(`CREATE TABLE IF NOT EXISTS student_performance (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES users(id) ON DELETE CASCADE, overall_score NUMERIC(5,2), classification VARCHAR(20), calculated_at TIMESTAMP DEFAULT NOW(), UNIQUE(student_id))`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_student_perf_score ON student_performance(overall_score)`);
    steps.push('student_performance');

    await pool.query(`CREATE TABLE IF NOT EXISTS subject_performance (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES users(id) ON DELETE CASCADE, subject_name VARCHAR(100), semester INTEGER, score NUMERIC(5,2), classification VARCHAR(20), calculated_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_subject_perf_student ON subject_performance(student_id)`);
    steps.push('subject_performance');

    await pool.query(`CREATE TABLE IF NOT EXISTS risk_scores (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE, risk_score NUMERIC(5,2), risk_level VARCHAR(20), previous_risk_score NUMERIC(5,2), calculated_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_risk_scores_level ON risk_scores(risk_level)`);
    steps.push('risk_scores');

    await pool.query(`CREATE TABLE IF NOT EXISTS risk_factors (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE, academic_score NUMERIC(5,2), trend_score NUMERIC(5,2), attendance_score NUMERIC(5,2), assignment_score NUMERIC(5,2), engagement_score NUMERIC(5,2), weak_subject_count INTEGER, recent_decline NUMERIC(5,2), updated_at TIMESTAMP DEFAULT NOW())`);
    steps.push('risk_factors');

    await pool.query(`CREATE TABLE IF NOT EXISTS interventions (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES users(id) ON DELETE CASCADE, faculty_id INTEGER REFERENCES users(id), intervention_type VARCHAR(100), status VARCHAR(50) DEFAULT 'Pending', notes TEXT, target_improvement TEXT, target_date DATE, before_risk_score NUMERIC(5,2), current_risk_score NUMERIC(5,2), created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_interventions_student ON interventions(student_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status)`);
    steps.push('interventions');

    await pool.query(`CREATE TABLE IF NOT EXISTS intervention_updates (id SERIAL PRIMARY KEY, intervention_id INTEGER REFERENCES interventions(id) ON DELETE CASCADE, notes TEXT, performance_snapshot JSONB, created_at TIMESTAMP DEFAULT NOW())`);
    steps.push('intervention_updates');

    await pool.query(`CREATE TABLE IF NOT EXISTS performance_alerts (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES users(id) ON DELETE CASCADE, alert_type VARCHAR(100), message TEXT, severity VARCHAR(20) DEFAULT 'info', is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_alerts_student_read ON performance_alerts(student_id, is_read)`);
    steps.push('performance_alerts');

    await pool.query(`CREATE TABLE IF NOT EXISTS performance_history (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES users(id) ON DELETE CASCADE, semester INTEGER, avg_score NUMERIC(5,2), risk_score NUMERIC(5,2), recorded_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_history_student ON performance_history(student_id)`);
    steps.push('performance_history');

    res.json({ success: true, message: 'Migration complete', tables_created: steps });
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/overview', auth, roleCheck('admin', 'faculty'), ctrl.getOverview);
router.get('/students', auth, roleCheck('admin', 'faculty'), ctrl.getAllStudentsAnalytics);
router.get('/students/:id', auth, ctrl.getStudentProfile);
router.get('/students/:id/risk', auth, ctrl.getStudentRisk);
router.get('/students/:id/weak-areas', auth, ctrl.getStudentWeakAreas);
router.get('/students/:id/roadmap', auth, ctrl.getStudentRoadmap);
router.get('/subjects', auth, roleCheck('admin', 'faculty'), ctrl.getSubjectAnalytics);
router.get('/attrition', auth, roleCheck('admin', 'faculty'), ctrl.getAttritionAnalytics);
router.get('/alerts', auth, ctrl.getAllAlerts);
router.put('/alerts/:id/read', auth, ctrl.markAlertRead);
router.post('/recalculate', auth, roleCheck('admin', 'faculty'), ctrl.recalculate);

module.exports = router;
