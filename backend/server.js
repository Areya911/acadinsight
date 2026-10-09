const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env.utf8') });
require('dotenv').config(); // fallback for standard .env

const pool = require('./config/db');
const authRoutes = require('./routes/auth');
const skillRoutes = require('./routes/skills');
const studentRoutes = require('./routes/students');
const studentProfileRoutes = require('./routes/studentProfile');
const analyticsRoutes = require('./routes/analytics');
const interventionRoutes = require('./routes/interventions');

const app = express();

// Flexible CORS for local dev and Render deployments
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5006',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o)) || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', skillRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/student', studentProfileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/interventions', interventionRoutes);

// Health check endpoints for Render zero-downtime deployment monitoring
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() }));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() }));

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.json({ db: 'connected', result });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/test-env', (req, res) => {
  res.json({
    node_env: process.env.NODE_ENV,
    database_url: process.env.DATABASE_URL ? 'set' : 'not set',
    jwt_secret: process.env.JWT_SECRET ? 'set' : 'not set',
    frontend_url: process.env.FRONTEND_URL || 'not set'
  });
});

// Auto-migration: creates all base tables and performance analytics tables
async function runStartupMigration() {
  try {
    // 1. Core Users Table
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
      year INTEGER,
      department VARCHAR(100),
      semester INTEGER,
      roll_number VARCHAR(100),
      batch VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);

    // 2. Skill Scores Table
    await pool.query(`CREATE TABLE IF NOT EXISTS skill_scores (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      skill_name VARCHAR(255) NOT NULL,
      score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
      category VARCHAR(100),
      test_score INTEGER DEFAULT 0,
      assignment_score INTEGER DEFAULT 0,
      quiz_score INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_skill_scores_user_id ON skill_scores(user_id)`);

    // 3. Semester Marks Table
    await pool.query(`CREATE TABLE IF NOT EXISTS semester_marks (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      semester INTEGER NOT NULL,
      subject_name VARCHAR(255) NOT NULL,
      marks INTEGER NOT NULL,
      max_marks INTEGER NOT NULL DEFAULT 100,
      grade VARCHAR(10),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_semester_marks_student ON semester_marks(student_id)`);

    // 4. Performance Analytics Tables
    await pool.query(`CREATE TABLE IF NOT EXISTS performance_config (id SERIAL PRIMARY KEY, config_key VARCHAR(100) UNIQUE, config_value VARCHAR(255), description TEXT, updated_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`INSERT INTO performance_config (config_key, config_value, description) VALUES ('GOOD_THRESHOLD','75','Good threshold'),('AVERAGE_THRESHOLD','50','Average threshold'),('RISK_HIGH','60','High risk threshold'),('RISK_MEDIUM','30','Medium risk threshold'),('WEIGHT_ACADEMIC','30','Academic weight'),('WEIGHT_TREND','20','Trend weight'),('WEIGHT_ATTENDANCE','15','Attendance weight'),('WEIGHT_ASSIGNMENT','10','Assignment weight'),('WEIGHT_ENGAGEMENT','10','Engagement weight'),('WEIGHT_WEAK_COUNT','10','Weak count weight'),('WEIGHT_DECLINE','5','Decline weight') ON CONFLICT (config_key) DO NOTHING`);
    await pool.query(`CREATE TABLE IF NOT EXISTS student_performance (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES users(id) ON DELETE CASCADE, overall_score NUMERIC(5,2), classification VARCHAR(20), calculated_at TIMESTAMP DEFAULT NOW(), UNIQUE(student_id))`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_student_perf_score ON student_performance(overall_score)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS subject_performance (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES users(id) ON DELETE CASCADE, subject_name VARCHAR(100), semester INTEGER, score NUMERIC(5,2), classification VARCHAR(20), calculated_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_subject_perf_student ON subject_performance(student_id)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS risk_scores (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE, risk_score NUMERIC(5,2), risk_level VARCHAR(20), previous_risk_score NUMERIC(5,2), calculated_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_risk_scores_level ON risk_scores(risk_level)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS risk_factors (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE, academic_score NUMERIC(5,2), trend_score NUMERIC(5,2), attendance_score NUMERIC(5,2), assignment_score NUMERIC(5,2), engagement_score NUMERIC(5,2), weak_subject_count INTEGER, recent_decline NUMERIC(5,2), updated_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE TABLE IF NOT EXISTS interventions (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES users(id) ON DELETE CASCADE, faculty_id INTEGER REFERENCES users(id), intervention_type VARCHAR(100), status VARCHAR(50) DEFAULT 'Pending', notes TEXT, target_improvement TEXT, target_date DATE, before_risk_score NUMERIC(5,2), current_risk_score NUMERIC(5,2), created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_interventions_student ON interventions(student_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS intervention_updates (id SERIAL PRIMARY KEY, intervention_id INTEGER REFERENCES interventions(id) ON DELETE CASCADE, notes TEXT, performance_snapshot JSONB, created_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE TABLE IF NOT EXISTS performance_alerts (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES users(id) ON DELETE CASCADE, alert_type VARCHAR(100), message TEXT, severity VARCHAR(20) DEFAULT 'info', is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_alerts_student_read ON performance_alerts(student_id, is_read)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS performance_history (id SERIAL PRIMARY KEY, student_id INTEGER REFERENCES users(id) ON DELETE CASCADE, semester INTEGER, avg_score NUMERIC(5,2), risk_score NUMERIC(5,2), recorded_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_history_student ON performance_history(student_id)`);

    // 5. Check if seed accounts exist; if users table is empty, auto-create initial admin & faculty
    const userCheck = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const adminCount = parseInt(userCheck.rows[0]?.count || 0, 10);
    if (adminCount === 0) {
      const bcrypt = require('bcryptjs');
      const adminHash = await bcrypt.hash('admin123', 10);
      const facultyHash = await bcrypt.hash('faculty123', 10);
      await pool.query(
        `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
        ['Admin User', 'admin@acadinsight.com', adminHash, 'admin']
      );
      await pool.query(
        `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
        ['Dr. Rajesh Kumar', 'dr.kumar@acadinsight.com', facultyHash, 'faculty']
      );
      await pool.query(
        `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
        ['Prof. Anjali Sharma', 'prof.sharma@acadinsight.com', facultyHash, 'faculty']
      );
      console.log('Default Admin & Faculty accounts verified/seeded');
    }

    console.log('Database tables verified and ready');
  } catch (err) {
    console.error('Migration warning:', err.message);
  }
}

// Optional Unified Service: Serve frontend static build if frontend/dist exists
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  console.log('Serving production frontend build from', frontendDist);
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await runStartupMigration();
});
