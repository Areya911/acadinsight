require('dotenv').config({ path: require('path').join(__dirname, '../.env.utf8') });
const pool = require('../config/db');

async function runMigration() {
  try {
    console.log('🔧 Running migration: Creating performance tables...\n');

    // 1. performance_config
    await pool.query(`
      CREATE TABLE IF NOT EXISTS performance_config (
        id SERIAL PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE,
        config_value VARCHAR(255),
        description TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO performance_config (config_key, config_value, description)
      VALUES 
        ('GOOD_THRESHOLD', '75', 'Threshold for good performance'),
        ('AVERAGE_THRESHOLD', '50', 'Threshold for average performance'),
        ('RISK_HIGH', '60', 'Threshold for high risk'),
        ('RISK_MEDIUM', '30', 'Threshold for medium risk'),
        ('WEIGHT_ACADEMIC', '30', 'Weight for academic performance in risk calculation'),
        ('WEIGHT_TREND', '20', 'Weight for performance trend'),
        ('WEIGHT_ATTENDANCE', '15', 'Weight for attendance'),
        ('WEIGHT_ASSIGNMENT', '10', 'Weight for assignments'),
        ('WEIGHT_ENGAGEMENT', '10', 'Weight for engagement'),
        ('WEIGHT_WEAK_COUNT', '10', 'Weight for weak subject count'),
        ('WEIGHT_DECLINE', '5', 'Weight for recent decline')
      ON CONFLICT (config_key) DO NOTHING
    `);
    console.log('✅ performance_config table ready');

    // 2. student_performance
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_performance (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        overall_score NUMERIC(5,2),
        classification VARCHAR(20),
        calculated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(student_id)
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_student_perf_score ON student_performance(overall_score)`);
    console.log('✅ student_performance table ready');

    // 3. subject_performance
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subject_performance (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subject_name VARCHAR(100),
        semester INTEGER,
        score NUMERIC(5,2),
        classification VARCHAR(20),
        calculated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_subject_perf_student ON subject_performance(student_id)`);
    console.log('✅ subject_performance table ready');

    // 4. risk_scores
    await pool.query(`
      CREATE TABLE IF NOT EXISTS risk_scores (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        risk_score NUMERIC(5,2),
        risk_level VARCHAR(20),
        previous_risk_score NUMERIC(5,2),
        calculated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_risk_scores_level ON risk_scores(risk_level)`);
    console.log('✅ risk_scores table ready');

    // 5. risk_factors
    await pool.query(`
      CREATE TABLE IF NOT EXISTS risk_factors (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        academic_score NUMERIC(5,2),
        trend_score NUMERIC(5,2),
        attendance_score NUMERIC(5,2),
        assignment_score NUMERIC(5,2),
        engagement_score NUMERIC(5,2),
        weak_subject_count INTEGER,
        recent_decline NUMERIC(5,2),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ risk_factors table ready');

    // 6. interventions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS interventions (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        faculty_id INTEGER REFERENCES users(id),
        intervention_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Pending',
        notes TEXT,
        target_improvement TEXT,
        target_date DATE,
        before_risk_score NUMERIC(5,2),
        current_risk_score NUMERIC(5,2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_interventions_student ON interventions(student_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status)`);
    console.log('✅ interventions table ready');

    // 7. intervention_updates
    await pool.query(`
      CREATE TABLE IF NOT EXISTS intervention_updates (
        id SERIAL PRIMARY KEY,
        intervention_id INTEGER REFERENCES interventions(id) ON DELETE CASCADE,
        notes TEXT,
        performance_snapshot JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ intervention_updates table ready');

    // 8. performance_alerts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS performance_alerts (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        alert_type VARCHAR(100),
        message TEXT,
        severity VARCHAR(20) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_alerts_student_read ON performance_alerts(student_id, is_read)`);
    console.log('✅ performance_alerts table ready');

    // 9. performance_history
    await pool.query(`
      CREATE TABLE IF NOT EXISTS performance_history (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        semester INTEGER,
        avg_score NUMERIC(5,2),
        risk_score NUMERIC(5,2),
        recorded_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_history_student ON performance_history(student_id)`);
    console.log('✅ performance_history table ready');

    console.log('\n🎉 Migration successful: All 9 performance tables created.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

runMigration();
