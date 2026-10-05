const pool = require('../config/db');
const config = require('../config/performance');

async function calculateStudentPerformance(studentId) {
  studentId = parseInt(studentId);
  if (isNaN(studentId)) return { overall_score: 0, classification: 'AVERAGE', subject_scores: [], activity_scores: [] };
  const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [studentId]);
  if (!userCheck.rows || userCheck.rows.length === 0) {
    return { overall_score: 0, classification: 'AVERAGE', subject_scores: [], activity_scores: [] };
  }

  const marksRes = await pool.query('SELECT * FROM semester_marks WHERE student_id = $1', [studentId]);
  const skillsRes = await pool.query('SELECT * FROM skill_scores WHERE user_id = $1', [studentId]);
  
  let overall_score = 0;
  let totalPct = 0;
  const marks = marksRes.rows;
  const skills = skillsRes.rows;
  
  const subject_scores = [];
  
  if (marks.length > 0) {
    for (const m of marks) {
      let pct = 0;
      if (m.max_marks > 0) {
        pct = (Number(m.marks) / Number(m.max_marks)) * 100;
      }
      totalPct += pct;
      subject_scores.push({
        subject_name: m.subject_name,
        semester: m.semester,
        score: pct,
        classification: config.classifyScore(pct)
      });
    }
    overall_score = totalPct / marks.length;
  }
  
  subject_scores.sort((a, b) => a.score - b.score);
  
  const activity_scores = skills.map(s => ({
    skill_name: s.skill_name,
    category: s.category,
    score: Number(s.score),
    classification: config.classifyScore(Number(s.score))
  }));
  
  const classification = config.classifyScore(overall_score);
  
  await pool.query(`
    INSERT INTO student_performance (student_id, overall_score, classification, calculated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (student_id) DO UPDATE SET 
      overall_score = EXCLUDED.overall_score,
      classification = EXCLUDED.classification,
      calculated_at = NOW()
  `, [studentId, overall_score.toFixed(2), classification]);
  
  for (const s of subject_scores) {
    await pool.query(`
      INSERT INTO subject_performance (student_id, subject_name, semester, score, classification, calculated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [studentId, s.subject_name, s.semester, s.score.toFixed(2), s.classification]);
  }
  
  return { overall_score, classification, subject_scores, activity_scores };
}

async function detectWeakAreas(studentId) {
  const marksRes = await pool.query('SELECT * FROM semester_marks WHERE student_id = $1 ORDER BY semester ASC', [studentId]);
  const skillsRes = await pool.query('SELECT * FROM skill_scores WHERE user_id = $1', [studentId]);
  
  const subjectsMap = {};
  for (const m of marksRes.rows) {
    if (!subjectsMap[m.subject_name]) {
      subjectsMap[m.subject_name] = [];
    }
    const pct = m.max_marks > 0 ? (Number(m.marks) / Number(m.max_marks)) * 100 : 0;
    subjectsMap[m.subject_name].push({ semester: m.semester, score: pct });
  }
  
  const weakAreas = [];
  
  for (const [name, records] of Object.entries(subjectsMap)) {
    const latest = records[records.length - 1];
    if (latest.score < config.AVERAGE_THRESHOLD) {
      let trend = 'Stable';
      if (records.length > 1) {
        const prev = records[records.length - 2];
        if (latest.score < prev.score - 5) trend = 'Declining';
        else if (latest.score > prev.score + 5) trend = 'Improving';
      } else {
        if (latest.score < 45) trend = 'Declining';
      }
      weakAreas.push({
        name,
        score: latest.score,
        classification: config.classifyScore(latest.score),
        trend,
        type: 'subject',
        semester: latest.semester
      });
    }
  }
  
  for (const s of skillsRes.rows) {
    const score = Number(s.score);
    if (score < config.AVERAGE_THRESHOLD) {
      weakAreas.push({
        name: s.skill_name,
        score,
        classification: config.classifyScore(score),
        trend: score < 45 ? 'Declining' : 'Stable',
        type: 'activity'
      });
    }
  }
  
  weakAreas.sort((a, b) => a.score - b.score);
  return weakAreas;
}

async function calculateRiskScore(studentId) {
  studentId = parseInt(studentId);
  if (isNaN(studentId)) return { risk_score: 0, risk_level: 'LOW', factors: [], explanation: [] };
  const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [studentId]);
  if (!userCheck.rows || userCheck.rows.length === 0) {
    return { risk_score: 0, risk_level: 'LOW', factors: [], explanation: [] };
  }

  const marksRes = await pool.query('SELECT * FROM semester_marks WHERE student_id = $1 ORDER BY semester ASC', [studentId]);
  const skillsRes = await pool.query('SELECT * FROM skill_scores WHERE user_id = $1', [studentId]);
  
  const semesterAvgs = {};
  for (const m of marksRes.rows) {
    if (!semesterAvgs[m.semester]) semesterAvgs[m.semester] = { sum: 0, count: 0 };
    const pct = m.max_marks > 0 ? (Number(m.marks) / Number(m.max_marks)) * 100 : 0;
    semesterAvgs[m.semester].sum += pct;
    semesterAvgs[m.semester].count += 1;
  }
  
  const semKeys = Object.keys(semesterAvgs).map(Number).sort((a,b) => a - b);
  let overall_academic_percentage = 0;
  let trend_risk = 0;
  let decline_risk = 0;
  
  if (semKeys.length > 0) {
    let totalPct = 0;
    for (const k of semKeys) {
      totalPct += semesterAvgs[k].sum / semesterAvgs[k].count;
    }
    overall_academic_percentage = totalPct / semKeys.length;
    
    if (semKeys.length > 1) {
      const current = semesterAvgs[semKeys[semKeys.length - 1]].sum / semesterAvgs[semKeys[semKeys.length - 1]].count;
      const previous = semesterAvgs[semKeys[semKeys.length - 2]].sum / semesterAvgs[semKeys[semKeys.length - 2]].count;
      
      if (current < previous) {
        trend_risk = Math.min(100, Math.max(0, (previous - current) * 2));
      } else {
        trend_risk = Math.min(10, Math.max(0, 10 - (current - previous)));
      }
      
      let maxDecline = 0;
      for (let i = 1; i < semKeys.length; i++) {
        const curr = semesterAvgs[semKeys[i]].sum / semesterAvgs[semKeys[i]].count;
        const prev = semesterAvgs[semKeys[i-1]].sum / semesterAvgs[semKeys[i-1]].count;
        if (prev - curr > maxDecline) maxDecline = prev - curr;
      }
      if (maxDecline > 10) {
        decline_risk = Math.min(100, Math.max(0, maxDecline * 1.5));
      }
    }
  }
  
  const academic_risk = Math.max(0, 100 - overall_academic_percentage);
  
  let attendance_score = 30;
  let assignment_score = 30;
  let engagement_score = 30;
  
  let attendanceFound = false;
  let assignmentFound = false;
  let engTotal = 0;
  let engCount = 0;
  
  for (const s of skillsRes.rows) {
    const name = (s.skill_name || '').toLowerCase();
    const cat = (s.category || '').toLowerCase();
    const val = Number(s.score);
    
    if (name.includes('attendance') || cat.includes('attendance')) {
      attendance_score = 100 - val;
      attendanceFound = true;
    } else if (name.includes('assignment') || cat.includes('assignment')) {
      assignment_score = 100 - val;
      assignmentFound = true;
    } else {
      engTotal += val;
      engCount++;
    }
  }
  
  if (engCount > 0) {
    engagement_score = 100 - (engTotal / engCount);
  }
  
  let weak_count = 0;
  if (semKeys.length > 0) {
    const latestSem = semKeys[semKeys.length - 1];
    for (const m of marksRes.rows) {
      if (m.semester === latestSem) {
        const pct = m.max_marks > 0 ? (Number(m.marks) / Number(m.max_marks)) * 100 : 0;
        if (pct < config.AVERAGE_THRESHOLD) weak_count++;
      }
    }
  }
  
  const weak_count_risk = Math.min(100, Math.max(0, weak_count * 15));
  
  let risk_score = 
    academic_risk * config.WEIGHTS.academicPerformance +
    trend_risk * config.WEIGHTS.performanceTrend +
    attendance_score * config.WEIGHTS.attendance +
    assignment_score * config.WEIGHTS.assignmentCompletion +
    engagement_score * config.WEIGHTS.activityEngagement +
    weak_count_risk * config.WEIGHTS.weakSubjectCount +
    decline_risk * config.WEIGHTS.recentDecline;
    
  risk_score = Math.round(Math.min(100, Math.max(0, risk_score)));
  const risk_level = config.classifyRisk(risk_score);
  
  const prevRiskRes = await pool.query('SELECT risk_score FROM risk_scores WHERE student_id = $1', [studentId]);
  let previous_risk_score = null;
  if (prevRiskRes.rows.length > 0) {
    previous_risk_score = prevRiskRes.rows[0].risk_score;
  }
  
  await pool.query(`
    INSERT INTO risk_scores (student_id, risk_score, risk_level, previous_risk_score, calculated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (student_id) DO UPDATE SET
      previous_risk_score = risk_scores.risk_score,
      risk_score = EXCLUDED.risk_score,
      risk_level = EXCLUDED.risk_level,
      calculated_at = NOW()
  `, [studentId, risk_score, risk_level, previous_risk_score]);
  
  await pool.query(`
    INSERT INTO risk_factors (student_id, academic_score, trend_score, attendance_score, assignment_score, engagement_score, weak_subject_count, recent_decline, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    ON CONFLICT (student_id) DO UPDATE SET
      academic_score = EXCLUDED.academic_score,
      trend_score = EXCLUDED.trend_score,
      attendance_score = EXCLUDED.attendance_score,
      assignment_score = EXCLUDED.assignment_score,
      engagement_score = EXCLUDED.engagement_score,
      weak_subject_count = EXCLUDED.weak_subject_count,
      recent_decline = EXCLUDED.recent_decline,
      updated_at = NOW()
  `, [studentId, academic_risk, trend_risk, attendance_score, assignment_score, engagement_score, weak_count, decline_risk]);
  
  const explanation = [];
  if (overall_academic_percentage < 50 && semKeys.length > 0) explanation.push(`Overall academic performance is below average (${overall_academic_percentage.toFixed(1)}%)`);
  if (weak_count >= 2) explanation.push(`${weak_count} subjects are performing below the minimum threshold`);
  if (attendanceFound && (100 - attendance_score) < 70) explanation.push(`Attendance is ${100 - attendance_score}% which is below the recommended level`);
  if (assignmentFound && (100 - assignment_score) < 60) explanation.push(`Assignment completion rate is ${100 - assignment_score}%`);
  if (trend_risk > 0) {
    const current = semesterAvgs[semKeys[semKeys.length - 1]]?.sum / semesterAvgs[semKeys[semKeys.length - 1]]?.count || 0;
    const previous = semesterAvgs[semKeys[semKeys.length - 2]]?.sum / semesterAvgs[semKeys[semKeys.length - 2]]?.count || 0;
    if (previous > current) explanation.push(`Academic performance decreased by ${(previous - current).toFixed(1)}% in the last semester`);
  }
  if (previous_risk_score !== null && risk_score > previous_risk_score) explanation.push(`Risk score increased from ${previous_risk_score} to ${risk_score}`);
  
  return { 
    risk_score, 
    risk_level, 
    factors: { academic_risk, trend_risk, attendance_score, assignment_score, engagement_score, weak_count, decline_risk }, 
    explanation 
  };
}

async function generateAlerts(studentId) {
  const alerts = [];
  const riskRes = await pool.query('SELECT * FROM risk_scores WHERE student_id = $1', [studentId]);
  if (riskRes.rows.length > 0) {
    const r = riskRes.rows[0];
    if (r.risk_level === 'HIGH') {
      alerts.push({ type: 'HIGH RISK', msg: 'Student has entered HIGH RISK category.', severity: 'critical' });
    }
  }
  
  const marksRes = await pool.query('SELECT * FROM semester_marks WHERE student_id = $1 ORDER BY semester ASC', [studentId]);
  const semesterAvgs = {};
  for (const m of marksRes.rows) {
    if (!semesterAvgs[m.semester]) semesterAvgs[m.semester] = { sum: 0, count: 0 };
    const pct = m.max_marks > 0 ? (Number(m.marks) / Number(m.max_marks)) * 100 : 0;
    semesterAvgs[m.semester].sum += pct;
    semesterAvgs[m.semester].count += 1;
  }
  const semKeys = Object.keys(semesterAvgs).map(Number).sort((a,b) => a - b);
  if (semKeys.length > 1) {
    const current = semesterAvgs[semKeys[semKeys.length - 1]].sum / semesterAvgs[semKeys[semKeys.length - 1]].count;
    const previous = semesterAvgs[semKeys[semKeys.length - 2]].sum / semesterAvgs[semKeys[semKeys.length - 2]].count;
    if (previous - current >= 10) {
      alerts.push({ type: 'PERFORMANCE DECLINE', msg: `Performance dropped by ${(previous - current).toFixed(1)}%`, severity: 'high' });
    }
  }
  
  const weak = await detectWeakAreas(studentId);
  for (const w of weak) {
    if (w.type === 'subject' && w.score < config.AVERAGE_THRESHOLD) {
      alerts.push({ type: 'NEW WEAK AREA', msg: `Subject ${w.name} fell below average (${w.score.toFixed(1)}%)`, severity: 'medium' });
    }
  }
  
  const skillsRes = await pool.query('SELECT * FROM skill_scores WHERE user_id = $1', [studentId]);
  for (const s of skillsRes.rows) {
    const name = (s.skill_name || '').toLowerCase();
    const cat = (s.category || '').toLowerCase();
    if ((name.includes('attendance') || cat.includes('attendance')) && Number(s.score) < 70) {
      alerts.push({ type: 'ATTENDANCE RISK', msg: `Attendance is low (${s.score}%)`, severity: 'high' });
    }
  }
  
  for (const a of alerts) {
    await pool.query(`
      INSERT INTO performance_alerts (student_id, alert_type, message, severity, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [studentId, a.type, a.msg, a.severity]);
  }
  
  return alerts;
}

async function recalculateStudent(studentId) {
  const perf = await calculateStudentPerformance(studentId);
  const risk = await calculateRiskScore(studentId);
  
  const marksRes = await pool.query('SELECT MAX(semester) as max_sem FROM semester_marks WHERE student_id = $1', [studentId]);
  let latestSem = marksRes.rows[0].max_sem;
  
  if (latestSem !== null) {
    await pool.query(`
      INSERT INTO performance_history (student_id, semester, avg_score, risk_score, recorded_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [studentId, latestSem, perf.overall_score, risk.risk_score]);
  }
  
  await generateAlerts(studentId);
  return { success: true };
}

async function recalculateAll() {
  const studentsRes = await pool.query("SELECT id FROM users WHERE role = 'student'");
  let updated_count = 0;
  for (const row of studentsRes.rows) {
    try {
      await recalculateStudent(row.id);
      updated_count++;
    } catch(err) {
      console.error('Error recalculating for student ' + row.id, err);
    }
  }
  return { updated_count };
}

async function getStudentFullProfile(studentId) {
  await recalculateStudent(studentId);
  
  const userRes = await pool.query('SELECT id, name, email, role, year, semester, department, roll_number, batch FROM users WHERE id = $1', [studentId]);
  const perfRes = await pool.query('SELECT * FROM student_performance WHERE student_id = $1', [studentId]);
  const riskRes = await pool.query('SELECT * FROM risk_scores WHERE student_id = $1', [studentId]);
  const riskFactorsRes = await pool.query('SELECT * FROM risk_factors WHERE student_id = $1', [studentId]);
  const marksRes = await pool.query('SELECT * FROM semester_marks WHERE student_id = $1 ORDER BY semester ASC', [studentId]);
  const skillsRes = await pool.query('SELECT * FROM skill_scores WHERE user_id = $1', [studentId]);
  const weakAreas = await detectWeakAreas(studentId);
  const interventionsRes = await pool.query(`
    SELECT i.*, u.name as faculty_name
    FROM interventions i
    LEFT JOIN users u ON i.faculty_id = u.id
    WHERE i.student_id = $1
    ORDER BY i.created_at DESC
  `, [studentId]);
  const historyRes = await pool.query('SELECT * FROM performance_history WHERE student_id = $1 ORDER BY recorded_at ASC', [studentId]);

  const student = userRes.rows[0] || {};
  const perfRow = perfRes.rows[0] || { overall_score: 0, classification: 'AVERAGE' };
  const riskRow = riskRes.rows[0] || { risk_score: 0, risk_level: 'LOW' };
  const rfRow = riskFactorsRes.rows[0] || {};

  // Build subject_scores array
  const subjectScoresMap = {};
  for (const m of marksRes.rows) {
    const pct = m.max_marks > 0 ? Math.round((Number(m.marks) / Number(m.max_marks)) * 100) : 0;
    subjectScoresMap[m.subject_name] = {
      name: m.subject_name,
      semester: m.semester,
      score: pct,
      classification: config.classifyScore(pct)
    };
  }
  const subject_scores = Object.values(subjectScoresMap);

  // Build strong areas (score >= 75)
  const strong_areas = [];
  for (const s of subject_scores) {
    if (s.score >= 75) {
      strong_areas.push({ name: s.name, score: s.score, classification: s.classification, type: 'subject' });
    }
  }
  for (const sk of skillsRes.rows) {
    if (Number(sk.score) >= 75) {
      strong_areas.push({ name: sk.skill_name, score: Number(sk.score), classification: config.classifyScore(Number(sk.score)), type: 'activity' });
    }
  }

  // Format factors array for UI display
  const factorsArray = [
    { name: 'Academic Risk', value: `${Math.round(rfRow.academic_score || 0)}%`, impact: rfRow.academic_score || 0 },
    { name: 'Attendance Risk', value: `${Math.round(rfRow.attendance_score || 0)}%`, impact: rfRow.attendance_score || 0 },
    { name: 'Assignment Risk', value: `${Math.round(rfRow.assignment_score || 0)}%`, impact: rfRow.assignment_score || 0 },
    { name: 'Engagement Risk', value: `${Math.round(rfRow.engagement_score || 0)}%`, impact: rfRow.engagement_score || 0 },
    { name: 'Performance Trend Risk', value: `${Math.round(rfRow.trend_score || 0)}%`, impact: rfRow.trend_score || 0 }
  ];

  // AI Risk explanation bullet points
  const explanation = [];
  if (perfRow.overall_score < 50) explanation.push(`Overall academic performance is below average (${perfRow.overall_score}%)`);
  if (rfRow.weak_subject_count >= 2) explanation.push(`${rfRow.weak_subject_count} subjects are performing below the minimum threshold`);
  if (rfRow.attendance_score > 30) explanation.push(`Attendance risk score is high (${Math.round(rfRow.attendance_score)}%)`);
  if (rfRow.assignment_score > 30) explanation.push(`Assignment completion rate risk is elevated`);
  if (rfRow.recent_decline > 0) explanation.push(`Academic performance showed a recent drop`);
  if (explanation.length === 0) explanation.push('Student is performing consistently within expected limits.');

  return {
    student,
    performance: {
      overall_score: perfRow.overall_score,
      classification: perfRow.classification,
      subject_scores
    },
    risk: {
      risk_score: riskRow.risk_score,
      risk_level: riskRow.risk_level,
      previous_risk_score: riskRow.previous_risk_score,
      factors: factorsArray,
      explanation
    },
    subjects: marksRes.rows,
    skills: skillsRes.rows,
    weak_areas: weakAreas,
    weakAreas: weakAreas,
    strong_areas,
    interventions: interventionsRes.rows,
    performance_history: historyRes.rows,
    history: historyRes.rows
  };
}

// ─── AI ACADEMIC RECOVERY ROADMAP ENGINE ─────────────────────────────────────

const SUBJECT_RESOURCES = {
  default: [
    { type: 'Practice', title: 'Solve past exam papers (2 hrs/week)', priority: 'high' },
    { type: 'Concept Review', title: 'Re-study lecture notes & textbook chapters', priority: 'medium' },
    { type: 'Seek Help', title: 'Attend faculty office hours or ask peers', priority: 'medium' },
  ],
  mathematics: [
    { type: 'Practice', title: 'Complete 20 practice problems per session', priority: 'high' },
    { type: 'Resource', title: 'Khan Academy & MIT OpenCourseWare problem sets', priority: 'high' },
    { type: 'Concept Review', title: 'Focus on formula derivation, not just memorisation', priority: 'medium' },
  ],
  physics: [
    { type: 'Practice', title: 'Work through numerical derivations step by step', priority: 'high' },
    { type: 'Resource', title: 'HyperPhysics & lecture recordings', priority: 'medium' },
    { type: 'Lab', title: 'Redo lab experiments conceptually with diagrams', priority: 'medium' },
  ],
  programming: [
    { type: 'Coding Practice', title: 'Complete 3 coding exercises per day on HackerRank / LeetCode', priority: 'high' },
    { type: 'Project', title: 'Build a small project applying concepts learned this semester', priority: 'high' },
    { type: 'Debug', title: 'Review your submission errors and understand each bug fix', priority: 'medium' },
  ],
  database: [
    { type: 'Practice', title: 'Write 10 SQL queries covering JOINs, GROUP BY, and subqueries daily', priority: 'high' },
    { type: 'Concept Review', title: 'Draw ER diagrams and normalise at least 5 schemas', priority: 'medium' },
    { type: 'Resource', title: 'SQLZoo interactive exercises', priority: 'medium' },
  ],
  networks: [
    { type: 'Practice', title: 'Trace TCP/IP packet flows on paper for sample scenarios', priority: 'high' },
    { type: 'Concept Review', title: 'Memorise OSI layers and their protocols with flashcards', priority: 'medium' },
    { type: 'Resource', title: 'Cisco NetAcad free courses for deep dives', priority: 'medium' },
  ],
  os: [
    { type: 'Practice', title: 'Solve scheduling algorithm problems (FCFS, SJF, Round Robin)', priority: 'high' },
    { type: 'Concept Review', title: 'Draw memory allocation and paging diagrams', priority: 'medium' },
    { type: 'Resource', title: 'Operating System Concepts (Silberschatz) exercises', priority: 'medium' },
  ],
};

function getSubjectCategory(subjectName) {
  const n = (subjectName || '').toLowerCase();
  if (n.includes('math') || n.includes('calculus') || n.includes('algebra') || n.includes('statistics')) return 'mathematics';
  if (n.includes('physics') || n.includes('mechanics')) return 'physics';
  if (n.includes('program') || n.includes('coding') || n.includes('c++') || n.includes('java') || n.includes('python') || n.includes('dsa') || n.includes('data struct')) return 'programming';
  if (n.includes('database') || n.includes('dbms') || n.includes('sql')) return 'database';
  if (n.includes('network') || n.includes('tcp') || n.includes('protocol')) return 'networks';
  if (n.includes('os') || n.includes('operating system') || n.includes('memory') || n.includes('process')) return 'os';
  return 'default';
}

function calculateMultiSubjectBalance(allSubjectScores, weakSubjects, riskLevel, currentSemester) {
  // If student has multi-semester history, focus primarily on current semester subjects
  let subjects = allSubjectScores || [];
  if (currentSemester) {
    const currentSemSubs = subjects.filter(s => s.semester === currentSemester);
    if (currentSemSubs.length > 0) subjects = currentSemSubs;
  }

  const sortedWeak = (weakSubjects || []).filter(w => w.type === 'subject').sort((a, b) => a.score - b.score);
  const primaryWeak = sortedWeak.length > 0 ? sortedWeak[0] : null;
  const secondaryWeak = sortedWeak.slice(1); // 2nd and 3rd weak subjects if any!

  const borderlineSubjects = subjects.filter(s => s.score >= 50 && s.score < 75 && !sortedWeak.some(w => w.name === s.name));
  const masterySubjects = subjects.filter(s => s.score >= 75 && !sortedWeak.some(w => w.name === s.name));

  // Spillover Risk Score (0 - 100)
  let spilloverRiskIndex = 25;
  if (primaryWeak && primaryWeak.score < 45) spilloverRiskIndex += 30;
  if (secondaryWeak.length > 0) spilloverRiskIndex += 15 * secondaryWeak.length;
  if (borderlineSubjects.length >= 2) spilloverRiskIndex += 25;
  else if (borderlineSubjects.length === 1) spilloverRiskIndex += 15;
  if (riskLevel === 'HIGH') spilloverRiskIndex += 10;
  spilloverRiskIndex = Math.min(98, Math.max(15, spilloverRiskIndex));

  // Total weekly self-study budget: 22 hours
  const totalWeeklyHours = 22;

  // Multi-tier percentage distribution:
  // - Primary Remediation Target: 35%
  // - Secondary Weak Subjects Remediation: 25% (shared among 2nd/3rd weak)
  // - Borderline Maintenance Guard: 25% (protect against neglect)
  // - Mastery Retention Buffer: 15% (spaced repetition)
  let primaryShare = sortedWeak.length > 0 ? (sortedWeak.length >= 2 ? 35 : 45) : 0;
  let secondaryWeakPool = sortedWeak.length >= 2 ? 25 : 0;
  let borderlinePool = borderlineSubjects.length > 0 ? (sortedWeak.length >= 2 ? 25 : 35) : 0;
  let retentionPool = masterySubjects.length > 0 ? 15 : 0;

  // Normalize pools to sum to 100%
  const totalPool = primaryShare + secondaryWeakPool + borderlinePool + retentionPool;
  if (totalPool > 0 && totalPool !== 100) {
    const factor = 100 / totalPool;
    primaryShare = Math.round(primaryShare * factor);
    secondaryWeakPool = Math.round(secondaryWeakPool * factor);
    borderlinePool = Math.round(borderlinePool * factor);
    retentionPool = Math.max(0, 100 - (primaryShare + secondaryWeakPool + borderlinePool));
  }

  // Allocate per subject
  const subjectAllocations = subjects.map(s => {
    const isPrimary = primaryWeak && s.name === primaryWeak.name;
    const isSecondaryWeak = secondaryWeak.some(w => w.name === s.name);
    const isBorderline = s.score >= 50 && s.score < 75 && !isPrimary && !isSecondaryWeak;
    const isMastery = s.score >= 75 && !isPrimary && !isSecondaryWeak;

    let role = 'Retention & Buffer';
    let share = 0;
    let vulnerability = 'Low';
    let routine = 'Spaced repetition flashcards (20 min 2x/week)';

    if (isPrimary) {
      role = 'Primary Remediation Target';
      share = primaryShare;
      vulnerability = 'Critical Focus';
      routine = 'Deliberate practice + problem solving (4 sessions x 2 hours/week)';
    } else if (isSecondaryWeak) {
      role = 'Secondary Weak Remediation';
      share = Math.round(secondaryWeakPool / (secondaryWeak.length || 1));
      vulnerability = 'High Focus Required';
      routine = 'Remedial Exercises: 2 sessions x 1.5 hours/week focused on root-cause concepts';
    } else if (isBorderline) {
      role = 'Maintenance Anchor (Spillover Risk)';
      share = Math.round(borderlinePool / (borderlineSubjects.length || 1));
      vulnerability = 'High Neglect Vulnerability';
      routine = 'Cognitive Anchor: 45-min Active Recall + 1 weekly checkpoint quiz to prevent attention decay';
    } else if (isMastery) {
      role = 'Mastery Anchor & GPA Shield';
      share = Math.round(retentionPool / (masterySubjects.length || 1));
      vulnerability = 'Safe';
      routine = 'Retention Buffer: 30-min weekly summary review + peer mentoring';
    }

    const allocatedHours = Math.max(0.5, Math.round((share / 100) * totalWeeklyHours * 10) / 10);

    return {
      subject_name: s.name,
      current_score: Math.round(s.score),
      classification: s.classification,
      role,
      share_percentage: share,
      weekly_hours: allocatedHours,
      vulnerability,
      routine
    };
  });

  // Sort: Primary first, then Secondary Weak, then Borderline, then Mastery
  subjectAllocations.sort((a, b) => b.share_percentage - a.share_percentage);

  const guardrailRules = [
    {
      title: '50% Time Cap Principle',
      rule: 'Never allocate more than 50% of your total study time to one subject. Beyond 50%, cognitive fatigue increases while secondary subject retention drops exponentially.',
      badge: 'Time Budget Guard'
    },
    {
      title: 'Multi-Track Interleaved Study Blocks',
      rule: 'Follow the 50/25/15 Pomodoro Split: 50 mins on primary weak area, 25 mins on secondary weak/borderline maintenance, and 15 mins active recall.',
      badge: 'Retention Strategy'
    },
    {
      title: 'Borderline Subject Safety Net',
      rule: 'Schedule at least 1 weekly diagnostic quiz in borderline subjects (scoring 50-74%) to catch grade decay before it slides into the failing zone.',
      badge: 'Spillover Defense'
    },
    {
      title: 'Dynamic Equilibrium Re-balancing',
      rule: 'As your primary weak subject score improves past 65%, the algorithm dynamically redistributes study hours across secondary weak and borderline subjects.',
      badge: 'Adaptive Balance'
    }
  ];

  const weakNames = sortedWeak.map(w => w.name);
  const borderlineNames = borderlineSubjects.map(s => s.name);

  return {
    spillover_risk_index: spilloverRiskIndex,
    spillover_level: spilloverRiskIndex >= 65 ? 'HIGH SPILLOVER RISK' : spilloverRiskIndex >= 40 ? 'MODERATE SPILLOVER RISK' : 'BALANCED',
    primary_target: primaryWeak ? primaryWeak.name : 'Balanced Course Load',
    weak_count: sortedWeak.length,
    weak_subjects: weakNames,
    borderline_count: borderlineSubjects.length,
    borderline_subjects: borderlineNames,
    recommended_split: {
      primary_recovery: primaryShare,
      secondary_recovery: secondaryWeakPool,
      maintenance_anchor: borderlinePool,
      retention_buffer: retentionPool
    },
    total_weekly_budget_hours: totalWeeklyHours,
    spillover_warning: sortedWeak.length > 0
      ? `You have ${sortedWeak.length} subjects needing remediation (${weakNames.join(', ')}). Over-focusing exclusively on ${primaryWeak?.name} creates an estimated ${spilloverRiskIndex}% chance of performance decay in borderline courses (${borderlineNames.join(', ') || 'other subjects'}). An adaptive multi-track equilibrium plan has been generated to protect your entire semester CGPA.`
      : 'Your workload is balanced across all subjects with minimal spillover vulnerability.',
    subject_allocations: subjectAllocations,
    guardrail_rules: guardrailRules
  };
}

function generateWeeklyPlan(weakSubjects, allSubjectScores, riskLevel, attendanceRisk, assignmentRisk) {
  const weeks = [];
  const totalWeeks = riskLevel === 'HIGH' ? 8 : riskLevel === 'MEDIUM' ? 6 : 4;
  const primaryWeak = weakSubjects && weakSubjects.length > 0 ? weakSubjects[0] : null;
  const otherSubjects = (allSubjectScores || []).filter(s => !primaryWeak || s.name !== primaryWeak.name);
  const secondaryName = otherSubjects.length > 0 ? otherSubjects[0].name : 'Secondary Subjects';

  // Week 1 — Diagnostic & Multi-Subject Equilibrium Setup
  const w1Tasks = [
    { task: `Complete a self-diagnostic test for primary weak area (${primaryWeak ? primaryWeak.name : 'Weak Subjects'})`, category: 'Assessment', done: false },
    { task: 'List all topics you are uncertain about (create a "Confusion Log")', category: 'Planning', done: false },
    { task: `[Equilibrium Guard] Allocate 35% time to maintain ${secondaryName} to prevent attention-deficit decay`, category: 'Planning', done: false },
  ];
  if (attendanceRisk > 40) w1Tasks.push({ task: '⚠️ Contact your academic advisor about attendance records', category: 'Attendance', done: false });
  if (assignmentRisk > 40) w1Tasks.push({ task: '⚠️ Submit all pending assignments immediately — talk to faculty if needed', category: 'Assignment', done: false });
  weeks.push({ week: 1, title: 'Diagnostic & Balanced Foundation', focus: primaryWeak ? `${primaryWeak.name} + ${secondaryName} Equilibrium` : 'Assessment', tasks: w1Tasks });

  // Week 2 — Targeted Remediation with Interleaving
  const topWeak = weakSubjects.slice(0, 3);
  const w2Tasks = topWeak.map(s => ({ task: `Begin chapter-by-chapter review of ${s.name} (currently ${s.score.toFixed(0)}%)`, category: 'Subject Remediation', done: false }));
  w2Tasks.push({ task: `[Spillover Prevention] Complete 45-min Active Recall session for ${secondaryName} to lock in core concepts`, category: 'Planning', done: false });
  w2Tasks.push({ task: 'Join or form a study group with students stronger in your weak subjects', category: 'Peer Learning', done: false });
  weeks.push({ week: 2, title: 'Targeted Remediation & Active Recall', focus: topWeak.map(s => s.name).join(', ') || 'Weak Subjects', tasks: w2Tasks });

  // Week 3 — Dual-Subject Practice & Active Recall
  const w3Tasks = [
    { task: `Take 1 full mock test in ${primaryWeak ? primaryWeak.name : 'weak subjects'} using past exam papers`, category: 'Practice', done: false },
    { task: `[Cross-Subject Anchor] Spend 30 mins doing rapid formula flashcards for ${secondaryName}`, category: 'Memory', done: false },
    { task: 'Attend all faculty-led tutorial sessions this week without exception', category: 'Attendance', done: false },
  ];
  if (topWeak[0]) w3Tasks.push({ task: `Cap primary focus at 50% on ${topWeak[0].name} to preserve cognitive energy for other classes`, category: 'Subject Remediation', done: false });
  weeks.push({ week: 3, title: 'Active Recall & Interleaved Mock Testing', focus: 'Practice & Balance', tasks: w3Tasks });

  // Week 4 — Mid-point Equilibrium Review
  const w4Tasks = [
    { task: 'Re-take the Week 1 diagnostic — compare scores and verify improvement', category: 'Assessment', done: false },
    { task: `[Full Semester Audit] Check that marks in ${secondaryName} have not declined while focusing on weak areas`, category: 'Assessment', done: false },
    { task: 'Update your "Confusion Log" — strike through resolved topics', category: 'Reflection', done: false },
    { task: 'Discuss your balanced progress plan with your faculty advisor', category: 'Mentorship', done: false },
  ];
  if (weakSubjects.length > 3) w4Tasks.push({ task: `Start secondary focus on ${weakSubjects[3]?.name || 'your 4th weakest subject'}`, category: 'Subject Remediation', done: false });
  weeks.push({ week: 4, title: 'Mid-Point Equilibrium & Pivot', focus: 'Reassessment & Health Check', tasks: w4Tasks });

  if (totalWeeks >= 6) {
    // Week 5 — Advanced Problem Solving & Multi-Subject Sprints
    weeks.push({
      week: 5, title: 'Advanced Problem Solving & Multi-Track Sprints', focus: 'Depth Practice',
      tasks: [
        { task: `Solve application-level & reasoning problems in ${primaryWeak ? primaryWeak.name : 'primary target'}`, category: 'Practice', done: false },
        { task: `[Spillover Shield] Complete 1 timed mock question set for ${secondaryName}`, category: 'Practice', done: false },
        { task: 'Complete 2 full-length past exam papers under timed conditions', category: 'Exam Prep', done: false },
        { task: 'Analyse your incorrect answers — classify errors (concept / calculation / silly)', category: 'Error Analysis', done: false },
      ]
    });
    // Week 6 — Integration & Multi-Subject Exam Strategy
    weeks.push({
      week: 6, title: 'Integration & Exam Strategy', focus: 'Exam Preparation',
      tasks: [
        { task: 'Create 1-page formula/concept sheets for ALL semester subjects (not just weak ones)', category: 'Summary', done: false },
        { task: 'Simulate full exam day conditions: multi-subject timed papers in one sitting', category: 'Exam Prep', done: false },
        { task: 'Review all past intervention notes and advisor feedback', category: 'Reflection', done: false },
      ]
    });
  }

  if (totalWeeks === 8) {
    // Week 7 — Consolidation & Comprehensive Review
    weeks.push({
      week: 7, title: 'Consolidation & Cognitive Confidence', focus: 'Final Review',
      tasks: [
        { task: 'Revise all 1-page summary sheets across all subjects daily (30m per subject)', category: 'Revision', done: false },
        { task: 'Practice explaining difficult concepts out loud ("Feynman Technique")', category: 'Deep Learning', done: false },
        { task: 'Get adequate sleep (8 hrs), reduce exam anxiety through routine', category: 'Wellness', done: false },
      ]
    });
    // Week 8 — Final Sprint & Semester Readiness
    weeks.push({
      week: 8, title: 'Final Sprint & Semester Readiness', focus: 'Exam Week',
      tasks: [
        { task: 'Light balanced revision only — no heavy cramming in final 3 days', category: 'Exam Prep', done: false },
        { task: 'Review your strongest subjects briefly to maintain peak confidence', category: 'Confidence', done: false },
        { task: 'Ensure all academic formalities (attendance, lab records, submissions) are 100% complete', category: 'Administration', done: false },
      ]
    });
  }

  return weeks;
}

async function generateAcademicRoadmap(studentId) {
  studentId = parseInt(studentId);
  if (isNaN(studentId)) throw new Error('Invalid student ID');

  // Gather all relevant data
  const [profile, riskData, weakAreas] = await Promise.all([
    getStudentFullProfile(studentId),
    calculateRiskScore(studentId),
    detectWeakAreas(studentId)
  ]);

  const { student, performance, risk, skills } = profile;
  const rfRow = await pool.query('SELECT * FROM risk_factors WHERE student_id = $1', [studentId]);
  const rf = rfRow.rows[0] || {};

  const attendanceRisk = Number(rf.attendance_score || 30);
  const assignmentRisk = Number(rf.assignment_score || 30);
  const weakSubjects = weakAreas.filter(a => a.type === 'subject');
  const weakSkills = weakAreas.filter(a => a.type === 'activity');
  const allSubjectScores = performance.subject_scores || [];

  // Generate subject-specific action items
  const subjectActions = weakSubjects.map(s => {
    const cat = getSubjectCategory(s.name);
    const resources = SUBJECT_RESOURCES[cat] || SUBJECT_RESOURCES.default;
    const gap = 75 - s.score; // gap to "GOOD" threshold
    return {
      subject: s.name,
      current_score: Math.round(s.score),
      target_score: 75,
      gap: Math.round(gap),
      semester: s.semester,
      trend: s.trend,
      category: cat,
      resources,
      estimated_weeks_to_target: gap <= 10 ? 2 : gap <= 20 ? 4 : gap <= 30 ? 6 : 8,
      priority: s.score < 40 ? 'critical' : s.score < 60 ? 'high' : 'medium'
    };
  }).sort((a, b) => a.current_score - b.current_score); // worst first

  // Generate multi-subject balance & spillover prevention model
  const multiSubjectBalance = calculateMultiSubjectBalance(allSubjectScores, weakSubjects, risk.risk_level, student.semester);

  // Generate weekly plan with interleaved balance guardrails
  const weekly_plan = generateWeeklyPlan(weakSubjects, allSubjectScores, risk.risk_level, attendanceRisk, assignmentRisk);

  // Generate personalised summary
  const summaryLines = [];
  summaryLines.push(`Based on your current academic profile, a ${weekly_plan.length}-week personalised recovery roadmap has been generated.`);
  if (weakSubjects.length > 0) summaryLines.push(`Priority remediation target: ${weakSubjects.slice(0, 2).map(s => s.name).join(' & ')}.`);
  if (multiSubjectBalance.borderline_count > 0) {
    summaryLines.push(`Adaptive Balance Alert: You have ${multiSubjectBalance.borderline_count} borderline subject(s) (${multiSubjectBalance.borderline_subjects.join(', ')}). A 45/35/20 time split is enforced so you don't lose ground in other courses while fixing weak areas.`);
  }
  if (attendanceRisk > 50) summaryLines.push('Your attendance pattern is a significant risk factor. Consistent class attendance will have the highest immediate impact on your risk score.');
  if (assignmentRisk > 50) summaryLines.push('Pending assignments are weighing heavily on your academic standing. Complete all overdue work as the first action this week.');
  if (risk.risk_level === 'LOW') summaryLines.push('You are on track! This roadmap will help you maintain balanced excellence across all subjects.');

  // Key milestones
  const milestones = [
    { week: Math.ceil(weekly_plan.length * 0.25), milestone: 'Diagnostic completion & balanced timetable lock', achieved: false },
    { week: Math.ceil(weekly_plan.length * 0.5), milestone: 'Mid-point review — measurable jump in weak subject with zero decay in other courses', achieved: false },
    { week: Math.ceil(weekly_plan.length * 0.75), milestone: 'Multi-subject simulated mock exams completed', achieved: false },
    { week: weekly_plan.length, milestone: 'Final semester readiness — balanced excellence achieved', achieved: false },
  ];

  const roadmap = {
    student_id: studentId,
    student_name: student.name,
    generated_at: new Date().toISOString(),
    risk_level: risk.risk_level,
    risk_score: risk.risk_score,
    overall_score: performance.overall_score,
    duration_weeks: weekly_plan.length,
    summary: summaryLines,
    subject_actions: subjectActions,
    skill_gaps: weakSkills.map(s => ({ name: s.name, score: Math.round(s.score), gap: Math.max(0, 75 - s.score) })),
    multi_subject_balance: multiSubjectBalance,
    weekly_plan,
    milestones,
    attendance_alert: attendanceRisk > 50,
    assignment_alert: assignmentRisk > 50,
    top_priority: weakSubjects[0]?.name || null
  };

  return roadmap;
}

module.exports = {
  calculateStudentPerformance,
  detectWeakAreas,
  calculateRiskScore,
  generateAlerts,
  recalculateStudent,
  recalculateAll,
  getStudentFullProfile,
  generateAcademicRoadmap
};
