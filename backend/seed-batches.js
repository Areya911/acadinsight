const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'acadinsight.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

async function seedBatches() {
  console.log('🚀 Starting Seeding of Batches and Students...');

  // 1. Ensure assigned_faculty_id and mentor_name columns exist in users table
  const tableInfo = db.prepare('PRAGMA table_info(users)').all();
  const columnNames = tableInfo.map(c => c.name);

  if (!columnNames.includes('assigned_faculty_id')) {
    console.log('Adding assigned_faculty_id column to users...');
    db.prepare('ALTER TABLE users ADD COLUMN assigned_faculty_id INTEGER').run();
  }
  if (!columnNames.includes('mentor_name')) {
    console.log('Adding mentor_name column to users...');
    db.prepare('ALTER TABLE users ADD COLUMN mentor_name TEXT').run();
  }

  // 2. Fetch existing faculty
  const facultyMembers = db.prepare("SELECT id, name, email FROM users WHERE role = 'faculty' ORDER BY id").all();
  console.log(`Found ${facultyMembers.length} faculty members.`);

  if (facultyMembers.length < 6) {
    console.error('At least 6 faculty members needed!');
    process.exit(1);
  }

  // Define 6 faculty mentors to assign 6-7 students each:
  // Faculty 0 (7), Faculty 1 (7), Faculty 2 (7), Faculty 3 (7), Faculty 4 (6), Faculty 5 (6) => Total 40 students
  const activeMentors = facultyMembers.slice(0, 6);
  console.log('Active Faculty Mentors for assignment:');
  activeMentors.forEach((f, i) => console.log(`  ${i + 1}. ${f.name} (ID: ${f.id})`));

  // 3. Clear existing students and their dependent records
  console.log('Clearing old student marks, skills, performance, and risk records...');
  const studentRows = db.prepare("SELECT id FROM users WHERE role = 'student'").all();
  const studentIds = studentRows.map(r => r.id);

  if (studentIds.length > 0) {
    const placeholders = studentIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM semester_marks WHERE student_id IN (${placeholders})`).run(...studentIds);
    db.prepare(`DELETE FROM skill_scores WHERE user_id IN (${placeholders})`).run(...studentIds);
    db.prepare(`DELETE FROM student_performance WHERE student_id IN (${placeholders})`).run(...studentIds);
    db.prepare(`DELETE FROM subject_performance WHERE student_id IN (${placeholders})`).run(...studentIds);
    db.prepare(`DELETE FROM risk_scores WHERE student_id IN (${placeholders})`).run(...studentIds);
    db.prepare(`DELETE FROM risk_factors WHERE student_id IN (${placeholders})`).run(...studentIds);
    db.prepare(`DELETE FROM interventions WHERE student_id IN (${placeholders})`).run(...studentIds);
    db.prepare(`DELETE FROM performance_alerts WHERE student_id IN (${placeholders})`).run(...studentIds);
    db.prepare(`DELETE FROM performance_history WHERE student_id IN (${placeholders})`).run(...studentIds);
    db.prepare(`DELETE FROM users WHERE role = 'student'`).run();
  }

  const defaultPasswordHash = await bcrypt.hash('student123', 10);

  // 4. Define 40 students across the 4 specified batches
  // 2023-2027: 10 students - semester 7 - Computer Science
  // 2024-2028: 10 students - semester 5 - Information Technology
  // 2025-2029: 10 students - semester 3 - Civil Engineering
  // 2026-2030: 10 students - semester 1 - Biotechnology
  const studentDefinitions = [
    // BATCH 2023-2027 (Sem 7, CS)
    { name: 'Arjun Kumar', roll: 'CS23-001', email: 'arjun@acadinsight.com', batch: '2023-2027', sem: 7, dept: 'Computer Science', year: 4, baseline: 46, trend: -2.0 },
    { name: 'Kavin Raj', roll: 'CS23-002', email: 'kavin@acadinsight.com', batch: '2023-2027', sem: 7, dept: 'Computer Science', year: 4, baseline: 78.5, trend: 0.8 },
    { name: 'Harish Kumar', roll: 'CS23-003', email: 'harish@acadinsight.com', batch: '2023-2027', sem: 7, dept: 'Computer Science', year: 4, baseline: 41.5, trend: -3.5 },
    { name: 'Vignesh S', roll: 'CS23-004', email: 'vignesh@acadinsight.com', batch: '2023-2027', sem: 7, dept: 'Computer Science', year: 4, baseline: 64, trend: 0.5 },
    { name: 'Ashwin Raj', roll: 'CS23-005', email: 'ashwin@acadinsight.com', batch: '2023-2027', sem: 7, dept: 'Computer Science', year: 4, baseline: 86.5, trend: 1.0 },
    { name: 'Dharani M', roll: 'CS23-006', email: 'dharani@acadinsight.com', batch: '2023-2027', sem: 7, dept: 'Computer Science', year: 4, baseline: 71.25, trend: -0.5 },
    { name: 'Keerthana S', roll: 'CS23-007', email: 'keerthana@acadinsight.com', batch: '2023-2027', sem: 7, dept: 'Computer Science', year: 4, baseline: 91, trend: 0.6 },
    { name: 'Nivetha R', roll: 'CS23-008', email: 'nivetha@acadinsight.com', batch: '2023-2027', sem: 7, dept: 'Computer Science', year: 4, baseline: 58.75, trend: -1.8 },
    { name: 'Swetha V', roll: 'CS23-009', email: 'swetha@acadinsight.com', batch: '2023-2027', sem: 7, dept: 'Computer Science', year: 4, baseline: 82.5, trend: 0.4 },
    { name: 'Divya K', roll: 'CS23-010', email: 'divya@acadinsight.com', batch: '2023-2027', sem: 7, dept: 'Computer Science', year: 4, baseline: 48, trend: -2.2 },

    // BATCH 2024-2028 (Sem 5, IT)
    { name: 'Rahul Sharma', roll: 'IT24-001', email: 'rahul@acadinsight.com', batch: '2024-2028', sem: 5, dept: 'Information Technology', year: 3, baseline: 43.5, trend: -3.0 },
    { name: 'Priya N', roll: 'IT24-002', email: 'priya@acadinsight.com', batch: '2024-2028', sem: 5, dept: 'Information Technology', year: 3, baseline: 79.25, trend: 1.2 },
    { name: 'Sanjay R', roll: 'IT24-003', email: 'sanjay@acadinsight.com', batch: '2024-2028', sem: 5, dept: 'Information Technology', year: 3, baseline: 66.5, trend: 0.2 },
    { name: 'Ananya V', roll: 'IT24-004', email: 'ananya@acadinsight.com', batch: '2024-2028', sem: 5, dept: 'Information Technology', year: 3, baseline: 88, trend: 0.5 },
    { name: 'Gokul Krishna', roll: 'IT24-005', email: 'gokul@acadinsight.com', batch: '2024-2028', sem: 5, dept: 'Information Technology', year: 3, baseline: 54.5, trend: -1.5 },
    { name: 'Pavithra S', roll: 'IT24-006', email: 'pavithra@acadinsight.com', batch: '2024-2028', sem: 5, dept: 'Information Technology', year: 3, baseline: 74, trend: 0.8 },
    { name: 'Naveen Kumar', roll: 'IT24-007', email: 'naveen@acadinsight.com', batch: '2024-2028', sem: 5, dept: 'Information Technology', year: 3, baseline: 49.5, trend: -2.5 },
    { name: 'Sneha M', roll: 'IT24-008', email: 'sneha@acadinsight.com', batch: '2024-2028', sem: 5, dept: 'Information Technology', year: 3, baseline: 84.75, trend: 0.9 },
    { name: 'Dinesh B', roll: 'IT24-009', email: 'dinesh@acadinsight.com', batch: '2024-2028', sem: 5, dept: 'Information Technology', year: 3, baseline: 62.25, trend: -0.4 },
    { name: 'Shalini R', roll: 'IT24-010', email: 'shalini@acadinsight.com', batch: '2024-2028', sem: 5, dept: 'Information Technology', year: 3, baseline: 92.5, trend: 0.3 },

    // BATCH 2025-2029 (Sem 3, Civil)
    { name: 'Balaji T', roll: 'CE25-001', email: 'balaji@acadinsight.com', batch: '2025-2029', sem: 3, dept: 'Civil Engineering', year: 2, baseline: 76.5, trend: 1.0 },
    { name: 'Meena K', roll: 'CE25-002', email: 'meena@acadinsight.com', batch: '2025-2029', sem: 3, dept: 'Civil Engineering', year: 2, baseline: 61, trend: -0.8 },
    { name: 'Vigneshwaran P', roll: 'CE25-003', email: 'vigneshwaran@acadinsight.com', batch: '2025-2029', sem: 3, dept: 'Civil Engineering', year: 2, baseline: 85.25, trend: 1.5 },
    { name: 'Kausalya M', roll: 'CE25-004', email: 'kausalya@acadinsight.com', batch: '2025-2029', sem: 3, dept: 'Civil Engineering', year: 2, baseline: 53.5, trend: -2.0 },
    { name: 'Manikandan G', roll: 'CE25-005', email: 'manikandan@acadinsight.com', batch: '2025-2029', sem: 3, dept: 'Civil Engineering', year: 2, baseline: 46.25, trend: -3.2 },
    { name: 'Deepa S', roll: 'CE25-006', email: 'deepa@acadinsight.com', batch: '2025-2029', sem: 3, dept: 'Civil Engineering', year: 2, baseline: 72.5, trend: 0.5 },
    { name: 'Sarath Kumar', roll: 'CE25-007', email: 'sarath@acadinsight.com', batch: '2025-2029', sem: 3, dept: 'Civil Engineering', year: 2, baseline: 67, trend: -1.0 },
    { name: 'Sandhiya R', roll: 'CE25-008', email: 'sandhiya@acadinsight.com', batch: '2025-2029', sem: 3, dept: 'Civil Engineering', year: 2, baseline: 89.5, trend: 0.7 },
    { name: 'Ajay V', roll: 'CE25-009', email: 'ajay@acadinsight.com', batch: '2025-2029', sem: 3, dept: 'Civil Engineering', year: 2, baseline: 57.25, trend: -1.5 },
    { name: 'Varsha N', roll: 'CE25-010', email: 'varsha@acadinsight.com', batch: '2025-2029', sem: 3, dept: 'Civil Engineering', year: 2, baseline: 80, trend: 0.6 },

    // BATCH 2026-2030 (Sem 1, Biotechnology)
    { name: 'Abinaya R', roll: 'BT26-001', email: 'abinaya@acadinsight.com', batch: '2026-2030', sem: 1, dept: 'Biotechnology', year: 1, baseline: 75.25, trend: 0 },
    { name: 'Siddharth M', roll: 'BT26-002', email: 'siddharth@acadinsight.com', batch: '2026-2030', sem: 1, dept: 'Biotechnology', year: 1, baseline: 83.5, trend: 0 },
    { name: 'Rithika S', roll: 'BT26-003', email: 'rithika@acadinsight.com', batch: '2026-2030', sem: 1, dept: 'Biotechnology', year: 1, baseline: 63, trend: 0 },
    { name: 'Akash K', roll: 'BT26-004', email: 'akash@acadinsight.com', batch: '2026-2030', sem: 1, dept: 'Biotechnology', year: 1, baseline: 44.5, trend: 0 },
    { name: 'Janani B', roll: 'BT26-005', email: 'jananib@acadinsight.com', batch: '2026-2030', sem: 1, dept: 'Biotechnology', year: 1, baseline: 90.75, trend: 0 },
    { name: 'Praveen Kumar', roll: 'BT26-006', email: 'praveen@acadinsight.com', batch: '2026-2030', sem: 1, dept: 'Biotechnology', year: 1, baseline: 56.5, trend: 0 },
    { name: 'Monisha V', roll: 'BT26-007', email: 'monisha@acadinsight.com', batch: '2026-2030', sem: 1, dept: 'Biotechnology', year: 1, baseline: 78, trend: 0 },
    { name: 'Karthik N', roll: 'BT26-008', email: 'karthik@acadinsight.com', batch: '2026-2030', sem: 1, dept: 'Biotechnology', year: 1, baseline: 68.25, trend: 0 },
    { name: 'Pooja D', roll: 'BT26-009', email: 'pooja@acadinsight.com', batch: '2026-2030', sem: 1, dept: 'Biotechnology', year: 1, baseline: 87.5, trend: 0 },
    { name: 'Surya P', roll: 'BT26-010', email: 'surya@acadinsight.com', batch: '2026-2030', sem: 1, dept: 'Biotechnology', year: 1, baseline: 47.75, trend: 0 }
  ];

  // Subject syllabus mapping per department and semester
  const syllabus = {
    'Computer Science': {
      1: ['Mathematics I', 'Physics', 'Problem Solving in C', 'Digital Principles', 'Technical English'],
      2: ['Mathematics II', 'Data Structures', 'Computer Architecture', 'Electrical Systems', 'Environmental Studies'],
      3: ['Discrete Mathematics', 'Object Oriented Programming', 'DBMS', 'Digital Electronics', 'Analog Systems'],
      4: ['Algorithms Design', 'Operating Systems', 'Software Engineering', 'Theory of Computation', 'Probability & Queuing'],
      5: ['Computer Networks', 'Compiler Design', 'Web Technologies', 'Microprocessors', 'Cloud Computing'],
      6: ['Machine Learning', 'Artificial Intelligence', 'Cryptography', 'Distributed Computing', 'Mobile Application Dev'],
      7: ['Deep Learning', 'Big Data Analytics', 'Cyber Security', 'Cloud Native Systems', 'Natural Language Processing']
    },
    'Information Technology': {
      1: ['Applied Mathematics I', 'Basic Electronics', 'C Programming', 'Chemistry', 'Communication Skills'],
      2: ['Applied Mathematics II', 'Data Structures', 'Digital Logic', 'Python Programming', 'Environmental Science'],
      3: ['Java Programming', 'Relational DBMS', 'Computer Organization', 'Operating Systems', 'Computer Networks'],
      4: ['Web Application Dev', 'Data Science Foundations', 'Automata Theory', 'Information Security', 'UI/UX Design'],
      5: ['Cloud Architecture', 'Mobile Computing', 'Machine Learning Foundations', 'Full Stack Frameworks', 'DevOps Fundamentals']
    },
    'Civil Engineering': {
      1: ['Engineering Mechanics', 'Engineering Mathematics I', 'Applied Physics', 'Technical Drawing', 'Basic Civil Engg'],
      2: ['Strength of Materials', 'Surveying I', 'Building Materials', 'Engineering Chemistry', 'Fluid Mechanics Foundations'],
      3: ['Structural Analysis I', 'Fluid Mechanics & Machinery', 'Concrete Technology', 'Surveying II', 'Engineering Geology']
    },
    'Biotechnology': {
      1: ['Cell Biology', 'Biochemistry Fundamentals', 'Biophysics', 'Engineering Mathematics I', 'Introductory Microbiology']
    }
  };

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, year, department, semester, roll_number, batch, assigned_faculty_id, mentor_name)
    VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMark = db.prepare(`
    INSERT INTO semester_marks (student_id, semester, subject_name, marks, max_marks, grade)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertSkill = db.prepare(`
    INSERT INTO skill_scores (user_id, skill_name, category, score, test_score, assignment_score, quiz_score, total_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Mentor allocation counters:
  // Faculty 0: 7, Faculty 1: 7, Faculty 2: 7, Faculty 3: 7, Faculty 4: 6, Faculty 5: 6
  const mentorCounts = [7, 7, 7, 7, 6, 6];
  let mentorAllocIndex = 0;
  let allocatedForCurrentMentor = 0;

  console.log('Inserting 40 students with unique marks and reports...');

  for (let i = 0; i < studentDefinitions.length; i++) {
    const s = studentDefinitions[i];

    // Determine assigned mentor
    const mentor = activeMentors[mentorAllocIndex];
    allocatedForCurrentMentor++;
    if (allocatedForCurrentMentor >= mentorCounts[mentorAllocIndex]) {
      mentorAllocIndex++;
      allocatedForCurrentMentor = 0;
    }

    const userRes = insertUser.run(
      s.name,
      s.email,
      defaultPasswordHash,
      s.year,
      s.dept,
      s.sem,
      s.roll,
      s.batch,
      mentor.id,
      mentor.name
    );

    const studentId = userRes.lastInsertRowid;

    // Generate unique marks for every completed semester up to current sem
    const deptSyllabus = syllabus[s.dept];
    for (let sem = 1; sem <= s.sem; sem++) {
      const subjects = deptSyllabus[sem] || ['Subject 1', 'Subject 2', 'Subject 3', 'Subject 4', 'Subject 5'];
      
      // Calculate target average for this semester based on baseline and trend
      const semDelta = (sem - 1) * s.trend;
      const semTargetAvg = Math.min(96, Math.max(28, s.baseline + semDelta));

      for (let subIdx = 0; subIdx < subjects.length; subIdx++) {
        const subName = subjects[subIdx];
        
        // Subject-specific deterministic variation so every subject has different marks
        // Varied offsets: [-7.5, +4.25, -2, +8.75, -5.5] with small unique adjustments per student
        const variationPattern = [
          ((i * 3 + subIdx * 5) % 11) - 5.5,
          ((i * 7 + subIdx * 4) % 13) - 6.25,
          ((i * 2 + subIdx * 7) % 9) - 4,
          ((i * 5 + subIdx * 3) % 15) - 7.5,
          ((i * 4 + subIdx * 6) % 12) - 5.75
        ];
        
        const offset = variationPattern[subIdx % variationPattern.length];
        let mark = Math.min(98, Math.max(25, semTargetAvg + offset));
        
        // Ensure ALL test scores and exam scores are whole numbers
        mark = Math.round(mark);

        // Special requirement for Arjun Kumar:
        // Make him a below-average student with ONLY fail marks in his current semester (sem 7)!
        if (s.email === 'arjun@acadinsight.com' && sem === s.sem) {
          const failMarks = [32, 28, 35, 38, 30];
          mark = failMarks[subIdx % failMarks.length];
        }

        let grade = 'C';
        if (mark >= 90) grade = 'A+';
        else if (mark >= 80) grade = 'A';
        else if (mark >= 70) grade = 'B+';
        else if (mark >= 60) grade = 'B';
        else if (mark >= 50) grade = 'C';
        else grade = 'F';

        insertMark.run(studentId, sem, subName, mark, 100, grade);
      }
    }

    // Generate unique skill scores (Attendance, Assignment Completion, Quiz Performance, Lab Work)
    let baseSkill = Math.min(98, Math.max(28, s.baseline + ((i % 5) - 2) * 2));
    if (s.email === 'arjun@acadinsight.com') {
      baseSkill = 40; // Below average skills for Arjun
    }
    
    const skillList = [
      { name: 'Attendance', cat: 'General', offset: ((i * 3) % 11) - 4.5 },
      { name: 'Assignment Completion', cat: 'General', offset: ((i * 5) % 9) - 3.25 },
      { name: 'Quiz Performance', cat: 'Technical', offset: ((i * 7) % 13) - 5.5 },
      { name: 'Lab Work', cat: 'Practical', offset: ((i * 2) % 7) - 2 }
    ];

    for (const sk of skillList) {
      let total = Math.round(Math.min(99, Math.max(25, baseSkill + sk.offset)));

      let test = Math.round(Math.min(100, Math.max(20, total + (((i + 1) * 3) % 7 - 3))));
      let assignment = Math.round(Math.min(100, Math.max(20, total + (((i + 2) * 4) % 7 - 3))));
      let quiz = Math.round(Math.min(100, Math.max(20, total + (((i + 3) * 5) % 7 - 3))));

      insertSkill.run(studentId, sk.name, sk.cat, total, test, assignment, quiz, total);
    }
  }

  // Remove faculties who have no assigned students
  console.log('Checking and removing faculties with no assigned students...');
  const unusedFaculties = db.prepare(`
    SELECT id, name, email FROM users 
    WHERE role = 'faculty' 
      AND id NOT IN (SELECT DISTINCT assigned_faculty_id FROM users WHERE role = 'student' AND assigned_faculty_id IS NOT NULL)
  `).all();

  if (unusedFaculties.length > 0) {
    const unusedIds = unusedFaculties.map(f => f.id);
    console.log(`Removing ${unusedFaculties.length} faculty member(s) with no students:`, unusedFaculties.map(f => f.name).join(', '));
    const placeholders = unusedIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM interventions WHERE faculty_id IN (${placeholders})`).run(...unusedIds);
    db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`).run(...unusedIds);
  }

  console.log('✅ Successfully inserted 40 students with customized marks and skills!');
  db.close();

  // 5. Run performanceEngine recalculation
  console.log('Recalculating analytics engine for all students...');
  const { recalculateAll } = require('./services/performanceEngine');
  const result = await recalculateAll();
  console.log(`✅ Analytics recalculation complete! Updated ${result.updated_count} student profiles.`);
}

seedBatches().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
