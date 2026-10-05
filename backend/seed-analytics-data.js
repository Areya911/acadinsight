require('dotenv').config({ path: require('path').join(__dirname, '.env.utf8') });
const pool = require('./config/db');
const bcrypt = require('bcryptjs');
const { recalculateAll } = require('./services/performanceEngine');

async function seedData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Seeding data...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const facultyPassword = await bcrypt.hash('faculty123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);

    // 1. Admin and Faculty
    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Admin User', 'admin@acadinsight.com', hashedPassword, 'admin']);

    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Dr. Rajesh Kumar', 'dr.kumar@acadinsight.com', facultyPassword, 'faculty']);

    await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Prof. Anjali Sharma', 'prof.sharma@acadinsight.com', facultyPassword, 'faculty']);

    // 2. Students
    const depts = ['CSE', 'IT', 'ECE'];
    const batches = ['2022-2026', '2023-2027'];
    const subjects = ['Mathematics', 'Data Structures', 'Algorithms', 'DBMS', 'Operating Systems', 'Computer Networks', 'Web Development', 'Software Engineering', 'Programming Fundamentals', 'Discrete Mathematics', 'Linear Algebra', 'Computer Architecture', 'Microprocessors', 'Digital Electronics', 'Python Programming', 'Java Programming', 'Machine Learning', 'Artificial Intelligence'];
    const skillsList = ['Attendance', 'Assignment Completion', 'Quiz Performance', 'Lab Work', 'Peer Collaboration', 'Project Work'];

    const studentsToCreate = [
      ...Array(8).fill('GOOD'),
      ...Array(10).fill('AVERAGE'),
      ...Array(7).fill('BAD')
    ];

    const studentIds = [];
    
    for (let i = 0; i < studentsToCreate.length; i++) {
      const profile = studentsToCreate[i];
      const dept = depts[i % depts.length];
      const batch = batches[i % batches.length];
      const year = batch === '2022-2026' ? 3 : 2;
      const currentSem = year * 2;
      
      const email = \`student\${i+1}@acadinsight.com\`;
      
      const res = await client.query(`
        INSERT INTO users (name, email, password, role, department, semester, year, batch, roll_number)
        VALUES ($1, $2, $3, 'student', $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id
      `, [\`Student Name \${i+1}\`, email, studentPassword, dept, currentSem, year, batch, \`ROLL\${100+i}\`]);
      
      const studentId = res.rows[0].id;
      studentIds.push({ id: studentId, profile, currentSem });

      // Clean existing data for idempotency
      await client.query('DELETE FROM semester_marks WHERE student_id = $1', [studentId]);
      await client.query('DELETE FROM skill_scores WHERE user_id = $1', [studentId]);
      
      // 3. Semester Marks
      for (let sem = 1; sem <= currentSem; sem++) {
        const numSubjects = 5;
        let isDeclining = (sem === currentSem && i % 3 === 0 && profile !== 'GOOD');
        let isImproving = (sem === currentSem && i % 4 === 0 && profile === 'BAD');
        
        for (let s = 0; s < numSubjects; s++) {
          const sub = subjects[(i + s + sem) % subjects.length];
          let marks = 0;
          
          if (profile === 'GOOD') {
            marks = Math.floor(Math.random() * 21) + 75; // 75-95
          } else if (profile === 'AVERAGE') {
            marks = Math.floor(Math.random() * 25) + 50; // 50-74
          } else {
            marks = Math.floor(Math.random() * 31) + 25; // 25-55
          }
          
          if (isDeclining) marks -= 15;
          if (isImproving) marks += 15;
          
          marks = Math.max(0, Math.min(100, marks));
          
          await client.query(`
            INSERT INTO semester_marks (student_id, semester, subject_name, marks, max_marks)
            VALUES ($1, $2, $3, $4, 100)
          `, [studentId, sem, sub, marks]);
        }
      }

      // 4. Skills
      let specialCase = (profile === 'GOOD' && i === 0);
      for (const skill of skillsList) {
        let score = 0;
        if (specialCase && skill === 'Attendance') {
          score = 45;
        } else if (profile === 'GOOD') {
          score = Math.floor(Math.random() * 16) + 75;
        } else if (profile === 'AVERAGE') {
          score = Math.floor(Math.random() * 26) + 50;
        } else {
          score = Math.floor(Math.random() * 31) + 30;
        }
        
        await client.query(`
          INSERT INTO skill_scores (user_id, skill_name, category, score)
          VALUES ($1, $2, $3, $4)
        `, [studentId, skill, 'General', score]);
      }
    }

    await client.query('COMMIT');
    console.log(`Created ${studentIds.length} students with data.`);

    // 5. Recalculate
    console.log('Recalculating all risks...');
    const result = await recalculateAll();
    console.log(`Recalculated for ${result.updated_count} students.`);

    // 6. Interventions
    const highRiskRes = await client.query(`SELECT student_id FROM risk_scores WHERE risk_level = 'HIGH' LIMIT 3`);
    const mediumRiskRes = await client.query(`SELECT student_id FROM risk_scores WHERE risk_level = 'MEDIUM' LIMIT 1`);
    const facultyRes = await client.query(`SELECT id FROM users WHERE role = 'faculty' LIMIT 1`);
    const facId = facultyRes.rows[0].id;

    if (highRiskRes.rows.length >= 3) {
      const s1 = highRiskRes.rows[0].student_id;
      const s2 = highRiskRes.rows[1].student_id;
      const s3 = highRiskRes.rows[2].student_id;
      
      await pool.query(`
        INSERT INTO interventions (student_id, faculty_id, intervention_type, status, notes, current_risk_score)
        VALUES ($1, $2, 'Counseling', 'In Progress', 'Needs support', 80)
      `, [s1, facId]);

      await pool.query(`
        INSERT INTO interventions (student_id, faculty_id, intervention_type, status, notes, current_risk_score)
        VALUES ($1, $2, 'Tutoring', 'In Progress', 'Extra classes assigned', 75)
      `, [s2, facId]);

      await pool.query(`
        INSERT INTO interventions (student_id, faculty_id, intervention_type, status, notes, before_risk_score, current_risk_score)
        VALUES ($1, $2, 'Mentoring', 'Completed', 'Student improved significantly', 85, 45)
      `, [s3, facId]);
    }
    
    if (mediumRiskRes.rows.length > 0) {
      await pool.query(`
        INSERT INTO interventions (student_id, faculty_id, intervention_type, status, notes)
        VALUES ($1, $2, 'Advising', 'Pending', 'Check next week')
      `, [mediumRiskRes.rows[0].student_id, facId]);
    }

    console.log('Interventions created.');
    console.log('Seed process finished successfully.');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedData();
