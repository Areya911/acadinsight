const sqlitePool = require('./config/sqliteAdapter');
const bcrypt = require('bcryptjs');

async function initLocalDb() {
  console.log('🚀 Initializing Local Database (acadinsight.db)...');

  try {
    // 1. Create users table
    await sqlitePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
        year INTEGER,
        department TEXT,
        semester INTEGER,
        roll_number TEXT,
        batch TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create skill_scores table
    await sqlitePool.query(`
      CREATE TABLE IF NOT EXISTS skill_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        skill_name TEXT NOT NULL,
        score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
        category TEXT,
        test_score INTEGER DEFAULT 0,
        assignment_score INTEGER DEFAULT 0,
        quiz_score INTEGER DEFAULT 0,
        total_score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create semester_marks table
    await sqlitePool.query(`
      CREATE TABLE IF NOT EXISTS semester_marks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        semester INTEGER NOT NULL,
        subject_name TEXT NOT NULL,
        marks INTEGER NOT NULL,
        max_marks INTEGER NOT NULL DEFAULT 100,
        grade TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Create performance_config table
    await sqlitePool.query(`
      CREATE TABLE IF NOT EXISTS performance_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_key TEXT UNIQUE,
        config_value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await sqlitePool.query(`
      INSERT OR IGNORE INTO performance_config (config_key, config_value, description)
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
    `);

    // 5. Create student_performance table
    await sqlitePool.query(`
      CREATE TABLE IF NOT EXISTS student_performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        overall_score REAL,
        classification TEXT,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Create subject_performance table
    await sqlitePool.query(`
      CREATE TABLE IF NOT EXISTS subject_performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subject_name TEXT,
        semester INTEGER,
        score REAL,
        classification TEXT,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Create risk_scores table
    await sqlitePool.query(`
      CREATE TABLE IF NOT EXISTS risk_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        risk_score REAL,
        risk_level TEXT,
        previous_risk_score REAL,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Create risk_factors table
    await sqlitePool.query(`
      CREATE TABLE IF NOT EXISTS risk_factors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        academic_score REAL,
        trend_score REAL,
        attendance_score REAL,
        assignment_score REAL,
        engagement_score REAL,
        weak_subject_count INTEGER,
        recent_decline REAL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Create interventions table
    await sqlitePool.query(`
      CREATE TABLE IF NOT EXISTS interventions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        faculty_id INTEGER REFERENCES users(id),
        intervention_type TEXT,
        status TEXT DEFAULT 'Pending',
        notes TEXT,
        target_improvement TEXT,
        target_date DATE,
        before_risk_score REAL,
        current_risk_score REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 10. Create intervention_updates table
    await sqlitePool.query(`
      CREATE TABLE IF NOT EXISTS intervention_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        intervention_id INTEGER REFERENCES interventions(id) ON DELETE CASCADE,
        notes TEXT,
        performance_snapshot TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 11. Create performance_alerts table
    await sqlitePool.query(`
      CREATE TABLE IF NOT EXISTS performance_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        alert_type TEXT,
        message TEXT,
        severity TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 12. Create performance_history table
    await sqlitePool.query(`
      CREATE TABLE IF NOT EXISTS performance_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        semester INTEGER,
        avg_score REAL,
        risk_score REAL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 13. Create skills table
    await sqlitePool.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ All 13 Database tables ready.');

    // Clear existing data for fresh seed
    await sqlitePool.query(`DELETE FROM intervention_updates`);
    await sqlitePool.query(`DELETE FROM interventions`);
    await sqlitePool.query(`DELETE FROM performance_alerts`);
    await sqlitePool.query(`DELETE FROM performance_history`);
    await sqlitePool.query(`DELETE FROM risk_factors`);
    await sqlitePool.query(`DELETE FROM risk_scores`);
    await sqlitePool.query(`DELETE FROM subject_performance`);
    await sqlitePool.query(`DELETE FROM student_performance`);
    await sqlitePool.query(`DELETE FROM semester_marks`);
    await sqlitePool.query(`DELETE FROM skill_scores`);
    await sqlitePool.query(`DELETE FROM users`);

    const adminPass = await bcrypt.hash('admin123', 10);
    const facultyPass = await bcrypt.hash('faculty123', 10);
    const studentPass = await bcrypt.hash('student123', 10);

    const usersToSeed = [
      // Admins
      { name: 'Admin User', email: 'admin@academic.com', password: adminPass, role: 'admin' },
      { name: 'Admin User', email: 'admin@acadinsight.com', password: adminPass, role: 'admin' },
      
      // Faculty (10 Requested Faculty Members)
      { name: 'Prof. Karthikeyan S', email: 'karthikeyan@acadinsight.com', password: facultyPass, role: 'faculty', department: 'Computer Science' },
      { name: 'Prof. Meenakshi R', email: 'meenakshi@acadinsight.com', password: facultyPass, role: 'faculty', department: 'Computer Science' },
      { name: 'Prof. Suresh Kumar', email: 'suresh@acadinsight.com', password: facultyPass, role: 'faculty', department: 'Information Technology' },
      { name: 'Prof. Revathi M', email: 'revathi@acadinsight.com', password: facultyPass, role: 'faculty', department: 'Information Technology' },
      { name: 'Prof. Aravindhan P', email: 'aravindhan@acadinsight.com', password: facultyPass, role: 'faculty', department: 'Electronics' },
      { name: 'Prof. Priyanka S', email: 'priyanka@acadinsight.com', password: facultyPass, role: 'faculty', department: 'Computer Science' },
      { name: 'Prof. Gopinath K', email: 'gopinath@acadinsight.com', password: facultyPass, role: 'faculty', department: 'Information Technology' },
      { name: 'Prof. Janani R', email: 'janani@acadinsight.com', password: facultyPass, role: 'faculty', department: 'Electronics' },
      { name: 'Prof. Saravanan T', email: 'saravanan@acadinsight.com', password: facultyPass, role: 'faculty', department: 'Computer Science' },
      { name: 'Prof. Deepika V', email: 'deepika@acadinsight.com', password: facultyPass, role: 'faculty', department: 'Information Technology' },
      { name: 'Prof. Karthikeyan S', email: 'faculty@academic.com', password: facultyPass, role: 'faculty', department: 'Computer Science' },

      // Exactly 10 Students requested by user
      { name: 'Arjun Kumar', email: 'arjun@acadinsight.com', password: studentPass, role: 'student', year: 3, semester: 6, department: 'Computer Science', roll_number: 'CS2021001', batch: '2021-2025' },
      { name: 'Kavin Raj', email: 'kavin@acadinsight.com', password: studentPass, role: 'student', year: 2, semester: 4, department: 'Information Technology', roll_number: 'IT2022002', batch: '2022-2026' },
      { name: 'Harish Kumar', email: 'harish@acadinsight.com', password: studentPass, role: 'student', year: 3, semester: 6, department: 'Computer Science', roll_number: 'CS2021003', batch: '2021-2025' },
      { name: 'Vignesh S', email: 'vignesh@acadinsight.com', password: studentPass, role: 'student', year: 2, semester: 4, department: 'Electronics', roll_number: 'EC2022004', batch: '2022-2026' },
      { name: 'Ashwin Raj', email: 'ashwin@acadinsight.com', password: studentPass, role: 'student', year: 2, semester: 4, department: 'Information Technology', roll_number: 'IT2022005', batch: '2022-2026' },
      { name: 'Dharani M', email: 'dharani@acadinsight.com', password: studentPass, role: 'student', year: 3, semester: 6, department: 'Computer Science', roll_number: 'CS2021006', batch: '2021-2025' },
      { name: 'Keerthana S', email: 'keerthana@acadinsight.com', password: studentPass, role: 'student', year: 2, semester: 4, department: 'Information Technology', roll_number: 'IT2022007', batch: '2022-2026' },
      { name: 'Nivetha R', email: 'nivetha@acadinsight.com', password: studentPass, role: 'student', year: 3, semester: 5, department: 'Computer Science', roll_number: 'CS2021008', batch: '2021-2025' },
      { name: 'Swetha V', email: 'swetha@acadinsight.com', password: studentPass, role: 'student', year: 2, semester: 4, department: 'Electronics', roll_number: 'EC2022009', batch: '2022-2026' },
      { name: 'Divya K', email: 'divya@acadinsight.com', password: studentPass, role: 'student', year: 3, semester: 6, department: 'Information Technology', roll_number: 'IT2022010', batch: '2021-2025' }
    ];

    for (const u of usersToSeed) {
      await sqlitePool.query(`
        INSERT INTO users (name, email, password, role, year, department, semester, roll_number, batch)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [u.name, u.email, u.password, u.role, u.year || null, u.department || null, u.semester || null, u.roll_number || null, u.batch || null]);
    }

    console.log(`✅ Seeded ${usersToSeed.length} user accounts (Admins, Faculty, and 10 Students).`);

    // Student performance profiles
    const studentProfiles = {
      'Arjun Kumar': {
        weakCount: 3,
        currentSemMarks: [
          { subject: 'Operating Systems', score: 24 },
          { subject: 'Database Systems', score: 28 },
          { subject: 'Computer Networks', score: 34 },
          { subject: 'Data Structures', score: 44 }
        ],
        pastAvg: 68,
        skills: { attendance: 18, assignment: 20, quiz: 22, lab: 25 }
      },
      'Kavin Raj': {
        weakCount: 3,
        currentSemMarks: [
          { subject: 'Operating Systems', score: 26 },
          { subject: 'Algorithms', score: 30 },
          { subject: 'Mathematics', score: 36 },
          { subject: 'Web Development', score: 46 }
        ],
        pastAvg: 66,
        skills: { attendance: 20, assignment: 22, quiz: 24, lab: 28 }
      },
      'Harish Kumar': {
        weakCount: 2,
        currentSemMarks: [
          { subject: 'Computer Networks', score: 34 },
          { subject: 'Software Engineering', score: 42 },
          { subject: 'Data Structures', score: 54 },
          { subject: 'Database Systems', score: 58 }
        ],
        pastAvg: 65,
        skills: { attendance: 35, assignment: 38, quiz: 36, lab: 40 }
      },
      'Vignesh S': {
        weakCount: 1,
        currentSemMarks: [
          { subject: 'Mathematics', score: 44 },
          { subject: 'Database Systems', score: 56 },
          { subject: 'Algorithms', score: 62 },
          { subject: 'Data Structures', score: 68 }
        ],
        pastAvg: 64,
        skills: { attendance: 65, assignment: 68, quiz: 62, lab: 65 }
      },
      'Ashwin Raj': {
        weakCount: 1,
        currentSemMarks: [
          { subject: 'Algorithms', score: 46 },
          { subject: 'Operating Systems', score: 58 },
          { subject: 'Web Development', score: 64 },
          { subject: 'Computer Networks', score: 68 }
        ],
        pastAvg: 65,
        skills: { attendance: 68, assignment: 70, quiz: 64, lab: 68 }
      },
      'Dharani M': {
        weakCount: 0,
        currentSemMarks: [
          { subject: 'Operating Systems', score: 78 },
          { subject: 'Database Systems', score: 82 },
          { subject: 'Computer Networks', score: 76 },
          { subject: 'Data Structures', score: 85 }
        ],
        pastAvg: 80,
        skills: { attendance: 90, assignment: 92, quiz: 88, lab: 91 }
      },
      'Keerthana S': {
        weakCount: 0,
        currentSemMarks: [
          { subject: 'Algorithms', score: 84 },
          { subject: 'Operating Systems', score: 88 },
          { subject: 'Web Development', score: 80 },
          { subject: 'Computer Networks', score: 82 }
        ],
        pastAvg: 85,
        skills: { attendance: 94, assignment: 95, quiz: 90, lab: 93 }
      },
      'Nivetha R': {
        weakCount: 0,
        currentSemMarks: [
          { subject: 'Software Engineering', score: 78 },
          { subject: 'Database Systems', score: 80 },
          { subject: 'Mathematics', score: 82 },
          { subject: 'Data Structures', score: 84 }
        ],
        pastAvg: 81,
        skills: { attendance: 88, assignment: 90, quiz: 85, lab: 89 }
      },
      'Swetha V': {
        weakCount: 0,
        currentSemMarks: [
          { subject: 'Operating Systems', score: 86 },
          { subject: 'Database Systems', score: 90 },
          { subject: 'Algorithms', score: 88 },
          { subject: 'Computer Networks', score: 92 }
        ],
        pastAvg: 89,
        skills: { attendance: 95, assignment: 96, quiz: 92, lab: 94 }
      },
      'Divya K': {
        weakCount: 0,
        currentSemMarks: [
          { subject: 'Operating Systems', score: 90 },
          { subject: 'Database Systems', score: 92 },
          { subject: 'Web Development', score: 94 },
          { subject: 'Software Engineering', score: 96 }
        ],
        pastAvg: 93,
        skills: { attendance: 98, assignment: 97, quiz: 95, lab: 96 }
      }
    };

    const studentRes = await sqlitePool.query(`SELECT id, name, semester FROM users WHERE role = 'student'`);
    const allSubjects = ['Data Structures', 'Algorithms', 'Database Systems', 'Web Development', 'Operating Systems', 'Mathematics', 'Computer Networks', 'Software Engineering'];

    for (const s of studentRes.rows) {
      const studentId = s.id;
      const studentName = s.name;
      const sem = s.semester || 4;
      const profile = studentProfiles[studentName];

      if (!profile) continue;

      // Seed past semesters
      for (let semIdx = 1; semIdx < sem; semIdx++) {
        for (let subIdx = 0; subIdx < 4; subIdx++) {
          const subName = allSubjects[(studentId + semIdx + subIdx) % allSubjects.length];
          const scoreVal = profile.pastAvg + ((subIdx * 3) % 7) - 3;
          const gradeVal = scoreVal >= 80 ? 'A' : scoreVal >= 65 ? 'B' : scoreVal >= 50 ? 'C' : 'F';
          await sqlitePool.query(`
            INSERT INTO semester_marks (student_id, semester, subject_name, marks, max_marks, grade)
            VALUES ($1, $2, $3, $4, 100, $5)
          `, [studentId, semIdx, subName, scoreVal, gradeVal]);
        }
      }

      // Seed current semester
      for (const m of profile.currentSemMarks) {
        const gradeVal = m.score >= 80 ? 'A' : m.score >= 65 ? 'B' : m.score >= 50 ? 'C' : 'F';
        await sqlitePool.query(`
          INSERT INTO semester_marks (student_id, semester, subject_name, marks, max_marks, grade)
          VALUES ($1, $2, $3, $4, 100, $5)
        `, [studentId, sem, m.subject, m.score, gradeVal]);
      }

      // Seed skill scores
      const skillsToSeed = [
        { name: 'Attendance', cat: 'General', score: profile.skills.attendance },
        { name: 'Assignment Completion', cat: 'General', score: profile.skills.assignment },
        { name: 'Quiz Performance', cat: 'Technical', score: profile.skills.quiz },
        { name: 'Lab Work', cat: 'Practical', score: profile.skills.lab }
      ];

      for (const sk of skillsToSeed) {
        await sqlitePool.query(`
          INSERT INTO skill_scores (user_id, skill_name, category, score, test_score, assignment_score, quiz_score, total_score)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [studentId, sk.name, sk.cat, sk.score, sk.score, sk.score, sk.score, sk.score]);
      }
    }

    console.log('✅ Semester marks & skill scores seeded for all 10 students.');

    // Calculate initial risk scores for all students
    const { recalculateAll } = require('./services/performanceEngine');
    const recalcRes = await recalculateAll();
    console.log(`✅ Calculated risk scores for ${recalcRes.updated_count} students.`);

    // Set previous_risk_score lower for students so increasing_risk table is populated
    await sqlitePool.query(`
      UPDATE risk_scores 
      SET previous_risk_score = CASE 
        WHEN risk_level = 'HIGH' THEN risk_score - 24
        WHEN risk_level = 'MEDIUM' THEN risk_score - 16
        WHEN student_id IN (SELECT id FROM users WHERE name IN ('Vignesh S', 'Ashwin Raj')) THEN risk_score - 12
        ELSE risk_score
      END
    `);
    console.log('✅ Updated students with increasing risk.');

    // Generate alerts for high & increasing risk students
    const highRiskStudents = await sqlitePool.query(`
      SELECT u.id, u.name, rs.risk_score, rs.previous_risk_score 
      FROM risk_scores rs 
      JOIN users u ON rs.student_id = u.id 
      WHERE rs.risk_score > rs.previous_risk_score
      ORDER BY (rs.risk_score - rs.previous_risk_score) DESC
    `);

    for (const st of highRiskStudents.rows) {
      await sqlitePool.query(`
        INSERT INTO performance_alerts (student_id, alert_type, message, severity, is_read)
        VALUES ($1, $2, $3, $4, 0)
      `, [st.id, 'RISK INCREASED', `Risk score increased significantly from ${st.previous_risk_score}% to ${st.risk_score}%. Immediate faculty intervention advised.`, 'high']);
    }

    // Seed interventions for high-risk students
    const facultyRes = await sqlitePool.query(`SELECT id, name FROM users WHERE role = 'faculty' LIMIT 2`);
    const fac1 = facultyRes.rows[0]?.id || 3;
    const fac2 = facultyRes.rows[1]?.id || 4;

    const sampleInterventions = [
      { type: 'Subject Remedial Session', status: 'In Progress', notes: 'Weekly 1-on-1 tutoring in Operating Systems and Database Systems.', target: 'Improve OS & DBMS marks to >60%', daysAhead: 14, diff: 15 },
      { type: 'Academic Mentoring', status: 'Pending', notes: 'Assigned senior peer mentor for weekly progress review.', target: 'Improve assignment submission rate to 90%', daysAhead: 30, diff: 0 },
      { type: 'Attendance Follow-up', status: 'In Progress', notes: 'Contacted parents regarding low class attendance. Counseling scheduled.', target: 'Maintain 85%+ attendance in all classes', daysAhead: 21, diff: 10 }
    ];

    let insertedInvCount = 0;
    for (let i = 0; i < Math.min(3, highRiskStudents.rows.length); i++) {
      const student = highRiskStudents.rows[i];
      const inv = sampleInterventions[i % sampleInterventions.length];
      const facId = i % 2 === 0 ? fac1 : fac2;
      const beforeRisk = Math.min(95, Math.round(student.risk_score + (inv.diff || 10)));
      const currentRisk = Math.round(student.risk_score);

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + inv.daysAhead);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      const res = await sqlitePool.query(`
        INSERT INTO interventions (student_id, faculty_id, intervention_type, status, notes, target_improvement, target_date, before_risk_score, current_risk_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [student.id, facId, inv.type, inv.status, inv.notes, inv.target, targetDateStr, beforeRisk, currentRisk]);

      const invId = res.rows[0]?.id;
      if (invId) {
        insertedInvCount++;
        await sqlitePool.query(`
          INSERT INTO intervention_updates (intervention_id, notes, performance_snapshot)
          VALUES ($1, $2, $3)
        `, [invId, `Initial assessment completed. Risk score evaluated at ${beforeRisk}%.`, JSON.stringify({ risk: beforeRisk })]);

        await sqlitePool.query(`
          INSERT INTO intervention_updates (intervention_id, notes, performance_snapshot)
          VALUES ($1, $2, $3)
        `, [invId, `Progress review meeting conducted. Current risk score: ${currentRisk}%.`, JSON.stringify({ risk: currentRisk })]);
      }
    }

    console.log(`✅ Seeded ${insertedInvCount} interventions with timeline updates.`);
    console.log('🎉 Local database initialization complete with 10 students!');
  } catch (err) {
    console.error('❌ Local database init error:', err);
  }
}

initLocalDb();
